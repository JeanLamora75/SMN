import type {BriefMode} from "@/lib/ai-brief-templates";
import {allowedBriefFields} from "@/lib/ai-brief-templates";
import type {BriefFact} from "@/server/ai-briefs/facts";

export type BriefTxtInput={
 context:{id:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};
 mode:BriefMode;preparedAt:string;template:{title:string;revision:number;sections:readonly string[];questions:readonly string[];instructions:readonly string[];data:readonly string[];depth:number};
 facts:Readonly<Record<string,BriefFact>>;observations?:readonly string[];
};
const safe=(s:unknown)=>String(s??"Non renseigné").replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim();
const quality=(f:BriefFact)=>f.quality==="unavailable"?"Non renseigné":f.quality==="provisional"?"Provisoire":f.quality==="calculated"?"Calculée":"Enregistrée";
export function composeBriefTxt(input:BriefTxtInput):string{
 const {context:c,template:t}=input;
 const sections:string[]=[
 "BRIEF IA — TEXTE BRUT",
 "Équipe : "+safe(c.team),
 "Produit : "+safe(c.product),
 "Mode : "+input.mode,
 "Cycle : "+safe(c.name),
 "Identifiant du cycle : "+safe(c.id),
 "Dates : "+safe(c.startAt)+" — "+safe(c.endAt)+" ("+safe(c.timeZone)+")",
 "Statut : "+safe(c.status),
 "Date de préparation : "+safe(input.preparedAt),
 "Modèle : "+safe(t.title)+" (révision "+t.revision+")",
 "Profondeur historique demandée : "+Math.min(5,Math.max(1,Math.trunc(t.depth)))+" cycle(s) clôturé(s)",
 c.status==="closed"?"":"ATTENTION : données provisoires, cycle non clôturé.",
 ""
 ];
 const facts=allowedBriefFields(input.mode,t.data).map(key=>input.facts[key]).filter((f):f is BriefFact=>!!f);
 const numerical=facts.filter(f=>f.unit!==null);
 const qualitative=facts.filter(f=>f.unit===null);
 const render=(f:BriefFact)=>"- "+safe(f.label)+" : "+(f.value===null?"Non renseigné":safe(f.value)+(f.unit?" "+safe(f.unit):""))+
  " ["+quality(f)+" ; source : "+safe(f.source)+(f.snapshotVersion===null?"":" ; version de clôture : "+f.snapshotVersion)+"]";
 const block=(heading:string,items:readonly string[])=>heading+"\n"+(items.length?items.join("\n"):"Aucune donnée renseignée.")+"\n";
 // Known section names retain the model's ordering; custom sections remain visible.
 const used=new Set<string>();
 const sectionText=(name:string)=>{
  const lower=name.toLocaleLowerCase("fr");
  let kind:"facts"|"context"|"questions"|"instructions"|"observations";
  if(/question/.test(lower))kind="questions";
  else if(/consigne|instruction/.test(lower))kind="instructions";
  else if(/observation|analyse humaine/.test(lower))kind="observations";
  else if(/résultat|métrique|indicateur|tendance|chiffr/.test(lower))kind="facts";
  else kind="context";
  used.add(kind);
  return block(safe(name).toUpperCase(),kind==="facts"?numerical.map(render):
   kind==="context"?qualitative.map(render):
   kind==="questions"?t.questions.map(safe).map(v=>"- "+v):
   kind==="instructions"?t.instructions.map(safe).map(v=>"- "+v):
   (input.observations??[]).map(safe).filter(Boolean).map(v=>"- "+v));
 };
 for(const heading of t.sections)sections.push(sectionText(heading));
 const extra:[string,string[]][]=[
  ["facts",numerical.map(render)],["context",qualitative.map(render)],
  ["observations",(input.observations??[]).map(safe).filter(Boolean).map(v=>"- "+v)],
  ["questions",t.questions.map(safe).map(v=>"- "+v)],
  ["instructions",t.instructions.map(safe).map(v=>"- "+v)]
 ];
 const headings:Record<string,string>={facts:"FAITS CHIFFRÉS",context:"CONTEXTE QUALITATIF",observations:"OBSERVATIONS HUMAINES",questions:"QUESTIONS À L'IA",instructions:"CONSIGNES À L'IA"};
 for(const [kind,lines] of extra)if(!used.has(kind))sections.push(block(headings[kind],lines));
 sections.push("Transmission à une IA : manuelle uniquement.");
 return sections.join("\n").replace(/\n{3,}/g,"\n\n").trimEnd()+"\n";
}
