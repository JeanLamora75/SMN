import type {Client} from "pg";
import {readKanbanPeriodReport} from "./report";
import {readKanbanGoals} from "./goals";
import {readKanbanFlow} from "./flow-counts";
import {readKanbanTiming} from "./timing";
import {readKanbanTrends} from "./trends";
import {readKanbanClosures} from "./closure";

export const kanbanReportSections=["objectives","flow","timing","capacity","trends"] as const;
export type KanbanReportSection=typeof kanbanReportSections[number];
export function selectKanbanReportSections(raw:readonly string[]){
 return kanbanReportSections.filter(section=>raw.includes(section));
}
export async function composeKanbanReport(db:Client,periodId:string){
 const report=await readKanbanPeriodReport(db,periodId);
 if(!report)return null;
 const [goals,flow,timing,trends,versions]=await Promise.all([
  readKanbanGoals(db,periodId),readKanbanFlow(db,periodId),
  readKanbanTiming(db,periodId),readKanbanTrends(db,periodId),readKanbanClosures(db,periodId)
 ]);
 // Closed periods must use the immutable version. Never reconstruct old values from mutable tables.
 const snapshot=report.period.status==="closed"?versions[0]??null:null;
 if(report.period.status==="closed"&&!snapshot)throw Error("kanban-closure-snapshot-missing");
 const frozen=snapshot?.snapshot as null|{goals?:unknown[];flow?:unknown;timing?:unknown;capacity?:unknown};
 return {
  period:report.period,
  source:snapshot?"closure" as const:"live" as const,
  provisional:report.period.status!=="closed",
  snapshotVersion:snapshot?.version??null,
  sections:kanbanReportSections,
  goals:snapshot?frozen?.goals??[]:goals?.goals??[],
  flow:snapshot?frozen?.flow??null:flow?.counts??null,
  timing:snapshot?frozen?.timing??null:timing?{cycle:timing.cycle,lead:timing.lead,comparable:timing.comparable}:null,
  capacity:snapshot?frozen?.capacity??null:report.blocks.capacity,
  trends:trends?.periods??[],
  quality:{qualitativeLinks:snapshot?"not-integrated":"not-verified",events:snapshot?"not-integrated":"not-verified"}
 };
}
