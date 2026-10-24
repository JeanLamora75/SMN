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
 const actual=await readActualCapacity(db,startOn,endOn,undefined,{externalTransaction:true});
 // Do not present a calculated future value as observed capacity.
 const future=status==="planned"||actual.status==="upcoming";
 const retained=future?null:actual.retainedJh;
 const reference=future?null:actual.referenceJh;
 const manual=future?null:actual.manualJh;
 return {
  initialJh:initial?.initialJh??null,initialProvenance:initial?.provenance??"Non renseigné",
  actualOpenedAt:initial?.actualOpenedAt??null,
  actualReferenceJh:reference,actualManualJh:manual,actualRetainedJh:retained,
  actualSource:future?"Non renseigné":actual.source,
  gapJh:safeKanbanGap(initial?.initialJh??null,retained,status),
  observedThrough:future?null:actual.observedThrough,
  realStatus:status,missingSources:actual.missingSources
 };
}
