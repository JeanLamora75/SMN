import type {Client} from "pg";
import {readActualCapacity} from "@/server/capacity/actual";
import {readInitialSnapshot} from "@/server/capacity/opening";

export type KanbanCapacityView={
 initialJh:number|null;initialProvenance:string;actualOpenedAt:string|null;
 actualReferenceJh:number|null;actualManualJh:number|null;actualRetainedJh:number|null;
 actualSource:string;gapJh:number|null;observedThrough:string|null;
 realStatus:string;missingSources:string[];
};
export function safeKanbanGap(initial:number|null,real:number|null,status:string):number|null{
 if(status!=="finished"&&status!=="closed")return null;
 if(initial===null||real===null)return null;
 return Math.round((real-initial)*10000)/10000;
}
export async function readKanbanCapacityView(db:Client,teamId:string,startOn:string,endOn:string,status:string):Promise<KanbanCapacityView>{
 // These are shared capacity-engine data only. Never synthesize JH from Kanban item counts.
 const initial=await readInitialSnapshot(db,teamId,startOn,endOn);
 const kanbanOpening=await db.query<{initial_jh:string|null;provenance:string;captured_at:string}>(`SELECT k.initial_jh::text,k.provenance,k.captured_at::text FROM public.smn_kanban_capacity_opening k JOIN public.smn_kanban_period p ON p.id=k.period_id WHERE p.team_id=$1 AND p.start_on=$2::date AND p.end_on=$3::date AND p.deleted_at IS NULL LIMIT 1`,[teamId,startOn,endOn]);
 const capture=kanbanOpening.rows[0];
 const initialValue=initial?.initialJh??(capture?.initial_jh===null||!capture?null:Number(capture.initial_jh));
 const actual=await readActualCapacity(db,startOn,endOn,undefined,{externalTransaction:true});
 // Do not present a calculated future value as observed capacity.
 const future=status==="planned"||actual.status==="upcoming";
 const retained=future?null:actual.retainedJh;
 const reference=future?null:actual.referenceJh;
 const manual=future?null:actual.manualJh;
 return {
  initialJh:initialValue,initialProvenance:initial?.provenance??capture?.provenance??"Non renseigné",
  actualOpenedAt:initial?.actualOpenedAt??capture?.captured_at??null,
  actualReferenceJh:reference,actualManualJh:manual,actualRetainedJh:retained,
  actualSource:future?"Non renseigné":actual.source,
  gapJh:safeKanbanGap(initialValue,retained,status),
  observedThrough:future?null:actual.observedThrough,
  realStatus:status,missingSources:actual.missingSources
 };
}
// Resolve by stable period identity when available: replanification must not lose the opening snapshot.
export async function readKanbanOpeningByPeriodId(db:Client,periodId:string){
 const r=await db.query<{initial_jh:string|null;provenance:string;captured_at:string}>(`
 SELECT initial_jh::text,provenance,captured_at::text FROM public.smn_kanban_capacity_opening
 WHERE period_id=$1`,[periodId]);
 const row=r.rows[0];
 return row?{initialJh:row.initial_jh===null?null:Number(row.initial_jh),
  provenance:row.provenance,capturedAt:row.captured_at}:null;
}
