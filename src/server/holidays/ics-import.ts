import type {Client} from "pg";
import {ensureCountryArchiveSchema} from "../countries/archive-migration";
import {executeHolidayCsv,type ConflictPolicy,type CsvPreview} from "./csv-import";

export type IcsEvent={
 id:string;date:string|null;name:string;eligible:boolean;reason:string|null;
};
type IcsStage="inspect"|"preview"|"commit";
type IcsRequest={
 stage:IcsStage;country:string;ics:string;policy:ConflictPolicy;
 selected:string[];fingerprint?:string;
};
export type IcsResult=
 |{ok:true;events:IcsEvent[];preview?:CsvPreview;created?:number;replaced?:number;changedYears?:number[]}
 |{ok:false;error:"invalid-input"|"invalid-ics"|"ics-too-large"|
  "country-not-found"|"invalid-selection"|"preview-expired";events?:IcsEvent[];preview?:CsvPreview};
const MAX_BYTES=1024*1024;
const MAX_EVENTS=5000;
type Property={key:string;descriptor:string;value:string};
const DATE=/^\d{8}$/u;
function civil(value:string):string|null{
 if(!DATE.test(value))return null;
 const year=Number(value.slice(0,4)),month=Number(value.slice(4,6)),day=Number(value.slice(6));
 if(year<1900||year>2200)return null;
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 return value.slice(0,4)+"-"+value.slice(4,6)+"-"+value.slice(6,8);
}
function decodeSummary(value:string):string|null{
 if(/\\(?![nN,;\\])/u.test(value))return null;
 const text=value.replace(/\\([nN,;\\])/gu,(_,ch:string)=>
  ch==="n"||ch==="N"?"\n":ch).trim();
 return text.length>0&&text.length<=120&&!/[\u0000-\u001f\u007f]/u.test(text)?text:null;
}
function eventFromLines(lines:string[],index:number):IcsEvent{
 const props:Property[]=[];
 let malformed=false;
 for(const line of lines){
  const colon=line.indexOf(":");
  if(colon<=0){malformed=true;continue;}
  const descriptor=line.slice(0,colon).toUpperCase();
  const key=descriptor.split(";")[0];
  if(!/^[A-Z0-9-]+$/u.test(key)){malformed=true;continue;}
  props.push({key,descriptor,value:line.slice(colon+1)});
 }
 const get=(key:string)=>props.filter(p=>p.key===key);
 const starts=get("DTSTART"),ends=get("DTEND"),summaries=get("SUMMARY");
 const name=summaries.length===1?decodeSummary(summaries[0].value):null;
 const start=starts.length===1&&starts[0].descriptor==="DTSTART;VALUE=DATE"?
  civil(starts[0].value):null;
 let reason:string|null=null;
 if(malformed)reason="malformed-event";
 else if(get("X-SMN-UNSUPPORTED-NESTED").length>0)reason="nested-component";
 else if(props.some(p=>["RRULE","RDATE","EXDATE","EXRULE","RECURRENCE-ID"].includes(p.key)))
  reason="recurrence-unsupported";
 else if(get("DURATION").length>0)reason="duration-unsupported";
 else if(get("STATUS").some(p=>p.value.toUpperCase()==="CANCELLED"))reason="cancelled";
 else if(starts.length!==1||!start)reason="timed-or-invalid-start";
 else if(ends.length>1)reason="invalid-end";
 else if(ends.length===1){
  const end=ends[0].descriptor==="DTEND;VALUE=DATE"?civil(ends[0].value):null;
  const diff=end?(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z")):NaN;
  if(!end||diff!==86400000)reason="multi-day-or-invalid-end";
 }
 if(!reason&&!name)reason="invalid-name";
 return {id:"event-"+index,date:start,name:name??"",eligible:reason===null,reason};
}
export function parseHolidayIcs(input:string):
 {ok:true;events:IcsEvent[]}|{ok:false;error:"invalid-ics"|"ics-too-large"}{
 if(Buffer.byteLength(input,"utf8")>MAX_BYTES)return {ok:false,error:"ics-too-large"};
 const source=input.replace(/^\uFEFF/u,"");
 if(!source.trim()||source.includes("\uFFFD")||source.includes("\u0000")||
  /\r(?!\n)/u.test(source))return {ok:false,error:"invalid-ics"};
 const physical=source.replace(/\r\n/gu,"\n").split("\n");
 const lines:string[]=[];
 for(const line of physical){
  if(/^[ \t]/u.test(line)){
   if(lines.length===0)return {ok:false,error:"invalid-ics"};
   lines[lines.length-1]+=line.slice(1);
  }else lines.push(line);
  if(lines.length>12000)return {ok:false,error:"ics-too-large"};
 }
 while(lines.at(-1)==="")lines.pop();
 if(lines[0]?.toUpperCase()!=="BEGIN:VCALENDAR"||lines.at(-1)?.toUpperCase()!=="END:VCALENDAR")
  return {ok:false,error:"invalid-ics"};
 const events:IcsEvent[]=[];
 let inEvent=false,begin=-1,current:string[]=[];
 let eventDepth=0,unsupportedNested=false;
 let depth=0;
 for(let i=1;i<lines.length-1;i++){
  const line=lines[i];
  if(line.toUpperCase()==="BEGIN:VEVENT"){
   if(inEvent||depth!==0)return {ok:false,error:"invalid-ics"};
   inEvent=true;begin=i;current=[];eventDepth=0;unsupportedNested=false;continue;
  }
  if(line.toUpperCase()==="END:VEVENT"){
   if(!inEvent)return {ok:false,error:"invalid-ics"};
   if(eventDepth!==0)return {ok:false,error:"invalid-ics"};
   if(unsupportedNested)current.push("X-SMN-UNSUPPORTED-NESTED:1");
   events.push(eventFromLines(current,events.length+1));
   if(events.length>MAX_EVENTS)return {ok:false,error:"ics-too-large"};
   inEvent=false;begin=-1;continue;
  }
  if(inEvent){
   if(line.toUpperCase().startsWith("BEGIN:")){
    unsupportedNested=true;eventDepth++;continue;
   }
   if(line.toUpperCase().startsWith("END:")){
    if(eventDepth===0)return {ok:false,error:"invalid-ics"};
    eventDepth--;continue;
   }
   if(eventDepth===0)current.push(line);
   continue;
  }
  if(line.toUpperCase().startsWith("BEGIN:")){depth++;continue;}
  if(line.toUpperCase().startsWith("END:")){depth--;if(depth<0)return {ok:false,error:"invalid-ics"};}
 }
 if(inEvent||begin!==-1||depth!==0||events.length===0)
  return {ok:false,error:"invalid-ics"};
 return {ok:true,events};
}
function readRequest(value:unknown):IcsRequest|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const raw=value as Record<string,unknown>;
 if(Object.keys(raw).some(k=>!["country","stage","policy","ics","selected","fingerprint"].includes(k))||
  typeof raw.country!=="string"||!/^[A-Z]{2}$/u.test(raw.country)||
  (raw.stage!=="inspect"&&raw.stage!=="preview"&&raw.stage!=="commit")||
  (raw.policy!=="skip"&&raw.policy!=="replace")||typeof raw.ics!=="string"||
  !Array.isArray(raw.selected)||raw.selected.length>MAX_EVENTS||
  raw.selected.some(id=>typeof id!=="string"||!/^event-[1-9]\d*$/u.test(id))||
  (raw.stage==="commit"&&(typeof raw.fingerprint!=="string"||!/^[a-f0-9]{64}$/u.test(raw.fingerprint))))
  return null;
 return {
  country:raw.country,stage:raw.stage,policy:raw.policy,ics:raw.ics,
  selected:raw.selected as string[],
  ...(typeof raw.fingerprint==="string"?{fingerprint:raw.fingerprint}:{})
 };
}
function selectedCsv(events:IcsEvent[],country:string,ids:string[]):string|null{
 if(ids.length===0||new Set(ids).size!==ids.length)return null;
 const byId=new Map(events.map(e=>[e.id,e]));
 const selected=ids.map(id=>byId.get(id));
 if(selected.some(e=>!e||!e.eligible||!e.date))return null;
 const lines=selected.map(e=>{
  const escaped='"'+e!.name.replace(/"/gu,'""')+'"';
  return e!.date+";"+escaped+";"+country;
 });
 return "date;nom;pays\n"+lines.join("\n");
}
export async function executeHolidayIcs(db:Client,value:unknown,actorId:string):Promise<IcsResult>{
 const input=readRequest(value);
 if(!input||!actorId)return {ok:false,error:"invalid-input"};
 const parsed=parseHolidayIcs(input.ics);
 if(!parsed.ok)return parsed;
 if(input.stage==="inspect"){
  await ensureCountryArchiveSchema(db);
  const exists=await db.query("SELECT code FROM public.smn_country WHERE code=$1 AND archived_at IS NULL",[input.country]);
  if(exists.rowCount!==1)return {ok:false,error:"country-not-found"};
  return {ok:true,events:parsed.events};
 }
 const csv=selectedCsv(parsed.events,input.country,input.selected);
 if(!csv)return {ok:false,error:"invalid-selection",events:parsed.events};
 const response=await executeHolidayCsv(db,{
  country:input.country,policy:input.policy,stage:input.stage, csv,
  ...(input.stage==="commit"?{fingerprint:input.fingerprint}:{})
 },actorId,"ics");
 if(!response.ok)return {
  ok:false,error:response.error==="invalid-input"||response.error==="invalid-csv"||
   response.error==="csv-too-large"?"invalid-ics":response.error,
  events:parsed.events,...(response.preview?{preview:response.preview}:{})
 };
 return {ok:true,events:parsed.events,preview:response.preview,
  ...(typeof response.created==="number"?{created:response.created}:{ }),
  ...(typeof response.replaced==="number"?{replaced:response.replaced}:{ }),
  ...(Array.isArray(response.changedYears)?{changedYears:response.changedYears}:{})};
}
