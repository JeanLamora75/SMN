import {validRegistryActivityTime} from "./registry-summary-context";
export const auditKinds=["record","assessment","roam","parties","vigilance",
 "decision","comment","relation","cycle","actionLink"] as const;
export type AuditKind=(typeof auditKinds)[number];
export type AuditAction="created"|"updated"|"edited"|"withdrawn"|"linked"|"unlinked";
export type AuditEvent={
 id:string;kind:AuditKind;revision:number|null;at:string;actorName:string|null;
 action:AuditAction;before:Record<string,unknown>|null;after:Record<string,unknown>|null
};
export type AuditPage={events:AuditEvent[];page:number;hasMore:boolean};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const obj=(value:unknown):value is Record<string,unknown>=>
 value!==null&&typeof value==="object"&&!Array.isArray(value);
const actions:readonly AuditAction[]=["created","updated","edited","withdrawn","linked","unlinked"];
const fields:Record<AuditKind,readonly string[]>={
 record:["title","occurredOn","status","description","owner","dueOn","comment"],
 assessment:["probability","impact"],roam:["classification"],
 parties:["requester","contributor"],vigilance:["atRisk"],
 decision:["rationale","replacesId"],comment:["text"],
 relation:["target"],cycle:["cycle"],actionLink:["target"]
};
function normalize(value:unknown):unknown{
 if(Array.isArray(value))return value.map(normalize);
 if(obj(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])]));
 return value;
}
export function changedFields(entry:AuditEvent):{key:string;before:unknown;after:unknown}[]{
 const before=entry.before??{},after=entry.after??{};
 return fields[entry.kind].filter(key=>{
  const a=before[key]??null,b=after[key]??null;
  if(entry.before===null)return b!==null;
  return JSON.stringify(normalize(a))!==JSON.stringify(normalize(b));
 }).map(key=>({key,before:before[key]??null,after:after[key]??null}));
}
/** Don't display raw identifiers or arbitrary nested JSON as human labels. */
export function formatAuditValue(value:unknown):string|null{
 if(value===null||value===undefined)return null;
 if(typeof value==="boolean")return value?"yes":"no";
 if(typeof value==="number")return Number.isFinite(value)?String(value):null;
 if(typeof value==="string"){
  if(uuid.test(value))return null;
  return value;
 }
 if(obj(value)){
  if(typeof value.name==="string"&&value.name.trim())return value.name;
  if(value.kind==="local")return "local";
 }
 return null;
}
export function parseAuditPage(value:unknown):AuditPage|null{
 if(!obj(value)||!Array.isArray(value.events)||value.events.length>25||
  !Number.isSafeInteger(value.page)||Number(value.page)<1||
  typeof value.hasMore!=="boolean")return null;
 const events:AuditEvent[]=[];
 for(const raw of value.events as unknown[]){
  if(!obj(raw)||typeof raw.id!=="string"||!uuid.test(raw.id)||
   !auditKinds.some(k=>k===raw.kind)||
   !actions.some(a=>a===raw.action)||
   !(raw.revision===null||Number.isSafeInteger(raw.revision)&&Number(raw.revision)>0)||
   validRegistryActivityTime(raw.at)===null||
   !(raw.actorName===null||typeof raw.actorName==="string"&&
    raw.actorName.length<=200)||
   !(raw.before===null||obj(raw.before))||
   !(raw.after===null||obj(raw.after)))return null;
  events.push({
   id:raw.id,kind:raw.kind as AuditKind,revision:raw.revision as number|null,
   at:raw.at as string,actorName:raw.actorName as string|null,
   action:raw.action as AuditAction,
   before:raw.before as Record<string,unknown>|null,
   after:raw.after as Record<string,unknown>|null
  });
 }
 return {events,page:value.page as number,hasMore:value.hasMore as boolean};
}
