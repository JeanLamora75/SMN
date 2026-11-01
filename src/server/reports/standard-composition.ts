import {readLegacyReportPoints,readLegacyReportTickets} from "@/server/compat-v32/legacy-metric-read";
import type {Client} from "pg";
import {prepareSprintReport} from "./sprint-preparation";
import {readReportDataQuality} from "./data-quality";
import {readIndicatorReporting} from "@/server/indicators/reporting";
export const standardReportSections=["executive","objectives","indicators","events","attention","decisions"] as const;
export type ReportSection={key:typeof standardReportSections[number];items:Array<{label:string;detail:string;href:string|null}>;state:"available"|"empty"|"unavailable"};
const item=(label:string,detail:string,href:string|null=null)=>({label,detail,href});
export async function composeStandardReport(db:Client,sprintId:string){
 const prepared=await prepareSprintReport(db,sprintId);
 if(!prepared)return null;
 const {sprint,goals}=prepared;
 const sections:ReportSection[]=standardReportSections.map(key=>({key,items:[],state:"empty"}));
 const add=(key:ReportSection["key"],entries:ReportSection["items"],unavailable=false)=>{
  const section=sections.find(s=>s.key===key)!;
  section.items=entries;section.state=entries.length?"available":unavailable?"unavailable":"empty";
 };
 add("executive",[item(sprint.name,sprint.team+" · "+sprint.status+" · "+sprint.startAt+" — "+sprint.endAt)]);
 add("objectives",goals.map(g=>item(g.title,g.evaluation)));
 if(sprint.status==="closed"){
  const existing=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS exists`);
  const version=existing.rows[0]?.exists?await db.query<{snapshot:Record<string,unknown>}>(`
   SELECT snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]):{rows:[]};
  const snapshot=version.rows[0]?.snapshot;
  if(!snapshot){
   for(const key of ["indicators","events","attention","decisions"] as const)add(key,[],true);
  }else{
   const points=snapshot.storyPoints as Record<string,unknown>|null|undefined;
   const tickets=snapshot.ticketCounts as Record<string,unknown>|null|undefined;
   const frozen=Array.isArray(snapshot.indicatorsV33)?snapshot.indicatorsV33 as Array<Record<string,unknown>>:null;
   add("indicators",[
    ...(["initial_sp","done_sp"].flatMap(k=>points?.[k]===null||points?.[k]===undefined?[]:[item(k,String(points[k]))])),
    ...(["initial_tickets","done_tickets"].flatMap(k=>tickets?.[k]===null||tickets?.[k]===undefined?[]:[item(k,String(tickets[k]))])),
    ...(frozen??[]).filter(d=>d.state==="available"&&d.value!==null&&d.value!==undefined).map(d=>item(String(d.name),String(d.value)+(d.unit?" "+String(d.unit):"")))
   ]);
   const ceremonyKeys=["ceremonies","customMeetings","exceptionalMeetings"] as const;
   add("events",ceremonyKeys.flatMap(key=>Array.isArray(snapshot[key])?
    (snapshot[key] as Array<Record<string,unknown>>).map(e=>item(String(e.name??e.kind??key),String(e.status??"—"))):[]));
   const qualitative=snapshot.qualitative as {items?:Array<Record<string,unknown>>}|undefined;
   const records=Array.isArray(qualitative?.items)?qualitative.items:[];
   add("attention",records.filter(r=>["risk","obstacle","dependency"].includes(String(r.type)))
    .map(r=>item(String(r.title),String(r.status))),!qualitative);
   add("decisions",records.filter(r=>["decision","action"].includes(String(r.type)))
    .map(r=>item(String(r.title),String(r.status))),!qualitative);
  }
 }else{
  const schemaVersion=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  const v33=schemaVersion.rows[0]?.schema_version===33;
  const dynamicIndicators=v33?await readIndicatorReporting(db,sprint.teamId,"reports","scrum",[sprintId]):null;
  const schemas=await db.query<{ceremonies:boolean;links:boolean}>(`
   SELECT    to_regclass('public.smn_sprint_ceremony') IS NOT NULL AS ceremonies,
   to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS links`);
  const s=schemas.rows[0];
  const indicators:ReportSection["items"]=[];
  if(!v33){
   const points=await readLegacyReportPoints(db,sprintId);
   const tickets=await readLegacyReportTickets(db,sprintId);
   if(points)for(const [k,v] of Object.entries(points))if(v!==null)indicators.push(item(k,String(v)));
   if(tickets)for(const [k,v] of Object.entries(tickets))if(v!==null)indicators.push(item(k,String(v)));
  }
  if(dynamicIndicators){
   const cycle=dynamicIndicators.cycles.find(c=>c.id===sprintId);
   for(const indicator of dynamicIndicators.columns){
    const value=cycle?.values[indicator.id];
    if(value!==null&&value!==undefined)indicators.push(item(indicator.name,value+(indicator.unit?" "+indicator.unit:"")));
   }
  }
  add("indicators",indicators,v33?!dynamicIndicators?.columns.length:indicators.length===0);
  const events=s?.ceremonies?await db.query<{kind:string;status:string}>(`SELECT kind,occurrence_status AS status FROM public.smn_sprint_ceremony WHERE sprint_id=$1 ORDER BY starts_at`,[sprintId]):{rows:[]};
  add("events",events.rows.map(e=>item(e.kind,e.status)),!s?.ceremonies);
  const registry=s?.links?await db.query<{id:string;title:string;type:string;status:string}>(`
   SELECT r.id,r.title,r.type,r.status FROM public.smn_registry_cycle_link l
   JOIN public.smn_registry_item r ON r.id=l.item_id WHERE l.sprint_id=$1 AND r.team_id=$2
   ORDER BY r.type,r.id`,[sprintId,sprint.teamId]):{rows:[]};
  add("attention",registry.rows.filter(r=>["risk","obstacle","dependency"].includes(r.type))
   .map(r=>item(r.title,r.status,"/app/admin/registries/"+r.id)),!s?.links);
  add("decisions",registry.rows.filter(r=>["decision","action"].includes(r.type))
   .map(r=>item(r.title,r.status,"/app/admin/registries/"+r.id)),!s?.links);
 }
 const dataQuality=await readReportDataQuality(db,sprintId,sprint.status);
 return {...prepared,sections,dataQuality};
}
