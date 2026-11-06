import type {Client} from "pg";
import {readTeamReportContext} from "./team-context-read";
import {readSprintDetailGoals} from "@/server/sprints/goals-detail-read";

type Locale="fr"|"en";
export const officeContextScalarNames=[
 "TODAY","SPRINT_GOAL","PRODUCT_NAME","PRODUCT_GOAL","PRODUCT_VISION"
] as const;

export type OfficeContextScalars=Record<(typeof officeContextScalarNames)[number],string|null>;

export function officeReportDate(now:Date,locale:Locale,timeZone:string):string{
 if(Number.isNaN(now.getTime()))throw Error("office-report-invalid-date");
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeZone
 }).format(now);
}

/** Read approved sources only, keeping the closure snapshot for historical goals.
 * A sprint can have multiple goals: never silently select just the first.
 */
export async function readOfficeContextScalars(
 db:Client,teamId:string,sprintId:string,
 productName:string|null,locale:Locale,timeZone:string,now=new Date()
):Promise<OfficeContextScalars>{
 const [teamContext,goals]=await Promise.all([
  readTeamReportContext(db,teamId),
  readSprintDetailGoals(db,teamId,sprintId)
 ]);
 const titles=goals?.state==="available"?
  goals.items.map(goal=>goal.title.trim()).filter(Boolean):[];
 const sprintGoal=titles.length?titles.join(" ; "):null;
 const productGoal=teamContext.productGoal?.value?.trim()||null;
 const productVision=teamContext.vision?.value?.trim()||null;
 return {
  TODAY:officeReportDate(now,locale,timeZone),
  SPRINT_GOAL:sprintGoal,
  PRODUCT_NAME:productName?.trim()||null,
  PRODUCT_GOAL:productGoal,
  PRODUCT_VISION:productVision
 };
}
