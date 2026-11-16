import {officeRowDefinitions,officeScalarDefinitions} from "@/app/app/reports/office-tags";
import type {BriefFact} from "@/server/ai-briefs/facts";
import type {BriefMode} from "@/lib/ai-brief-templates";

export type BriefTagDiagnostic={tag:string;reason:string};
export type ResolveBriefInput={
 promptText:string;mode:BriefMode;preparedAt:string;
 context:{id:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};
 facts:Readonly<Record<string,BriefFact>>;
};
export type ResolvedBrief={text:string;diagnostics:BriefTagDiagnostic[];safe:boolean};
const safe=(v:unknown)=>String(v??"Non renseigné").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim();
const allowedScalars=new Set(officeScalarDefinitions.filter(x=>!x.key.includes("<")).map(x=>x.key));
const allowedRows=new Set(officeRowDefinitions.map(x=>x.source));
export function resolveBriefPrompt(input:ResolveBriefInput):ResolvedBrief{
 const diagnostics:BriefTagDiagnostic[]=[];
 const {context:c}=input;
 const fact=input.facts;
 const values:Readonly<Record<string,string|null>>={
  TEAM_NAME:c.team,SPRINT_NAME:c.name,SPRINT_START:c.startAt,
  SPRINT_END:c.endAt,SPRINT_STATUS:c.status,PRODUCT_NAME:c.product,
  TODAY:input.preparedAt.slice(0,10),
  // Free text and identities must never be transferred without deliberate manual redaction.
  SPRINT_GOAL:null,PRODUCT_GOAL:null,PRODUCT_VISION:null
 };
 function fail(tag:string,reason:string){
  diagnostics.push({tag,reason});return "[TAG NON RÉSOLU : "+tag+" — "+reason+"]";
 }
 const text=input.promptText.replace(/\{\{([^{}]{1,500})\}\}/g,(original:string,raw:string)=>{
  const tag=String(raw).trim();
  if(tag.startsWith("CHART:"))return fail(tag,"Graphiques non pris en charge dans un prompt TXT");
  if(tag.startsWith("INDICATOR_"))return fail(tag,"Valeur d'indicateur non chargée et non vérifiée pour ce cycle");
  if(tag.startsWith("ROW:")){
   const source=tag.slice(4).split("|")[0];
   if(!allowedRows.has(source))return fail(tag,"Collection inconnue");
   // Only collective report facts are eligible for a text-only projection.
   if(source!=="INDICATORS")return fail(tag,"Collection non autorisée sans revue des données métier");
   const list=Object.values(fact).filter(x=>x.unit!==null&&x.value!==null);
   if(list.length===0)return fail(tag,"Aucune donnée collective disponible");
   return list.slice(0,30).map(x=>"- "+safe(x.label)+": "+safe(x.value)+(x.unit?" "+safe(x.unit):"")+
    " [source: "+safe(x.source)+"; qualité: "+safe(x.quality)+
    (x.snapshotVersion===null?"":"; version: "+x.snapshotVersion)+"]").join("\n");
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
