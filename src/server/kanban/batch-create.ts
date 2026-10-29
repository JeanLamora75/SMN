import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
import {ensureKanbanCadenceTable,type KanbanFrequency} from "./cadence";
import {batchPreview} from "./batch-preview";

type Request={startOn:string;quantity:number;cadenceRevision:number};
export function parseBatchRequest(raw:unknown):Request|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).sort().join(",")!=="cadenceRevision,quantity,startOn"||
 typeof o.startOn!=="string"||!Number.isInteger(o.quantity)||Number(o.quantity)<2||Number(o.quantity)>6||
 !Number.isSafeInteger(o.cadenceRevision)||Number(o.cadenceRevision)<1)return null;
 return o as Request;
}
export async function createKanbanBatch(db:Client,actorId:string,raw:unknown){
 const request=parseBatchRequest(raw);
 if(!request)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanCadenceTable(db);
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`);
  if(teams.rows.length!==1)throw Error("kanban-team-unavailable");
  const teamId=teams.rows[0].id;
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId+":kanban-period"]);
  const cadenceResult=await db.query<{frequency:KanbanFrequency;revision:number;time_zone:string}>(`SELECT frequency,revision,time_zone
   FROM public.smn_kanban_cadence WHERE team_id=$1 FOR UPDATE`,[teamId]);
  if(cadenceResult.rows.length!==1)throw Error("kanban-cadence-unavailable");
  const cadence=cadenceResult.rows[0];
  if(cadence.revision!==request.cadenceRevision){
   await db.query("ROLLBACK");return {ok:false as const,error:"stale-preview" as const};
  }
  const existing=await db.query<{id:string;start_on:string;end_on:string}>(`SELECT id,start_on::text,end_on::text FROM public.smn_kanban_period WHERE team_id=$1 AND deleted_at IS NULL`,[teamId]);
  let preview:ReturnType<typeof batchPreview>;
  try{preview=batchPreview(request.startOn,request.quantity,cadence.frequency,
   existing.rows.map(x=>({id:x.id,startOn:x.start_on,endOn:x.end_on}))); }
  catch{await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input" as const};}
  if(!preview.canConfirm){await db.query("ROLLBACK");return {ok:false as const,error:"overlap" as const,items:preview.items};}
  const batchId=randomUUID();
  const created=preview.items.map(item=>({id:randomUUID(),name:item.name,startOn:item.startOn,endOn:item.endOn}));
  await assertKanbanSchema(db,"smn_kanban_batch_audit");
  for(const period of created){
   await db.query(`INSERT INTO public.smn_kanban_period
    (id,team_id,name,start_on,end_on,time_zone,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [period.id,teamId,period.name,period.startOn,period.endOn,cadence.time_zone,actorId]);
   await db.query(`INSERT INTO public.smn_kanban_period_audit
    (id,period_id,action,details,actor_id) VALUES($1,$2,'created',$3::jsonb,$4)`,
    [randomUUID(),period.id,JSON.stringify({...period,batchId,cadence:cadence.frequency}),actorId]);
  }
  await db.query(`INSERT INTO public.smn_kanban_batch_audit
   (id,team_id,actor_id,cadence,quantity,cadence_revision,periods)
   VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)`,
   [batchId,teamId,actorId,cadence.frequency,created.length,cadence.revision,JSON.stringify(created)]);
  await db.query("COMMIT");
  return {ok:true as const,batchId,periods:created};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
