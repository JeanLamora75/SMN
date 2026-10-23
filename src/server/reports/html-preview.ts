import type {Client} from "pg";
import {composeStandardReport} from "./standard-composition";
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
 }:section);
 const trends=await readReportTrends(db,sprintId,history.depth);
 return {sprint:report.sprint,provisional:report.provisional,generatedAt:new Date().toISOString(),
 source:report.source,version:report.snapshotVersion,sections:chosen,metrics,
 notes:draft.notes,teamContext:selectedTeamContext(context,contextOptions.options),
 trends:contents.options.metrics.length?trends??[]:[],historyDepth:history.depth,
 qualitativePolicy:"not-verified" as const};
}
