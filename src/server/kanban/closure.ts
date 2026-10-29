import {assertKanbanSchema} from "./schema-ready";
import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanGoals} from "./goals";
import {ensureKanbanFlowSchema} from "./flow-counts";
import {ensureKanbanTimingSchema} from "./timing";
import {reconcileKanbanStates} from "./states";
import {ensureKanbanMeetingSchema} from "./meetings";
import {readKanbanCapacityView} from "./capacity-view";
import {captureKanbanQualitative} from "./qualitative";
export function nextClosureVersion(versions:number[]){return versions.length?Math.max(...versions)+1:1;}
export async function ensureKanbanClosures(db:Client){
 await ensureKanbanGoals(db);await ensureKanbanFlowSchema(db);await ensureKanbanTimingSchema(db);
 await ensureKanbanMeetingSchema(db);
 await assertKanbanSchema(db,"smn_kanban_closure");
}
export async function readKanbanClosures(db:Client,id:string){
 await ensureKanbanClosures(db);
 const result=await db.query<{version:number;snapshot:unknown;created_at:string;created_by:string|null}>(`
 SELECT c.version,c.snapshot,c.created_at::text,c.created_by FROM public.smn_kanban_closure c
 JOIN public.smn_kanban_period p ON p.id=c.period_id JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE c.period_id=$1 AND i.id='singleton' AND lower(i.mode)='kanban'
 ORDER BY c.version DESC`,[id]);
 return result.rows.map(p=>({version:p.version,snapshot:p.snapshot,createdAt:p.created_at,createdBy:p.created_by}));
}
export async function changeKanbanClosure(db:Client,id:string,actorId:string,action:"close"|"reopen"){
 await ensureKanbanClosures(db);
 await reconcileKanbanStates(db);
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
 try{
  const row=await db.query<{id:string;team_id:string;status:string;name:string;start_on:string;end_on:string;time_zone:string}>(`
  SELECT p.id,p.team_id,p.status,p.name,p.start_on::text,p.end_on::text,p.time_zone
  FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  AND lower(i.mode)='kanban' FOR UPDATE OF p`,[id]);
  const period=row.rows[0];
  if(!period){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[period.team_id+":kanban-period"]);
  if(action==="reopen"){
   if(period.status!=="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-state"};}
   await db.query("UPDATE public.smn_kanban_period SET status='finished' WHERE id=$1",[id]);
   await db.query(`INSERT INTO public.smn_kanban_period_audit(id,period_id,action,details,actor_id)
   VALUES($1,$2,'reopened',$3::jsonb,$4)`,[randomUUID(),id,JSON.stringify({from:"closed",to:"finished"}),actorId]);
   await db.query("COMMIT");return {ok:true as const,action,version:null};
  }
  if(period.status!=="finished"){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-state"};}
  const now=await db.query<{today:string}>(`SELECT (now() AT TIME ZONE $1)::date::text AS today`,[period.time_zone]);
  if(!now.rows[0]||period.end_on>=now.rows[0].today){await db.query("ROLLBACK");return {ok:false as const,error:"not-finished"};}
  const versions=await db.query<{version:number}>(`SELECT version FROM public.smn_kanban_closure WHERE period_id=$1 ORDER BY version DESC LIMIT 1 FOR UPDATE`,[id]);
  const version=(versions.rows[0]?.version??0)+1;
  const goals=(await db.query(`SELECT id,title,description,evaluation,comment,revision FROM public.smn_kanban_goal WHERE period_id=$1 ORDER BY created_at,id`,[id])).rows;
  const flow=(await db.query(`SELECT started::text,throughput::text,wip_final::text FROM public.smn_kanban_flow_counts WHERE period_id=$1`,[id])).rows[0]??null;
  const timing=(await db.query(`SELECT cycle_days::text,cycle_convention,cycle_source,lead_days::text,lead_convention,lead_source FROM public.smn_kanban_timing WHERE period_id=$1`,[id])).rows[0]??null;
  const capacity=await readKanbanCapacityView(db,period.team_id,period.start_on,period.end_on,"finished",period.id);
  const events=(await db.query(`SELECT id,name,starts_at::text AS "startAt",ends_at::text AS "endAt",status,provenance,created_at::text AS "createdAt"
   FROM public.smn_kanban_meeting WHERE period_id=$1 ORDER BY starts_at,id`,[id])).rows;
  const qualitativeLinks=await captureKanbanQualitative(db,id,period.team_id);
  const snapshot={period:{id,name:period.name,startOn:period.start_on,endOn:period.end_on,status:"closed",timeZone:period.time_zone},
   goals,flow,timing,capacity,qualitativeLinks,events:{state:"captured",items:events}};
  await db.query(`INSERT INTO public.smn_kanban_closure(id,period_id,version,snapshot,created_by)
   VALUES($1,$2,$3,$4::jsonb,$5)`,[randomUUID(),id,version,JSON.stringify(snapshot),actorId]);
  await db.query("UPDATE public.smn_kanban_period SET status='closed' WHERE id=$1",[id]);
  await db.query(`INSERT INTO public.smn_kanban_period_audit(id,period_id,action,details,actor_id)
   VALUES($1,$2,'closed',$3::jsonb,$4)`,[randomUUID(),id,JSON.stringify({version}),actorId]);
  await db.query("COMMIT");return {ok:true as const,action,version};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
