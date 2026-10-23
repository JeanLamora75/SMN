/** Shared, discriminated report contract. No database or UI dependencies. */
export type ReportProvenance={
 source:"current"|"closure-snapshot"|"test-fixture";
 capturedAt:string|null;snapshotVersion:number|null;
};
export type ReportCycle={id:string;teamId:string;name:string;startAt:string;endAt:string;timeZone:string;status:string};
export type MeasuredValue={value:number|null;unit:"SP"|"JH"|"tickets"|"items"|"days"|"hours";sourceId:string|null};
export type ScrumReportProjection={
 mode:"scrum";cycle:ReportCycle;provenance:ReportProvenance;
 scrum:{storyPoints:{committed:MeasuredValue;completed:MeasuredValue};capacity:{planned:MeasuredValue;actual:MeasuredValue};objectives:ReadonlyArray<{id:string;title:string;evaluation:string}>};
 kanban?:never;
};
export type KanbanReportProjection={
 mode:"kanban";cycle:ReportCycle;provenance:ReportProvenance;
 kanban:{flow:ReadonlyArray<{key:"throughput"|"cycleTime"|"leadTime"|"wip";measure:MeasuredValue}>};
 scrum?:never;
};
export type ReportProjection=ScrumReportProjection|KanbanReportProjection;
const finite=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value)&&value>=0;
export function measured(value:unknown,unit:MeasuredValue["unit"],sourceId:string|null=null):MeasuredValue{
 return {value:finite(value)?value:null,unit,sourceId};
}
export function measuredFromStorage(value:unknown,unit:MeasuredValue["unit"],sourceId:string|null=null):MeasuredValue{
 if(value===null||value===undefined||value==="")return measured(null,unit,sourceId);
 if(typeof value==="number")return measured(value,unit,sourceId);
 return typeof value==="string"&&/^[0-9]+([.][0-9]+)?$/.test(value)?measured(Number(value),unit,sourceId):measured(null,unit,sourceId);
}
export function projectScrum(input:{
 cycle:ReportCycle;provenance:ReportProvenance;committedSp:unknown;completedSp:unknown;
 plannedJh:unknown;actualJh:unknown;objectives:ScrumReportProjection["scrum"]["objectives"];
}):ScrumReportProjection{
 return {mode:"scrum",cycle:input.cycle,provenance:input.provenance,scrum:{
 storyPoints:{committed:measuredFromStorage(input.committedSp,"SP"),completed:measuredFromStorage(input.completedSp,"SP")},
 capacity:{planned:measuredFromStorage(input.plannedJh,"JH"),actual:measuredFromStorage(input.actualJh,"JH")},
 objectives:input.objectives}};
}
export function projectKanban(input:{
 cycle:ReportCycle;provenance:ReportProvenance;flow:KanbanReportProjection["kanban"]["flow"];
}):KanbanReportProjection{
 const units={throughput:"items",cycleTime:"days",leadTime:"days",wip:"items"} as const;
 return {mode:"kanban",cycle:input.cycle,provenance:input.provenance,kanban:{flow:input.flow.map(m=>({
 key:m.key,measure:measured(m.measure.value,units[m.key],m.measure.sourceId)
 }))}};
}
export function supportedReportMode(value:string):value is ReportProjection["mode"]{
 return value==="scrum"||value==="kanban";
}
