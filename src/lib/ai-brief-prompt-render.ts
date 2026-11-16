import {officeRowDefinitions,officeScalarDefinitions} from "@/app/app/reports/office-tags";
import {AI_BRIEF_SAFE_ROW_FIELDS,canOfferBriefTag} from "@/lib/brief-prompt-tag-policy";

export type PromptValue={value:string|null;unit?:string|null;source:string;quality:"recorded"|"calculated"|"provisional"|"unavailable";snapshotVersion?:number|null};
export type PromptRow=Record<string,string|null>;
export type PromptTable={rows:readonly PromptRow[];source:string;quality:PromptValue["quality"];snapshotVersion?:number|null};
export type PromptDiagnostic={tag:string;reason:"unknown"|"restricted"|"missing"|"unsupported"|"invalid"|"limit";message:string};
export type PromptRenderInput={
 prompt:string;
 scalars:Readonly<Record<string,PromptValue>>;
 indicators:Readonly<Record<string,PromptValue>>;
 tables:Readonly<Record<string,PromptTable>>;
 locale:"fr"|"en";
 mode:"scrum"|"kanban";
 teamId:string|null;
 maxRows?:number;
};
export type PromptRenderResult={text:string;diagnostics:PromptDiagnostic[];complete:boolean;usedTags:string[]};
const TAG=/\{\{([^{}]*)\}\}/g;
const FIELD=/^[A-Z][A-Z0-9_]*$/;
const ROW=/^ROW:([A-Z][A-Z0-9_]*)(?:\|SORT=(.*))?$/;
const MAX_PROMPT=200_000;
const MAX_OUTPUT=500_000;
const defaultRows=50;
const messages={
 fr:{unknown:"Tag inconnu",restricted:"Tag interdit dans un brief IA",missing:"Donnée indisponible",unsupported:"Graphique non compatible avec un prompt texte",invalid:"Expression de tag invalide",limit:"Limite de données ou de longueur dépassée",none:"Aucun élément consigné",source:"source",quality:"qualité",snapshot:"version de clôture",provisional:"provisoire",count:"éléments"},
 en:{unknown:"Unknown tag",restricted:"Tag not allowed in an AI brief",missing:"Data unavailable",unsupported:"Chart cannot be rendered in a text prompt",invalid:"Invalid tag expression",limit:"Row or output size limit exceeded",none:"No recorded entries",source:"source",quality:"quality",snapshot:"closure version",provisional:"provisional",count:"items"}
} as const;
const qualityLabels={
 fr:{recorded:"enregistrée",calculated:"calculée",provisional:"provisoire",unavailable:"indisponible"},
 en:{recorded:"recorded",calculated:"calculated",provisional:"provisional",unavailable:"unavailable"}
} as const;
const clean=(s:string)=>s.replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim();
const scalars=new Set(officeScalarDefinitions.map(x=>x.key));
const definitions=new Map(officeRowDefinitions.map(x=>[x.source,x]));
function tagSort(raw:string|undefined,valid:readonly string[]):{field:string;direction:"ASC"|"DESC"}[]|null{
 if(raw===undefined)return [];
 if(!raw||raw.length>2000)return null;
 const fields=raw.split(",");
 if(fields.length>32||new Set(fields.map(x=>x.split(":")[0])).size!==fields.length)return null;
 const result:{field:string;direction:"ASC"|"DESC"}[]=[];
 for(const rule of fields){
  const match=/^([A-Z][A-Z0-9_]*):(ASC|DESC)$/.exec(rule);
  if(!match||!valid.includes(match[1])||!AI_BRIEF_SAFE_ROW_FIELDS.has(match[1]))return null;
  result.push({field:match[1],direction:match[2] as "ASC"|"DESC"});
 }
 return result;
}
function describe(value:PromptValue,language:"fr"|"en"):string{
 const m=messages[language];
 const text=clean(value.value??"");
 const meta=[m.source+": "+clean(value.source),m.quality+": "+qualityLabels[language][value.quality]];
 if(value.snapshotVersion!==null&&value.snapshotVersion!==undefined)meta.push(m.snapshot+": "+value.snapshotVersion);
 return text+(value.unit?" "+clean(value.unit):"")+" ["+meta.join(" ; ")+"]";
}
export function renderBriefPrompt(input:PromptRenderInput):PromptRenderResult{
 const diagnostics:PromptDiagnostic[]=[];
 const usedTags:string[]=[];
 const m=messages[input.locale];
 if(input.prompt.length>MAX_PROMPT)return{text:input.prompt,diagnostics:[{tag:"",reason:"limit",message:m.limit}],complete:false,usedTags};
 const limit=input.maxRows??defaultRows;
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)return{text:input.prompt,diagnostics:[{tag:"",reason:"limit",message:m.limit}],complete:false,usedTags};
 const diagnostic=(tag:string,reason:PromptDiagnostic["reason"])=>{
  diagnostics.push({tag,reason,message:reason==="unknown"?m.unknown:reason==="restricted"?m.restricted:reason==="missing"?m.missing:reason==="unsupported"?m.unsupported:reason==="invalid"?m.invalid:m.limit});
  return tag; // Failure is visible and never silently replaced by invented data.
 };
 const output=input.prompt.replace(TAG,(tag:string,body:string)=>{
  if(!usedTags.includes(tag))usedTags.push(tag);
  if(body.startsWith("CHART:"))return diagnostic(tag,"unsupported");
  if(body.startsWith("INDICATOR_")){
   const key=body.slice("INDICATOR_".length);
   if(!FIELD.test(key))return diagnostic(tag,"invalid");
   if(!canOfferBriefTag("indicator",key,input.teamId))return diagnostic(tag,"restricted");
   const value=input.indicators[key];
   return value?.value!==null&&value?.value!==undefined&&value.value.trim()?describe(value,input.locale):diagnostic(tag,"missing");
  }
  if(body.startsWith("ROW:")){
   const parsed=ROW.exec(body);
   if(!parsed)return diagnostic(tag,"invalid");
   const source=parsed[1],definition=definitions.get(source);
   if(!definition)return diagnostic(tag,"unknown");
   if(!canOfferBriefTag("row",source,input.teamId))return diagnostic(tag,"restricted");
   const rules=tagSort(parsed[2],definition.fields);
   if(rules===null)return diagnostic(tag,"invalid");
   const table=input.tables[source];
   if(!table)return diagnostic(tag,"missing");
   if(table.rows.length>limit)return diagnostic(tag,"limit");
   const sortable=table.rows.map((row,index)=>({row,index}));
   if(rules.length)sortable.sort((a,b)=>{
    for(const rule of rules){
     const av=a.row[rule.field]??"",bv=b.row[rule.field]??"";
     const compare=av.localeCompare(bv,input.locale,{numeric:true,sensitivity:"base"});
     if(compare)return rule.direction==="ASC"?compare:-compare;
    }
    return a.index-b.index;
   });
   const allowed=definition.fields.filter(field=>AI_BRIEF_SAFE_ROW_FIELDS.has(field));
   const name=input.locale==="fr"?definition.fr:definition.en;
   const meta=[m.source+": "+clean(table.source),m.quality+": "+qualityLabels[input.locale][table.quality]];
   if(table.snapshotVersion!==null&&table.snapshotVersion!==undefined)meta.push(m.snapshot+": "+table.snapshotVersion);
   const heading=name+" ("+sortable.length+" "+m.count+" ; "+meta.join(" ; ")+")";
   if(!sortable.length)return heading+"\n"+m.none;
   const lines=sortable.map(({row},i)=>{
    const details=allowed.filter(field=>row[field]!==null&&row[field]!==undefined&&row[field]!.trim().length>0)
     .map(field=>field+": "+clean(row[field]!));
    return (i+1)+". "+(details.length?details.join(" | "):m.none);
   });
   return heading+"\n"+lines.join("\n");
  }
  if(!FIELD.test(body))return diagnostic(tag,"invalid");
  if(!scalars.has(body))return diagnostic(tag,"unknown");
  if(!canOfferBriefTag("scalar",body,input.teamId))return diagnostic(tag,"restricted");
  const value=input.scalars[body];
  return value?.value!==null&&value?.value!==undefined&&value.value.trim()?describe(value,input.locale):diagnostic(tag,"missing");
 });
 const unmatched=input.prompt.replace(TAG,"");
 if(unmatched.includes("{{")||unmatched.includes("}}"))
  diagnostics.push({tag:"{{…}}",reason:"invalid",message:m.invalid});
 if(output.length>MAX_OUTPUT)return{text:input.prompt,diagnostics:[...diagnostics,{tag:"",reason:"limit",message:m.limit}],complete:false,usedTags};
 return{text:output,diagnostics,complete:diagnostics.length===0,usedTags};
}
