import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {scopedKanbanPeriod,type KanbanTeamAccess} from "@/server/kanban/scoped-period";
import {ensureKanbanPeriodTables} from "./periods";
export type FlowCounts={started:number|null;throughput:number|null;wipFinal:number|null};
export function parseFlowCounts(raw:unknown):FlowCounts|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="started,throughput,wipFinal")return null;
 for(const key of ["started","throughput","wipFinal"] as const){
  const n=v[key];
  if(n!==null&&(!Number.isSafeInteger(n)||Number(n)<0))return null;
 }
 return {started:v.started as number|null,throughput:v.throughput as number|null,wipFinal:v.wipFinal as number|null};
}
export async function ensureKanbanFlowSchema(db:Client){
 await ensureKanbanPeriodTables(db);
 await assertKanbanSchema(db,"smn_kanban_flow_counts");
 await assertKanbanSchema(db,"smn_kanban_flow_audit");
}
export async function readKanbanFlow(db:Client,id:string,access?:KanbanTeamAccess){
 await ensureKanbanFlowSchema(db);
 const p=await scopedKanbanPeriod(db,id,false,access);
 if(!p)return null;
 const r=await db.query<{started:string|null;throughput:string|null;wip_final:string|null;updated_at:string}>(`SELECT started::text,throughput::text,wip_final::text,updated_at::text
 FROM public.smn_kanban_flow_counts WHERE period_id=$1`,[id]);
 const x=r.rows[0];
 return {counts:{started:x?.started===null||!x?null:Number(x.started),throughput:x?.throughput===null||!x?null:Number(x.throughput),wipFinal:x?.wip_final===null||!x?null:Number(x.wip_final)},updatedAt:x?.updated_at??null,status:p.status};
}
export async function saveKanbanFlow(db:Client,actorId:string,id:string,raw:unknown,access?:KanbanTeamAccess){
 const counts=parseFlowCounts(raw);
 if(!counts)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanFlowSchema(db);
 await db.query("BEGIN");
 try{
  const p=await scopedKanbanPeriod(db,id,true,access,actorId);
  if(!p){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(p.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const before=await db.query(`SELECT started,throughput,wip_final FROM public.smn_kanban_flow_counts WHERE period_id=$1 FOR UPDATE`,[id]);
  await db.query(`INSERT INTO public.smn_kanban_flow_counts(period_id,started,throughput,wip_final,updated_by)
  VALUES($1,$2,$3,$4,$5) ON CONFLICT(period_id) DO UPDATE SET started=EXCLUDED.started,
  throughput=EXCLUDED.throughput,wip_final=EXCLUDED.wip_final,updated_by=EXCLUDED.updated_by,updated_at=now()`,
  [id,counts.started,counts.throughput,counts.wipFinal,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_flow_audit(id,period_id,previous_values,next_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),id,before.rows[0]?JSON.stringify(before.rows[0]):null,JSON.stringify(counts),actorId]);
  await db.query("COMMIT");return {ok:true as const,counts};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
