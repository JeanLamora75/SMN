import {readFileSync} from "node:fs";
import {join} from "node:path";
import type {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {readReportIndicatorProjection} from "@/server/reports/dynamic-indicators";
import {readIndicatorReporting,type ReportData} from "@/server/indicators/reporting";
import {renderOfficeIndicatorSharedChart,OfficeChartIndicatorUnavailableError} from "@/server/reports/office-indicator-charts";
import {discoverOfficeChartTags,insertOfficeTrendImages} from "../../../../../../../scripts/smn-402-office-chart-tags.mjs";
import {insertAdaptivePowerPointCharts,OfficePowerPointInsertionError} from "../../../../../../../scripts/smn-413-adaptive-pptx.mjs";
import {OfficeChartTargetError} from "../../../../../../../scripts/smn-411-chart-targets.mjs";
import {OfficeChartLayoutError} from "../../../../../../../scripts/smn-412-adaptive-chart.mjs";
import {loadOfficeStyleSnapshot,createOfficeChartStyleResolver,OfficeChartStyleResolutionError} from "@/server/reports/office-chart-style-resolver";
import {ChartStyleError,validChartStyleId,validChartType} from "@/server/reports/chart-style-contract";
import {embedMemberFlagPictures,OfficeMemberFlagError} from "../../../../../../../scripts/smn-415-office-flag-images.mjs";
import {isSupportedOfficePackage,readOfficeTemplateById} from "@/server/reports/office-catalog";
import {readOfficeMemberGroups,officeWordIndicatorRows} from "@/server/reports/office-word-rows";
import {discoverOfficeBusinessSources,readOfficeBusinessRows} from "@/server/reports/office-business-rows";
import {readOfficeContextScalars} from "@/server/reports/office-context-scalars";
import {inspectOfficeReport,saveOfficeReport,OfficeSaveConflict,OfficeSaveFailure} from "@/server/reports/office-storage";
import {generateWordTables} from "../../../../../../../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../../../../../../../scripts/smn-401-powerpoint-tables.mjs";
import {buildScalarValues,formatScalarNumber,generateScalarOffice} from "../../../../../../../scripts/smn-399-office-scalars.mjs";

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
 // An absent value uses the global type defaults. An explicit ID is request-scoped.
 const reportStyleId=input.reportStyleId===undefined||input.reportStyleId===null?
  null:input.reportStyleId;
 if(reportStyleId!==null&&
  (!validChartStyleId(reportStyleId)||reportStyleId==="legacy"))
  return jsonResult({error:"office-chart-invalid-style-id"},400);
 const action=input.action??"download";
 if(!["download","check","save"].includes(String(action)))return jsonResult({error:"invalid-input"},400);
 if(action==="save"&&typeof input.expectedFingerprint!=="string")return jsonResult({error:"invalid-input"},400);
 if(typeof modelId!=="string"||!/^[0-9a-f]{32}$/.test(modelId)||
    typeof teamId!=="string"||typeof cycleId!=="string"||!cyclePattern.test(cycleId)||
    typeof filename!=="string"||filename.trim()!==filename||!safeName.test(filename)||
    filename==="."||filename===".."||filename.endsWith(".")||
    (language!=="fr"&&language!=="en"))
  return jsonResult({error:"invalid-input"},400);
 let selected:Awaited<ReturnType<typeof readOfficeTemplateById>>;
 let chartCount=0;
 let businessSources:ReturnType<typeof discoverOfficeBusinessSources>=[];
 try{
  selected=await readOfficeTemplateById(modelId);
  if(!selected)return jsonResult({error:"template-unavailable"},404);
  chartCount=discoverOfficeChartTags(selected.bytes,selected.template.format).length;
  businessSources=discoverOfficeBusinessSources(selected.bytes);
 }catch{return jsonResult({error:"office-chart-invalid-tag"},422);}
 let styleSnapshot:Awaited<ReturnType<typeof loadOfficeStyleSnapshot>>|null=null;
 let payload:{values:ReturnType<typeof buildScalarValues>;
  rows:Record<string,Record<string,string|null>[]>;report:ReportData|null};
 try{
  payload=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},teamId);
   if(team.mode!=="scrum"||!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,cycleId))
    throw Error("forbidden-scope");
   const cycle=await db.query<{name:string;status:string;start_at:string|null;end_at:string|null;time_zone:string}>(
    "SELECT s.name,s.status,s.start_at::text,s.end_at::text,s.time_zone "+
    "FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id "+
    "WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton' "+
    "AND s.deleted_at IS NULL LIMIT 2",[cycleId,teamId]);
   if(cycle.rows.length!==1)throw Error("forbidden-scope");
   const indicatorSelection=await db.query<{id:string}>(
    "SELECT d.id FROM public.smn_indicator_definition d "+
    "JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id "+
    "WHERE s.team_id=$1 AND s.is_active=true AND d.archived_at IS NULL "+
    "ORDER BY d.tag,d.id LIMIT 51",[teamId]);
   if(indicatorSelection.rows.length>50)throw Error("too-many-indicators");
   const indicators=indicatorSelection.rows.length?await readReportIndicatorProjection(
     db,teamId,"scrum",cycleId,indicatorSelection.rows.map(row=>row.id)):[];
   const sprint=cycle.rows[0],locale=language as Locale;
   const extra=await readOfficeContextScalars(db,teamId,cycleId,team.product,locale,sprint.time_zone);
   const values=buildScalarValues({
    ...extra,
    TEAM_NAME:team.team,
    SPRINT_NAME:sprint.name,
    SPRINT_START:dateValue(sprint.start_at,locale),
    SPRINT_END:dateValue(sprint.end_at,locale),
    SPRINT_STATUS:status[locale][sprint.status]??sprint.status,
    indicators:indicators.map(indicator=>({...indicator,value:formatScalarNumber(indicator.value,locale)}))
   });
   const members=await readOfficeMemberGroups(db,teamId,cycleId,locale,selected.template.format);
   const report=chartCount>0?await readIndicatorReporting(db,teamId,"trends","scrum"):null;
   const business=await readOfficeBusinessRows(db,teamId,{
    id:cycleId,startAt:new Date(sprint.start_at!).toISOString(),
    endAt:new Date(sprint.end_at!).toISOString(),timeZone:sprint.time_zone
   },locale,businessSources);
   return {values,rows:{MEMBERS:[...members.active,...members.inactive],MEMBERS_ACTIVE:members.active,MEMBERS_INACTIVE:members.inactive,INDICATORS:officeWordIndicatorRows(indicators,locale),...business},report};
  });
 }catch(error){
  if(error instanceof Error&&error.message==="too-many-indicators")
   return jsonResult({error:"technical-limit"},422);
  return jsonResult({error:"forbidden"},403);
 }
 try{
  // Validate the selected style on both "check" and generation, before offering
  // overwrite confirmation. No style is persisted to templates or global settings.
  if(chartCount>0||reportStyleId!==null){
   try{
    styleSnapshot=await withAuthDb(db=>loadOfficeStyleSnapshot(db,{id:actor.id,role:actor.role}));
   }catch(error){
    if(!(error instanceof ChartStyleError&&error.code==="schema-not-ready")||
       reportStyleId!==null)throw error;
   }
  }
  const resolveChartStyle=createOfficeChartStyleResolver(styleSnapshot,reportStyleId);
  if(action==="check"){
   // Resolve all tags to catch missing or deleted explicit STYLE values early.
   if(chartCount>0)for(const tag of discoverOfficeChartTags(selected.bytes,selected.template.format)){
    if(!validChartType(tag.params.type))return jsonResult({error:"office-chart-invalid-style"},422);
    resolveChartStyle({...tag.params,type:tag.params.type});
   }
   try{return jsonResult(await inspectOfficeReport(filename,selected.template.format));}
   catch{return jsonResult({error:"save-unavailable"},503);}
  }
  // Style read is one per export. Missing legacy tables preserve the old
  // renderer, but a broken migrated catalog is never silently ignored.
  const base=selected.template.format==="docx"?
   generateWordTables(selected.bytes,payload.rows).bytes:
   generatePowerPointTables(selected.bytes,payload.rows,language as Locale).bytes;
  const result=generateScalarOffice(base,selected.template.format,payload.values);
  const withFlags=selected.template.format==="pptx"?
   embedMemberFlagPictures(result.bytes,(country:string)=>{
    try{return readFileSync(join(process.cwd(),"public","flags",country.toLowerCase()+".png"));}
    catch{return null;}
   }).bytes:result.bytes;
  const withCharts=chartCount>0&&payload.report?
   selected.template.format==="pptx"?
    insertAdaptivePowerPointCharts(withFlags,(target:{options:{last:number;type:"bar"|"line"|"area"|"pie"|"donut"|"gauge";tags:string[]|null;style?:string};widthEmu:number;heightEmu:number})=>
     renderOfficeIndicatorSharedChart(payload.report!,cycleId,target.options,language as Locale,
      "pptx",resolveChartStyle(target.options),target)).bytes:
    insertOfficeTrendImages(withFlags,selected.template.format,(_index:number,options:{last:number;type:"bar"|"line"|"area"|"pie"|"donut"|"gauge";tags:string[]|null;style?:string})=>
     renderOfficeIndicatorSharedChart(payload.report!,cycleId,options,language as Locale,
      "docx",resolveChartStyle(options))).bytes:
   withFlags;
  if(!isSupportedOfficePackage(withCharts,selected.template.format))
   return jsonResult({error:"generation-failed"},422);
  if(action==="save"){
   try{
    const saved=await saveOfficeReport(withCharts,filename,selected.template.format,input.expectedFingerprint as string);
    return jsonResult({saved:true,filename:saved.filename,directory:saved.directory});
   }catch(error){
    if(error instanceof OfficeSaveConflict)return jsonResult({error:"save-conflict"},409);
    if(error instanceof OfficeSaveFailure)return jsonResult({error:"save-unavailable"},503);
    return jsonResult({error:"save-unavailable"},503);
   }
  }
  const fullName=filename.replace(/\.(docx|pptx)$/i,"")+"."+selected.template.format;
  const mime=selected.template.format==="docx"?
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
   "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  return new Response(new Uint8Array(withCharts),{
   status:200,
   headers:{
    "Content-Type":mime,
    "Content-Disposition":'attachment; filename="report.'+selected.template.format+'"; filename*=UTF-8'+String.fromCharCode(39,39)+encodeURIComponent(fullName),
    "Cache-Control":"no-store, private",
    "X-Content-Type-Options":"nosniff"
   }
  });
 }catch(error){
  if(error instanceof OfficeChartStyleResolutionError)
   return jsonResult({error:error.code,styleId:error.styleId},422);
  if(error instanceof ChartStyleError)
   return jsonResult({error:error.code},error.code==="schema-not-ready"?409:422);
  if(error instanceof OfficeChartIndicatorUnavailableError)
   return jsonResult({error:"office-chart-indicator-unavailable",tag:error.tag},422);
  if(error instanceof OfficeChartTargetError)
   return jsonResult({error:"office-chart-invalid-target",reason:error.code},422);
  if(error instanceof OfficePowerPointInsertionError)
   return jsonResult({error:"office-chart-insertion-failed",reason:error.code,slide:error.slide,shapeId:error.shapeId},422);
  if(error instanceof OfficeMemberFlagError)
   return jsonResult({error:"office-member-flag-failed",reason:error.code,country:error.country},422);
  if(error instanceof OfficeChartLayoutError)
   return jsonResult({error:"office-chart-render-failed",reason:error.code},422);
  if(error instanceof Error&&error.message.startsWith("Paramètres de tag"))
   return jsonResult({error:"invalid-tag-parameters"},422);
  return jsonResult({error:"generation-failed"},422);
 }
}
