/** Contrat neutre, partagé par les projections courantes et les snapshots. */
export type CeremonySource="standard"|"custom"|"exceptional";
export type CeremonyStatus="scheduled"|"held"|"not_held"|"cancelled"|"unknown";
export type StatusEvidence="confirmed"|"inferred"|"unknown";
export type SprintCeremony=Readonly<{
 id:string;source:CeremonySource;kind:string|null;title:string;
 startsAt:string;endsAt:string;status:CeremonyStatus;
 statusEvidence:StatusEvidence;reconstructed:boolean;
 plannedMinutes:number|null;actualMinutes:number|null;
}>;
const obj=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
const iso=(v:unknown):string|null=>{
 if(typeof v!=="string"&&!(v instanceof Date))return null;
 const d=new Date(v);
 return Number.isFinite(d.valueOf())?d.toISOString():null;
};
const duration=(v:unknown):number|null=>{
 if(v===null||v===undefined||v==="")return null;
 const n=Number(v);
 return Number.isSafeInteger(n)&&n>=0&&n<=1440?n:null;
};
export function ceremonyStatus(raw:unknown):CeremonyStatus{
 if(typeof raw!=="string")return "unknown";
 switch(raw.toLowerCase()){
  case "scheduled":case "planned":return "scheduled";
  case "held":case "done":case "completed":case "occurred":return "held";
  case "not_held":return "not_held";
  case "cancelled":case "canceled":return "cancelled";
  default:return "unknown";
 }
}
export function normalizeSprintCeremony(raw:unknown,historical:boolean):SprintCeremony|null{
 const v=obj(raw);
 if(!v||typeof v.id!=="string"||!v.id||
  !["standard","custom","exceptional"].includes(String(v.source_kind)))return null;
 const source=v.source_kind as CeremonySource;
 const startsAt=iso(v.starts_at),endsAt=iso(v.ends_at);
 if(!startsAt||!endsAt||Date.parse(startsAt)>=Date.parse(endsAt))return null;
 const title=typeof v.title==="string"?v.title.trim():"";
 if(!title)return null;
 const kind=source==="standard"?(typeof v.kind==="string"?v.kind:null):null;
 const status=ceremonyStatus(v.status);
 const explicit=v.status_explicit;
 const statusEvidence:StatusEvidence=historical?"unknown":
  status==="held"&&explicit===false?"inferred":
  explicit===true?"confirmed":"unknown";
 const fromSource=duration(v.planned_minutes??v.minutes??v.duration_minutes);
 const fallback=Math.round((Date.parse(endsAt)-Date.parse(startsAt))/60000);
 const plannedMinutes=fromSource??(fallback>=0&&fallback<=1440?fallback:null);
 return {id:v.id,source,kind,title,startsAt,endsAt,status,statusEvidence,
  reconstructed:v.generation_source==="reconstructed",
  plannedMinutes,actualMinutes:duration(v.actual_minutes)};
}
export function sortSprintCeremonies(items:readonly SprintCeremony[]):SprintCeremony[]{
 return [...items].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)||
  a.source.localeCompare(b.source)||a.id.localeCompare(b.id));
}
export function ceremonyPage(items:readonly SprintCeremony[],requested:number,size=25){
 const pageSize=Math.max(1,Math.min(100,Math.trunc(size)||25));
 const total=items.length,pageCount=Math.max(1,Math.ceil(total/pageSize));
 const page=Number.isSafeInteger(requested)&&requested>0?
  Math.min(requested,pageCount):1;
 return {items:items.slice((page-1)*pageSize,page*pageSize),
  page,total,pageCount,pageSize};
}
