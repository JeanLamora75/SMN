import type {Client} from "pg";
import {officeReportDate,readOfficeContextScalars} from "@/server/reports/office-context-scalars";
import {readOfficeBusinessRows,type OfficeBusinessSource} from "@/server/reports/office-business-rows";
import {officeWordIndicatorRows} from "@/server/reports/office-word-rows";
import {readReportIndicatorProjection} from "@/server/reports/dynamic-indicators";
import {composeKanbanReport} from "@/server/kanban/report-preparation";
import {canOfferBriefTag} from "@/lib/brief-prompt-tag-policy";
import {renderBriefPrompt,type PromptValue,type PromptTable,type PromptRenderResult} from "@/lib/ai-brief-prompt-render";
import type {BriefMode} from "@/lib/ai-brief-templates";

export type BriefPromptContext={
 id:string;teamId:string;name:string;team:string;product:string|null;
 status:string;startAt:string;endAt:string;timeZone:string;
};
type Locale="fr"|"en";
const rowNames=["GOALS","RISKS","OBSTACLES","DEPENDENCIES","ACTIONS","DECISIONS"] as const;
const quality=(c:BriefPromptContext):PromptValue["quality"]=>c.status==="closed"?"recorded":"provisional";
const record=(value:string|null,c:BriefPromptContext,source:string,version:number|null=null):PromptValue=>({
 value,unit:null,source,quality:value===null?"unavailable":quality(c),snapshotVersion:version
});
const object=(x:unknown):Record<string,unknown>=>x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:{};
const text=(x:unknown):string|null=>typeof x==="string"&&x.trim()?x.trim():null;

/** Caller must authorize the cycle, team and installation BEFORE invoking this loader. */
export async function renderCycleBriefPrompt(db:Client,mode:BriefMode,cycle:BriefPromptContext,
 prompt:string,locale:Locale,preparedAt=new Date()):Promise<PromptRenderResult>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(cycle.teamId)||
  !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(cycle.id))throw Error("invalid-brief-cycle-scope");
 const source=cycle.status==="closed"?"closure":"live";
 const scalars:Record<string,PromptValue>={
  TEAM_NAME:record(cycle.team,cycle,source),
  SPRINT_NAME:record(cycle.name,cycle,source),
  SPRINT_START:record(cycle.startAt,cycle,source),
  SPRINT_END:record(cycle.endAt,cycle,source),
  SPRINT_STATUS:record(cycle.status,cycle,source),
  PRODUCT_NAME:record(cycle.product,cycle,source),
  TODAY:record(officeReportDate(preparedAt,locale,cycle.timeZone),cycle,"generation")
 };
 const tables:Record<string,PromptTable>={};
 const indicators:Record<string,PromptValue>={};
 const requested=[...new Set([...prompt.matchAll(/\{\{ROW:([A-Z][A-Z0-9_]*)/g)].map(match=>match[1]))];
 const needed=requested.filter(key=>canOfferBriefTag("row",key,cycle.teamId));
 const requireIndicators=needed.includes("INDICATORS")||/\{\{INDICATOR_[A-Z][A-Z0-9_]*\}\}/.test(prompt);
 if(requireIndicators){
  try{
   const values=await readReportIndicatorProjection(db,cycle.teamId,mode,cycle.id);
   const list=officeWordIndicatorRows(values,locale);
   if(needed.includes("INDICATORS"))
    tables.INDICATORS={rows:list,source:"report-indicator-projection",quality:quality(cycle)};
   for(const item of values)if(item.available&&item.value!==null){
    indicators[item.tag]={
     value:item.value,unit:item.unit,source:"report-indicator-projection",
     quality:cycle.status==="closed"?(item.source==="computed"?"calculated":"recorded"):"provisional"
    };
   }
  }catch{/* Leave unresolved: the renderer reports that the source is unavailable. */}
 }
 if(mode==="scrum"){
  const scalarNeeded=/\{\{(?:PRODUCT_GOAL|SPRINT_GOAL)\}\}/.test(prompt);
  if(scalarNeeded){
   try{
    const context=await readOfficeContextScalars(db,cycle.teamId,cycle.id,cycle.product,locale,cycle.timeZone,preparedAt);
    scalars.SPRINT_GOAL=record(context.SPRINT_GOAL,cycle,source);
    scalars.PRODUCT_GOAL=record(context.PRODUCT_GOAL,cycle,"team-product-context");
   }catch{/* No fallback to mutable or unrelated data. */}
  }
  const period={id:cycle.id,startAt:cycle.startAt,endAt:cycle.endAt,timeZone:cycle.timeZone};
  for(const key of needed.filter((x):x is OfficeBusinessSource=>rowNames.some(y=>y===x))){
   try{
    const values=await readOfficeBusinessRows(db,cycle.teamId,period,locale,[key]);
    const rows=values[key];
    if(rows)tables[key]={rows,source:source==="closure"?"sprint-closure":"sprint-registers",quality:quality(cycle)};
   }catch{/* Unavailable is explicit in the resolver; do not reconstruct frozen data. */}
  }
 }else{
  // Kanban has a distinct immutable closure model; Scrum readers must never be applied.
  if(needed.includes("GOALS")||/\{\{SPRINT_GOAL\}\}/.test(prompt)||
   needed.some(key=>["RISKS","OBSTACLES","DEPENDENCIES","ACTIONS","DECISIONS"].includes(key))){
   try{
    const report=await composeKanbanReport(db,cycle.id);
    if(report){
     const version=report.snapshotVersion;
     const goals=Array.isArray(report.goals)?report.goals.map(object):[];
     const titles=goals.map(g=>text(g.title)).filter((x):x is string=>!!x);
     scalars.SPRINT_GOAL=record(titles.length?titles.join(" ; "):null,cycle,report.source,version);
     if(needed.includes("GOALS"))
      tables.GOALS={rows:goals.map(g=>({
       GOAL_TITLE:text(g.title),GOAL_EVALUATION:text(g.evaluation),
       GOAL_DESCRIPTION:text(g.description),GOAL_COMMENT:text(g.comment)
      })),source:report.source,quality:quality(cycle),snapshotVersion:version};
     // Only a closed Kanban snapshot is an authoritative qualitative source.
     if(report.source==="closure"&&report.quality.qualitativeLinks==="captured-explicit-links"&&Array.isArray(report.qualitative)){
      const kind:Record<string,string>={RISKS:"risk",OBSTACLES:"obstacle",DEPENDENCIES:"dependency",ACTIONS:"action",DECISIONS:"decision"};
      for(const key of needed.filter(x=>x in kind)){
       const prefix=key==="DEPENDENCIES"?"DEPENDENCY":key.slice(0,-1);
       const rows=(report.qualitative as unknown[]).map(object).filter(i=>String(i.type)===kind[key]);
       tables[key]={rows:rows.map(i=>({
        [prefix+"_TITLE"]:text(i.title),[prefix+"_STATUS"]:text(i.status),
        [prefix+"_PRIORITY"]:text(i.priority),[prefix+"_DATE"]:text(i.occurred_on)
       })),source:"kanban-closure",quality:"recorded",snapshotVersion:version};
      }
     }
    }
   }catch{/* Missing source is diagnosed, never inferred. */}
  }
 }
 return renderBriefPrompt({prompt,scalars,indicators,tables,locale,mode,teamId:cycle.teamId});
}
