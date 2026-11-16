import {officeRowDefinitions,officeScalarDefinitions} from "@/app/app/reports/office-tags";
import type {BriefFact} from "@/server/ai-briefs/facts";
import {allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";

export type BriefTagDiagnostic={tag:string;reason:string};
export type ResolveBriefInput={
 promptText:string;mode:BriefMode;preparedAt:string;
 context:{id:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};
 facts:Readonly<Record<string,BriefFact>>;
 indicators?:readonly {tag:string;value:string|null;unit:string;source:string;available:boolean;reason:string|null}[];
};
export type ResolvedBrief={text:string;diagnostics:BriefTagDiagnostic[];safe:boolean};
const safe=(v:unknown)=>String(v??"Non renseigné").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim();
const allowedScalars=new Set(officeScalarDefinitions.filter(x=>!x.key.includes("<")).map(x=>x.key));
const allowedRows=new Set(officeRowDefinitions.map(x=>x.source));
export function resolveBriefPrompt(input:ResolveBriefInput):ResolvedBrief{
 const diagnostics:BriefTagDiagnostic[]=[];
 const {context:c}=input;
 const fact=input.facts;
 const indicators=new Map((input.indicators??[]).filter(x=>/^[A-Z][A-Z0-9_]*$/.test(x.tag)).map(x=>[x.tag,x]));
 const values:Readonly<Record<string,string|null>>={
  TEAM_NAME:c.team,SPRINT_NAME:c.name,SPRINT_START:c.startAt,
  SPRINT_END:c.endAt,SPRINT_STATUS:c.status,PRODUCT_NAME:c.product,
  TODAY:new Intl.DateTimeFormat("en-CA",{timeZone:c.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(input.preparedAt)),
  // Free text and identities must never be transferred without deliberate manual redaction.
  SPRINT_GOAL:null,PRODUCT_GOAL:null,PRODUCT_VISION:null
 };
 function fail(tag:string,reason:string){
  diagnostics.push({tag,reason});return "[TAG NON RÉSOLU : "+tag+" — "+reason+"]";
 }
 const text=input.promptText.replace(/\{\{([^{}]{1,500})\}\}/g,(original:string,raw:string)=>{
  const tag=String(raw).trim();
  if(tag.startsWith("CHART:"))return fail(tag,"Graphiques non pris en charge dans un prompt TXT");
  if(tag.startsWith("INDICATOR_")){
   const item=indicators.get(tag.slice("INDICATOR_".length));
   if(!item||!item.available||item.value===null)
    return fail(tag,"Indicateur indisponible pour ce cycle : "+(item?.reason??"non sélectionné"));
   return safe(item.value)+(item.unit?" "+safe(item.unit):"")+" [source: "+safe(item.source)+"]";
  }
  if(tag.startsWith("ROW:")){
   const source=tag.slice(4).split("|")[0];
   if(!allowedRows.has(source))return fail(tag,"Collection inconnue");
   if(tag!==`ROW:${source}`)return fail(tag,"Options de collection non prises en charge en rendu TXT");
   // Only collective report facts are eligible for a text-only projection.
   if(source!=="INDICATORS")return fail(tag,"Collection non autorisée sans revue des données métier");
   const keys=allowedBriefFields(input.mode,[
    "scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned",
    "kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"
   ]);
   const list=keys.map(key=>fact[key]).filter((x):x is BriefFact=>Boolean(x&&x.unit!==null&&x.value!==null));
   const dynamic=[...indicators.values()].filter(x=>x.available&&x.value!==null);
   if(list.length===0&&dynamic.length===0)return fail(tag,"Aucune donnée collective disponible");
   const reportFacts=list.map(x=>"- "+safe(x.label)+": "+safe(x.value)+(x.unit?" "+safe(x.unit):"")+
    " [source: "+safe(x.source)+"; qualité: "+safe(x.quality)+
    (x.snapshotVersion===null?"":"; version: "+x.snapshotVersion)+"]");
   const dynamicFacts=dynamic.map(x=>"- "+safe(x.tag)+": "+safe(x.value)+
    (x.unit?" "+safe(x.unit):"")+" [source: "+safe(x.source)+"; projection rapports Office]");
   return [...reportFacts,...dynamicFacts].slice(0,30).join("\n");
  }
  if(!allowedScalars.has(tag))return fail(tag,"Tag inconnu du catalogue Office");
  if(tag==="SPRINT_GOAL"||tag==="PRODUCT_GOAL"||tag==="PRODUCT_VISION")
   return fail(tag,"Texte libre potentiellement sensible : insertion automatique interdite");
  if(input.mode==="kanban"&&tag.startsWith("SPRINT_")&&tag!=="SPRINT_NAME")
   return fail(tag,"Tag de sprint incompatible avec Kanban");
  const v=values[tag];
  if(typeof v!=="string"||!v.trim())return fail(tag,"Aucune valeur disponible ou accès non autorisé");
  return safe(v);
 });
 return {text,diagnostics,safe:diagnostics.length===0};
}
