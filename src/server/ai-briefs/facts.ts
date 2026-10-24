import type {Client} from "pg";
import {composeStandardReport} from "@/server/reports/standard-composition";
import {composeKanbanReport} from "@/server/kanban/report-preparation";
import {allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";

export type BriefFact={key:string;label:string;value:string|null;unit:string|null;source:string;quality:"recorded"|"calculated"|"provisional"|"unavailable";snapshotVersion:number|null};
const fact=(key:string,label:string,raw:unknown,unit:string|null,source:string,version:number|null,provisional:boolean):BriefFact=>{
 const value=raw===null||raw===undefined||raw===""?null:typeof raw==="number"&&Number.isFinite(raw)?String(raw):typeof raw==="string"?raw:null;
 return {key,label,value,unit,source,quality:value===null?"unavailable":provisional?"provisional":"recorded",snapshotVersion:version};
};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
export function projectBriefSelection(mode:BriefMode,fields:readonly string[],data:Record<string,BriefFact>):BriefFact[]{
 return allowedBriefFields(mode,fields).map(key=>data[key]).filter((x):x is BriefFact=>Boolean(x));
}
export async function readBriefFacts(db:Client,mode:BriefMode,cycleId:string):Promise<Record<string,BriefFact>>{
 const result:Record<string,BriefFact>={};
 const put=(key:string,label:string,value:unknown,unit:string|null,source:string,version:number|null,provisional:boolean)=>{
  result[key]=fact(key,label,value,unit,source,version,provisional);
 };
 if(mode==="scrum"){
  const report=await composeStandardReport(db,cycleId);
  if(!report)return {};
  const s=report.sprint,p=report.projection;
  const source=report.source,version=report.snapshotVersion,provisional=report.provisional;
  put("cycle.name","Sprint",s.name,null,source,version,provisional);
  put("cycle.dates","Dates",s.startAt+" — "+s.endAt,null,source,version,provisional);
  put("cycle.status","Statut",s.status,null,source,version,provisional);
  put("team.name","Équipe",s.team,null,source,version,provisional);
  put("product.name","Produit",s.product,null,source,version,provisional);
  put("scrum.storyPoints.committed","SP engagés",p.scrum.storyPoints.committed.value,"SP",source,version,provisional);
  put("scrum.storyPoints.completed","SP terminés",p.scrum.storyPoints.completed.value,"SP",source,version,provisional);
  put("scrum.capacity.planned","Capacité prévue",p.scrum.capacity.planned.value,"JH",source,version,provisional);
  const section=(key:string)=>report.sections.find(x=>x.key===key);
  put("objectives","Objectifs",report.goals.length?report.goals.map(x=>x.title).join(" ; "):null,null,source,version,provisional);
  for(const [key,sectionName] of [["risks","attention"],["dependencies","attention"],["decisions","decisions"]] as const){
   const sectionData=section(sectionName);
   // Do not infer a risk/dependency kind from a mixed historical reporting section.
   put(key,key==="decisions"?"Décisions":key==="risks"?"Risques":"Dépendances",key==="decisions"&&sectionData?.state==="available"?sectionData.items.map(x=>x.label).join(" ; "):null,null,source,version,provisional);
  }
 }else{
  const report=await composeKanbanReport(db,cycleId);
  if(!report)return {};
  const s=report.period,source=report.source,version=report.snapshotVersion,provisional=report.provisional;
  put("cycle.name","Période",s.name,null,source,version,provisional);
  put("cycle.dates","Dates",s.startOn+" — "+s.endOn,null,source,version,provisional);
  put("cycle.status","Statut",s.status,null,source,version,provisional);
  put("team.name","Équipe",s.team,null,source,version,provisional);
  const flow=object(report.flow),timing=object(report.timing);
  put("kanban.throughput","Throughput",flow.throughput,"items",source,version,provisional);
  put("kanban.cycleTime","Cycle Time",object(timing.cycle).days,"jours",String(object(timing.cycle).source||source)+" · "+String(object(timing.cycle).convention||"unknown"),version,provisional);
  put("kanban.leadTime","Lead Time",object(timing.lead).days,"jours",String(object(timing.lead).source||source)+" · "+String(object(timing.lead).convention||"unknown"),version,provisional);
  put("kanban.capacity.planned","Capacité prévue",object(report.capacity).initialJh,"JH",source,version,provisional);
  put("objectives","Objectifs",Array.isArray(report.goals)&&report.goals.length?report.goals.map(x=>String(object(x).title??"")).filter(Boolean).join(" ; "):null,null,source,version,provisional);
  // Historical qualitative states are only provided by the closure snapshot.
  const items=report.source==="closure"?report.qualitative:[];
  for(const key of ["risks","dependencies","decisions"]){
   const typeNames:Record<string,string[]>={risks:["risk","obstacle"],dependencies:["dependency"],decisions:["decision","action"]};
   const selected=(items as unknown[]).filter(x=>typeNames[key].includes(String(object(x).type)));
   put(key,key,selected.length?selected.map(x=>String(object(x).title??"")).filter(Boolean).join(" ; "):null,null,source,version,provisional);
  }
 }
 return result;
}
