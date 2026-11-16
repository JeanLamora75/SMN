import {officeRowDefinitions,officeScalarDefinitions} from "@/app/app/reports/office-tags";
import type {BriefFact} from "@/server/ai-briefs/facts";
import {allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";
import {aiBriefText,type AiBriefKey} from "@/lib/ai-brief-messages";

export type BriefTagDiagnostic={tag:string;reason:string};
export type ResolveBriefInput={
 promptText:string;mode:BriefMode;preparedAt:string;locale?:string;
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
 const tr=(key:AiBriefKey)=>aiBriefText(input.locale??"fr",key);
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
  diagnostics.push({tag,reason});return "["+tr("diagUnresolved")+" : "+tag+" — "+reason+"]";
 }
 const text=input.promptText.replace(/\{\{([^{}]{1,500})\}\}/g,(original:string,raw:string)=>{
  const tag=String(raw).trim();
  if(!tag)return fail(original,tr("diagEmpty"));
  if(tag.startsWith("CHART:"))return fail(tag,tr("diagChart"));
  if(tag.startsWith("INDICATOR_")){
   const item=indicators.get(tag.slice("INDICATOR_".length));
   if(!item||!item.available||item.value===null)
    return fail(tag,tr("diagIndicator")+" : "+(item?.reason??tr("diagIndicatorMissing")));
   return safe(item.value)+(item.unit?" "+safe(item.unit):"")+" [source: "+safe(item.source)+"]";
  }
  if(tag.startsWith("ROW:")){
   const source=tag.slice(4).split("|")[0];
   if(!allowedRows.has(source))return fail(tag,tr("diagCollection"));
   if(tag!==`ROW:${source}`)return fail(tag,tr("diagRowOptions"));
   // Only collective report facts are eligible for a text-only projection.
   if(source!=="INDICATORS")return fail(tag,tr("diagUnsafe"));
   const keys=allowedBriefFields(input.mode,[
    "scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned",
    "kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"
   ]);
   const list=keys.map(key=>fact[key]).filter((x):x is BriefFact=>Boolean(x&&x.unit!==null&&x.value!==null));
   const dynamic=[...indicators.values()].filter(x=>x.available&&x.value!==null);
   if(list.length===0&&dynamic.length===0)return fail(tag,tr("diagNoData"));
   const reportFacts=list.map(x=>"- "+safe(x.label)+": "+safe(x.value)+(x.unit?" "+safe(x.unit):"")+
    " [source: "+safe(x.source)+"; "+tr("diagQuality")+": "+safe(x.quality)+
    (x.snapshotVersion===null?"":"; "+tr("diagVersion")+": "+x.snapshotVersion)+"]");
   const dynamicFacts=dynamic.map(x=>"- "+safe(x.tag)+": "+safe(x.value)+
    (x.unit?" "+safe(x.unit):"")+" [source: "+safe(x.source)+"; projection rapports Office]");
   return [...reportFacts,...dynamicFacts].slice(0,30).join("\n");
  }
  if(!allowedScalars.has(tag))return fail(tag,tr("diagUnknown"));
  if(tag==="SPRINT_GOAL"||tag==="PRODUCT_GOAL"||tag==="PRODUCT_VISION")
   return fail(tag,tr("diagSensitive"));
  // The cycle context maps the Office SPRINT_* aliases onto a Kanban period as well.
  const v=values[tag];
  if(typeof v!=="string"||!v.trim())return fail(tag,tr("diagUnavailable"));
  return safe(v);
 });
 return {text,diagnostics,safe:diagnostics.length===0};
}
