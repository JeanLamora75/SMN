import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {randomUUID} from "node:crypto";
import {parseFlowCounts,ensureKanbanFlowSchema} from "./flow-counts";
import {parseTiming,ensureKanbanTimingSchema} from "./timing";
export function parseMetricsDraft(raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="counts,timing")return null;
 const counts=parseFlowCounts(v.counts),timing=parseTiming(v.timing);
 return counts&&timing?{counts,timing}:null;
}
export async function saveKanbanMetrics(db:Client,periodId:string,actorId:string,raw:unknown,
 access?:{actor:TeamActor;teamId:string}){
 const input=parseMetricsDraft(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanFlowSchema(db);await ensureKanbanTimingSchema(db);
 await db.query("BEGIN");
 try{
  const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
  if(access&&(access.actor.accountId!==actorId||team?.mode!=="kanban"))
   throw Error("team-access-forbidden");
  const criterion=team?
   "AND p.team_id=$2 AND i.schema_version IN (28,29,30) AND lower(t.agile_mode)='kanban' AND t.is_archived=false":
   "AND i.schema_version<=27 AND lower(i.mode)='kanban'";
  const p=await db.query<{status:string}>(`SELECT p.status FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
   ${criterion} FOR UPDATE OF p`,team?[periodId,team.team_id]:[periodId]);
  if(!p.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(p.rows[0].status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const oldCounts=await db.query("SELECT started,throughput,wip_final FROM public.smn_kanban_flow_counts WHERE period_id=$1 FOR UPDATE",[periodId]);
  const oldTiming=await db.query("SELECT * FROM public.smn_kanban_timing WHERE period_id=$1 FOR UPDATE",[periodId]);
  const {counts,timing}=input;
  await db.query(`INSERT INTO public.smn_kanban_flow_counts(period_id,started,throughput,wip_final,updated_by)
   VALUES($1,$2,$3,$4,$5) ON CONFLICT(period_id) DO UPDATE SET started=EXCLUDED.started,
   throughput=EXCLUDED.throughput,wip_final=EXCLUDED.wip_final,updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [periodId,counts.started,counts.throughput,counts.wipFinal,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_timing
   (period_id,cycle_days,cycle_convention,cycle_source,lead_days,lead_convention,lead_source,updated_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(period_id) DO UPDATE SET
   cycle_days=EXCLUDED.cycle_days,cycle_convention=EXCLUDED.cycle_convention,
   cycle_source=EXCLUDED.cycle_source,lead_days=EXCLUDED.lead_days,
   lead_convention=EXCLUDED.lead_convention,lead_source=EXCLUDED.lead_source,
   updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [periodId,timing.cycle.days,timing.cycle.convention,timing.cycle.source,
    timing.lead.days,timing.lead.convention,timing.lead.source,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_flow_audit(id,period_id,previous_values,next_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
   [randomUUID(),periodId,oldCounts.rows[0]?JSON.stringify(oldCounts.rows[0]):null,JSON.stringify(counts),actorId]);
  await db.query(`INSERT INTO public.smn_kanban_timing_audit(id,period_id,before_values,after_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
   [randomUUID(),periodId,oldTiming.rows[0]?JSON.stringify(oldTiming.rows[0]):null,JSON.stringify(timing),actorId]);
  await db.query("COMMIT");
  return {ok:true as const};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
