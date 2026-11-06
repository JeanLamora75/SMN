import type {Client} from "pg";
import {readSprintRegisters} from "@/server/sprints/registers-detail-read";
import {readEpic5SprintRegisterSource} from "@/server/registries/sprint-adapter";
import {readSprintDetailGoals} from "@/server/sprints/goals-detail-read";
import {readSprintDetailCeremonies} from "@/server/sprints/ceremonies-detail-read";
import type {RegisterKind} from "@/lib/sprint-registers";
import {readZip} from "../../../scripts/smn-397-office-poc.mjs";

export const officeBusinessSources=[
 "RISKS","OBSTACLES","NOTES","CEREMONIES","GOALS","ACTIONS","DECISIONS"
] as const;
export type OfficeBusinessSource=typeof officeBusinessSources[number];
type Row=Record<string,string|null>;
type Locale="fr"|"en";
type Period={id:string;startAt:string;endAt:string;timeZone:string};
const kindBySource:Partial<Record<OfficeBusinessSource,RegisterKind>>={
 RISKS:"risk",OBSTACLES:"obstacle",ACTIONS:"action",DECISIONS:"decision"
};
const statusLabels:Record<string,[string,string]>={
 planned:["Planifié","Planned"],scheduled:["Planifiée","Scheduled"],
 held:["Tenue","Held"],not_held:["Non tenue","Not held"],
 cancelled:["Annulé","Cancelled"],completed:["Terminée","Completed"],
 resolved:["Résolu","Resolved"],open:["Ouvert","Open"],active:["Actif","Active"],
 achieved:["Atteint","Achieved"],partially_achieved:["Partiellement atteint","Partially achieved"],
 not_achieved:["Non atteint","Not achieved"],not_evaluated:["Non évalué","Not evaluated"]
};
const label=(value:string|null,locale:Locale)=>value===null?null:
 statusLabels[value]?.[locale==="fr"?0:1]??value;
function date(value:string|null,locale:Locale):string|null{
 if(!value)return null;
 const n=new Date(value);
 if(Number.isNaN(n.getTime()))return null;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeZone:"UTC"
 }).format(n);
}
function ensureComplete(total:number):void{
 // Memory-protection only. Never return a truncated dataset.
 if(!Number.isSafeInteger(total)||total>10000||total<0)
  throw Error("office-business-resource-limit");
}
export function discoverOfficeBusinessSources(bytes:Buffer):OfficeBusinessSource[]{
 const found=new Set<OfficeBusinessSource>();
 for(const p of readZip(bytes)){
  if(!/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(p.name)&&
   !/^ppt\/slides\/slide\d+\.xml$/.test(p.name))continue;
  const xml=p.data.toString("utf8");
  const normalized=xml.replace(/<\/(?:w:t|a:t)>[\s\S]*?<(?:w:t|a:t)(?:\s[^>]*)?>/g,"");
  for(const source of officeBusinessSources){
   if(normalized.includes("{{ROW:"+source+"}}"))found.add(source);
  }
 }
 return [...found];
}

/** The caller MUST have authorized teamId + sprintId on the server. */
export async function readOfficeBusinessRows(db:Client,teamId:string,
 period:Period,locale:Locale,requested:readonly OfficeBusinessSource[])
 :Promise<Partial<Record<OfficeBusinessSource,Row[]>>>{
 const result:Partial<Record<OfficeBusinessSource,Row[]>>={};
 const unique=new Set(requested);
 for(const name of unique)if(!officeBusinessSources.includes(name))
  throw Error("office-business-unknown-source");
 const registry=officeBusinessSources.filter(s=>kindBySource[s]&&unique.has(s));
 if(registry.length){

  const first=await readSprintRegisters(db,teamId,period,1,readEpic5SprintRegisterSource);
  if(!first||first.state!=="available"||registry.some(s=>first.missingKinds.includes(kindBySource[s]!)))
   throw Error("office-business-registers-unavailable");
  ensureComplete(first.total);
  const records=[...first.items];
  for(let page=2;page<=first.pageCount;page++){
   const next=await readSprintRegisters(db,teamId,period,page,readEpic5SprintRegisterSource);
   if(!next||next.state!=="available"||next.total!==first.total)
    throw Error("office-business-registers-changed");
   records.push(...next.items);
  }
  if(records.length!==first.total)throw Error("office-business-registers-incomplete");
  for(const source of registry){
   const kind=kindBySource[source]!,prefix=source.slice(0,-1);
   result[source]=records.filter(r=>r.kind===kind).map(r=>({
    [prefix+"_TITLE"]:r.title,
    [prefix+"_STATUS"]:label(r.status,locale),
    [prefix+"_PRIORITY"]:label(r.priority,locale),
    [prefix+"_DATE"]:date(r.date,locale)
   }));
  }
 }
 if(unique.has("GOALS")){
  const goals=await readSprintDetailGoals(db,teamId,period.id);
  if(!goals||goals.state!=="available")throw Error("office-business-goals-unavailable");
  ensureComplete(goals.items.length);
  result.GOALS=goals.items.map(g=>({
   GOAL_TITLE:g.title,GOAL_EVALUATION:label(g.evaluation,locale),
   GOAL_DESCRIPTION:g.description??null,GOAL_COMMENT:g.comment
  }));
 }
 if(unique.has("CEREMONIES")){
  const first=await readSprintDetailCeremonies(db,teamId,period.id,1);
  if(!first||first.state!=="available"||first.missingSources.length)
   throw Error("office-business-ceremonies-unavailable");
  ensureComplete(first.total);
  const ceremonies=[...first.items];
  for(let p=2;p<=first.pageCount;p++){
   const next=await readSprintDetailCeremonies(db,teamId,period.id,p);
   if(!next||next.state!=="available"||next.total!==first.total||next.missingSources.length)
    throw Error("office-business-ceremonies-changed");
   ceremonies.push(...next.items);
  }
  if(ceremonies.length!==first.total)throw Error("office-business-ceremonies-incomplete");
  result.CEREMONIES=ceremonies.map(c=>({
   CEREMONY_TITLE:c.title,CEREMONY_STATUS:label(c.status,locale),
   CEREMONY_START:date(c.startsAt,locale),CEREMONY_END:date(c.endsAt,locale),
   CEREMONY_DURATION:c.actualMinutes===null?null:String(c.actualMinutes)
  }));
 }
 if(unique.has("NOTES")){
  const available=await db.query<{present:boolean}>(
   "SELECT to_regclass('public.smn_dashboard_note') IS NOT NULL AS present");
  if(!available.rows[0]?.present)throw Error("office-business-notes-unavailable");
  const notes=await db.query<{body:string;status:string;created_at:string}>(
   "SELECT n.body,n.status,n.created_at::text FROM public.smn_dashboard_note n "+
   "JOIN public.smn_sprint s ON s.id=n.sprint_id AND s.team_id=n.team_id "+
   "JOIN public.smn_team t ON t.id=s.team_id "+
   "WHERE n.team_id=$1 AND n.sprint_id=$2 AND s.deleted_at IS NULL "+
   "AND t.installation_id='singleton' ORDER BY n.created_at,n.id LIMIT 10001",
   [teamId,period.id]);
  ensureComplete(notes.rows.length);
  result.NOTES=notes.rows.map(n=>({
   NOTE_TEXT:n.body,NOTE_STATUS:label(n.status,locale),
   NOTE_DATE:date(n.created_at,locale)
  }));
 }
 return result;
}
