import type {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {readReportIndicatorProjection} from "@/server/reports/dynamic-indicators";
import {isSupportedOfficePackage,readOfficeTemplateById} from "@/server/reports/office-catalog";
import {buildScalarValues,generateScalarOffice} from "../../../../../../scripts/smn-399-office-scalars.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
type Locale="fr"|"en";
const safeName=/^[^\\/:*?"<>|\x00-\x1f]{1,120}$/;
const cyclePattern=/^[a-f0-9-]{36}$/i;
const status:Record<Locale,Record<string,string>>={
 fr:{planned:"Planifié",active:"En cours",in_progress:"En cours",completed:"Terminé",closed:"Clôturé"},
 en:{planned:"Planned",active:"In progress",in_progress:"In progress",completed:"Completed",closed:"Closed"}
};
function dateValue(value:string|null,locale:Locale):string|null{
 if(!value)return null;
 const match=/^\d{4}-\d{2}-\d{2}/.exec(value);
 if(!match)return null;
 const date=new Date(match[0]+"T12:00:00Z");
 if(Number.isNaN(date.getTime()))return null;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{timeZone:"UTC",dateStyle:"medium"}).format(date);
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {modelId,teamId,cycleId,filename,language}=input;
 if(typeof modelId!=="string"||!/^[0-9a-f]{32}$/.test(modelId)||
    typeof teamId!=="string"||typeof cycleId!=="string"||!cyclePattern.test(cycleId)||
    typeof filename!=="string"||filename.trim()!==filename||!safeName.test(filename)||
    filename==="."||filename===".."||filename.endsWith(".")||
    (language!=="fr"&&language!=="en"))
  return jsonResult({error:"invalid-input"},400);
 let values:ReturnType<typeof buildScalarValues>;
 try{
  values=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},teamId);
   if(team.mode!=="scrum"||!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,cycleId))
    throw Error("forbidden-scope");
   const cycle=await db.query<{name:string;status:string;start_at:string|null;end_at:string|null}>(
    "SELECT s.name,s.status,s.start_at::text,s.end_at::text "+
    "FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id "+
    "WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton' "+
    "AND s.deleted_at IS NULL LIMIT 2",[cycleId,teamId]);
   if(cycle.rows.length!==1)throw Error("forbidden-scope");
   const selected=await db.query<{id:string}>(
    "SELECT d.id FROM public.smn_indicator_definition d "+
    "JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id "+
    "WHERE s.team_id=$1 AND s.is_active=true AND d.archived_at IS NULL "+
    "ORDER BY d.tag,d.id LIMIT 51",[teamId]);
   if(selected.rows.length>50)throw Error("too-many-indicators");
   const indicators=selected.rows.length?await readReportIndicatorProjection(
     db,teamId,"scrum",cycleId,selected.rows.map(row=>row.id)):[];
   const sprint=cycle.rows[0],locale=language as Locale;
   return buildScalarValues({
    TEAM_NAME:team.team,
    SPRINT_NAME:sprint.name,
    SPRINT_START:dateValue(sprint.start_at,locale),
    SPRINT_END:dateValue(sprint.end_at,locale),
    SPRINT_STATUS:status[locale][sprint.status]??sprint.status,
    indicators
   });
  });
 }catch(error){
  if(error instanceof Error&&error.message==="too-many-indicators")
   return jsonResult({error:"technical-limit"},422);
  return jsonResult({error:"forbidden"},403);
 }
 try{
  const selected=await readOfficeTemplateById(modelId);
  if(!selected)return jsonResult({error:"template-unavailable"},404);
  const result=generateScalarOffice(selected.bytes,selected.template.format,values);
  if(!isSupportedOfficePackage(result.bytes,selected.template.format))
   return jsonResult({error:"generation-failed"},422);
  const fullName=filename.replace(/\.(docx|pptx)$/i,"")+"."+selected.template.format;
  const mime=selected.template.format==="docx"?
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
   "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  return new Response(new Uint8Array(result.bytes),{
   status:200,
   headers:{
    "Content-Type":mime,
    "Content-Disposition":'attachment; filename="report.'+selected.template.format+'"; filename*=UTF-8'+String.fromCharCode(39,39)+encodeURIComponent(fullName),
    "Cache-Control":"no-store, private",
    "X-Content-Type-Options":"nosniff"
   }
  });
 }catch(error){
  if(error instanceof Error&&error.message.startsWith("Paramètres de tag"))
   return jsonResult({error:"invalid-tag-parameters"},422);
  return jsonResult({error:"generation-failed"},422);
 }
}
