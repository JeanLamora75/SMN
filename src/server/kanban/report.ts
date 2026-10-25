import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
import {reconcileKanbanStates} from "./states";
import {readKanbanCapacityView,parseFrozenKanbanCapacity} from "./capacity-view";

export const kanbanReportBlocks=["objectives","metrics","capacity","trends"] as const;
export function reportProvisional(status:string){return status==="active"||status==="finished";}
export async function readKanbanPeriodReport(db:Client,id:string){
 await ensureKanbanPeriodTables(db);
 await reconcileKanbanStates(db);
 const result=await db.query<{id:string;name:string;status:string;start_on:string;end_on:string;time_zone:string;team_name:string;team_id:string;initial_jh:string|null;capacity_provenance:string|null}>(`
 SELECT p.id,p.name,p.status,p.start_on::text,p.end_on::text,p.time_zone,
 t.name AS team_name,p.team_id, c.initial_jh::text,c.provenance AS capacity_provenance
 FROM public.smn_kanban_period p
 JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 LEFT JOIN public.smn_kanban_capacity_opening c ON c.period_id=p.id
 WHERE p.id=$1 AND p.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'
 `,[id]);
 if(result.rows.length!==1)return null;
 const p=result.rows[0];
 // Closed reports are immutable: use their latest stored Vn, never live availability.
 const archived=p.status==="closed"?
  await db.query<{snapshot:unknown}>(`
   SELECT snapshot FROM public.smn_kanban_closure
   WHERE period_id=$1 ORDER BY version DESC LIMIT 1`,[p.id]).catch(()=>null):null;
 const capacity=p.status==="closed"?
  parseFrozenKanbanCapacity(archived?.rows[0]?.snapshot):
  await readKanbanCapacityView(db,p.team_id,p.start_on,p.end_on,p.status,p.id).catch(()=>null);
 return {
  period:{id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status,timeZone:p.time_zone,team:p.team_name},
  provisional:reportProvisional(p.status),
  blocks:{
   objectives:{state:"not-collected" as const,items:[]},
   metrics:{state:"not-collected" as const,items:[]},
   capacity:{state:!capacity?"unavailable" as const:"available" as const,
    initialJh:p.status==="closed"?capacity?.initialJh??null:
     capacity?.initialJh??(p.initial_jh===null?null:Number(p.initial_jh)),
    provenance:capacity?.initialProvenance??p.capacity_provenance??"not-captured",
    actualOpenedAt:capacity?.actualOpenedAt??null,
    actualReferenceJh:capacity?.actualReferenceJh??null,
    actualManualJh:capacity?.actualManualJh??null,
    realizedJh:capacity?.actualRetainedJh??null,
    actualSource:capacity?.actualSource??"Non renseigné",
    gapJh:capacity?.gapJh??null,
    observedThrough:capacity?.observedThrough??null,
    missingSources:capacity?.missingSources??[]},
   trends:{state:"not-collected" as const,items:[]}
  }
 };
}
