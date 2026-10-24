import type {Client} from "pg";
import {composeStandardReport} from "./standard-composition";
import {selectedReportAnalyses} from "./analysis-choices";
import {readReportSectionOptions} from "./section-options";
import {readReportContentOptions} from "./content-options";
import {readReportDraft} from "./draft-notes";
import {readTeamContextChoices} from "./team-context-options";
import {readTeamReportContext} from "./team-context-read";
import {readReportHistoryOptions} from "./history-options";
import {readReportTrends} from "./history-trends";
import {orderReportSections} from "@/lib/report-section-options";
import {projectSelectedMetrics,eligibleReportFact} from "@/lib/report-content-options";
import {selectedTeamContext} from "@/lib/report-team-context";
import {safeCollectiveContext,safeCollectiveItems} from "@/lib/report-privacy";
export async function composeHtmlReportPreview(db:Client,sprintId:string){
 const report=await composeStandardReport(db,sprintId);
 if(!report)return null;
 const [sections,contents,draft,contextOptions,context,history]=await Promise.all([
 readReportSectionOptions(db,sprintId),readReportContentOptions(db,sprintId),
 readReportDraft(db,sprintId),readTeamContextChoices(db,sprintId),
 readTeamReportContext(db,report.sprint.teamId),readReportHistoryOptions(db,sprintId)
 ]);
 const projection=report.projection.scrum;
 const metrics=projectSelectedMetrics({committed:projection.storyPoints.committed.value,
 completed:projection.storyPoints.completed.value,planned:projection.capacity.planned.value,
 actual:projection.capacity.actual.value},contents.options);
 const filtered=orderReportSections(report.sections,sections.options).map(section=>{
 if(section.key==="indicators")return {...section,items:[],state:"empty" as const};
 if(section.key==="attention"||section.key==="decisions")return {...section,
 items:section.items.filter(item=>{
 // Legacy qualitative rows do not expose trustworthy type/visibility; suppress instead of leaking.
 return false;
 }),state:"unavailable" as const};
 return section;
 });
 const chosen=filtered.map(section=>section.key==="indicators"?{
 ...section,items:metrics.map(m=>({label:m.key,detail:m.available?String(m.value)+" "+m.unit:"",href:null})),
 state:metrics.some(m=>m.available)?"available" as const:"unavailable" as const
 }:{...section,items:safeCollectiveItems(section.items)});
 const marker=await db.query<{historical:boolean}>(`SELECT EXISTS(SELECT 1 FROM public.smn_sprint_audit WHERE sprint_id=$1 AND action='historical-created') AS historical`,[sprintId]);
 const historical=marker.rows[0]?.historical===true;
 const historicalClosure=historical&&report.sprint.status==="closed"?await db.query<{snapshot:unknown}>(`SELECT snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]):null;
 const frozen=historicalClosure?.rows[0]?.snapshot;
 const snapshotData=frozen&&typeof frozen==="object"&&!Array.isArray(frozen)?frozen as Record<string,unknown>:null;
 const capacity=snapshotData?.capacity&&typeof snapshotData.capacity==="object"?snapshotData.capacity as Record<string,unknown>:null;
 const qualities=snapshotData?.historicalMetricQualities&&typeof snapshotData.historicalMetricQualities==="object"?snapshotData.historicalMetricQualities as Record<string,unknown>:null;
 const historicalEvidence=historical?{
  retrospective:true as const,qualitySource:report.sprint.status==="closed"?"closure-snapshot" as const:"current-unclosed" as const,
  capacityPlannedQuality:typeof capacity?.initialQuality==="string"?capacity.initialQuality:"not-supplied",
  capacityActualQuality:typeof capacity?.actualQuality==="string"?capacity.actualQuality:"not-supplied",
  completedSpQuality:qualities?.SP_DONE==="estimated"?"estimated":qualities?.SP_DONE==="known"?"known":"not-supplied",
  registryState:"historical-unavailable" as const
 }:null;
 const trends=await readReportTrends(db,sprintId,history.depth);
 const chosenAnalyses=await selectedReportAnalyses(db,sprintId);
 return {sprint:safeCollectiveContext(report.sprint),provisional:report.provisional,generatedAt:new Date().toISOString(),
 source:report.source,version:report.snapshotVersion,historicalEvidence,sections:chosen,metrics,
 notes:draft.notes,teamContext:selectedTeamContext(context,contextOptions.options),
 trends:contents.options.metrics.length?trends??[]:[],historyDepth:history.depth,
 qualitativePolicy:"not-verified" as const,chosenAnalyses};
}
