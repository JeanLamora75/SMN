import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";

type Row={id:string;name:string;start_on:string;end_on:string;status:string;created_at:string;created_by:string|null};
export function deletionEligibility(status:string,startOn:string,today:string,wasStarted:boolean){
 return status==="planned"&&startOn>today&&!wasStarted;
}
export async function kanbanDeletionSummary(db:Client,id:string){
 await ensureKanbanPeriodTables(db);
 const r=await db.query<Row>(`SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status,p.created_at::text,p.created_by
 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE p.id=$1 AND i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='kanban'
 AND p.deleted_at IS NULL`,[id]);
 if(!r.rows.length)return null;
 const period=r.rows[0];
 const history=await db.query<{count:string}>(`SELECT count(*)::text AS count FROM public.smn_kanban_period_audit
 WHERE period_id=$1 AND action NOT IN ('created','renamed')`,[id]);
 const wasStarted=Number(history.rows[0].count)>0;
 const todayResult=await db.query<{today:string}>(`SELECT (now() AT TIME ZONE p.time_zone)::date::text AS today
 FROM public.smn_kanban_period p WHERE p.id=$1`,[id]);
 const eligible=deletionEligibility(period.status,period.start_on,todayResult.rows[0].today,wasStarted);
 return {period,eligible,wasStarted,relations:[{type:"period-audit",count:Number(history.rows[0].count),action:"preserved"}],
  action:"soft-delete" as const};
}
export async function deleteKanbanPeriod(db:Client,actorId:string,id:string,expected:{name:string;startOn:string;endOn:string}){
 if(!expected||typeof expected.name!=="string"||typeof expected.startOn!=="string"||typeof expected.endOn!=="string")
  return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const r=await db.query<{id:string;team_id:string}>(`SELECT p.id,p.team_id FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE p.id=$1 AND i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='kanban'
   AND p.deleted_at IS NULL FOR UPDATE OF p`,[id]);
  if(!r.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  const summary=await kanbanDeletionSummary(db,id);
  if(!summary?.eligible){await db.query("ROLLBACK");return {ok:false as const,error:"protected-period" as const};}
  if(summary.period.name!==expected.name||summary.period.start_on!==expected.startOn||summary.period.end_on!==expected.endOn){
   await db.query("ROLLBACK");return {ok:false as const,error:"stale-summary" as const};
  }
  await db.query(`UPDATE public.smn_kanban_period SET deleted_at=now(),deleted_by=$2 WHERE id=$1`,[id,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_period_audit(id,period_id,action,details,actor_id)
   VALUES($1,$2,'deleted',$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify({method:"soft-delete",name:summary.period.name,
     startOn:summary.period.start_on,endOn:summary.period.end_on,relations:summary.relations}),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,deletedId:id};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
