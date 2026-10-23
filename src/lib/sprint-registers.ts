export const registerKinds=[
 "risk","obstacle","dependency","decision","action","highlight"
] as const;
export type RegisterKind=(typeof registerKinds)[number];
export type SprintRegister=Readonly<{
 id:string;kind:RegisterKind;title:string;status:string|null;
 priority:string|null;date:string;
 openedAt:string|null;closedAt:string|null;
 teamIds:readonly string[];sprintIds:readonly string[];
 href:string|null;
}>;
export type SprintRegisterResult=
 |Readonly<{state:"available";source:"current"|"closure-snapshot";
  snapshotVersion:number|null;items:readonly SprintRegister[];
  total:number;page:number;pageSize:number;pageCount:number;
  missingKinds:readonly RegisterKind[]}>
 |Readonly<{state:"unavailable";reason:"producer-not-installed"|
  "history-missing"|"invalid-data"|"read-failed"}>;
export type RegisterSource=Readonly<{
 records:readonly unknown[];availableKinds:readonly RegisterKind[];
}>;
const record=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:null;
const timestamp=(x:unknown):string|null=>
 typeof x==="string"&&
 /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(x)&&
 Number.isFinite(Date.parse(x))?
  new Date(x).toISOString():null;
export const isRegisterKind=(v:unknown):v is RegisterKind=>
 typeof v==="string"&&registerKinds.some(k=>k===v);
/** Only route paths returned by a verified register producer are linkable.
 * No guessed detail route is generated from a record identifier. */
export function safeRegisterHref(raw:unknown):string|null{
 if(typeof raw!=="string"||!raw.startsWith("/app/")||
  raw.includes("\\")||/[\u0000-\u001f]/.test(raw)||
  raw.includes("//")||raw.includes("?")||raw.includes("#")||
  /%(?:2e|2f|5c)/i.test(raw)||
  raw.split("/").includes(".."))return null;
 return raw;
}
export function normalizeRegister(raw:unknown):SprintRegister|null{
 const r=record(raw);
 if(!r||!isRegisterKind(r.kind)||typeof r.id!=="string"||!r.id.trim()||
  typeof r.title!=="string"||!r.title.trim()||r.title.length>240||
  (r.status!==null&&typeof r.status!=="string")||
  (r.priority!==null&&typeof r.priority!=="string")||
  !Array.isArray(r.teamIds)||r.teamIds.length===0||
  !r.teamIds.every(x=>typeof x==="string"&&x)||
  !Array.isArray(r.sprintIds)||!r.sprintIds.every(x=>typeof x==="string"&&x)||
  (r.href!==null&&r.href!==undefined&&!safeRegisterHref(r.href)))
  return null;
 const point=r.kind==="decision"||r.kind==="highlight";
 const date=timestamp(r.date);
 const openedAt=timestamp(r.openedAt);
 const closedAt=r.closedAt===null?null:timestamp(r.closedAt);
 if(!date||(point?false:!openedAt)||
  (r.closedAt!==null&&!closedAt)||
  (!point&&openedAt&&closedAt&&Date.parse(closedAt)<Date.parse(openedAt)))
  return null;
 return {
  id:r.id,kind:r.kind,title:r.title.trim(),status:r.status as string|null,
  priority:r.priority as string|null,date,openedAt:point?null:openedAt,
  closedAt:point?null:closedAt,
  teamIds:r.teamIds as string[],sprintIds:r.sprintIds as string[],
  href:safeRegisterHref(r.href)
 };
}
/** For decisions/highlights use their business date. Persistent items
 * overlap the Sprint if they were open at any instant during its interval.
 * The end of a Sprint is exclusive; closing instant itself is inclusive. */
export function relevantToSprint(item:SprintRegister,teamId:string,sprint:{
 id:string;startAt:string;endAt:string
}):boolean{
 if(!item.teamIds.includes(teamId))return false;
 const start=Date.parse(sprint.startAt),end=Date.parse(sprint.endAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end)return false;
 if(item.kind==="decision"||item.kind==="highlight"){
  const event=Date.parse(item.date);
  return event>=start&&event<end;
 }
 const opened=Date.parse(item.openedAt??"");
 const closed=item.closedAt===null?Number.POSITIVE_INFINITY:Date.parse(item.closedAt);
 return opened<end&&closed>=start;
}
export function registerPage(
 items:readonly SprintRegister[],pageRaw:number,sizeRaw=25
){
 const pageSize=Number.isSafeInteger(sizeRaw)?Math.min(100,Math.max(1,sizeRaw)):25;
 const ordered=[...items].sort((a,b)=>
  Date.parse(a.date)-Date.parse(b.date)||a.kind.localeCompare(b.kind)||
  a.id.localeCompare(b.id));
 const total=ordered.length,pageCount=Math.max(1,Math.ceil(total/pageSize));
 const page=Number.isSafeInteger(pageRaw)&&pageRaw>0?
  Math.min(pageRaw,pageCount):1;
 return {items:ordered.slice((page-1)*pageSize,page*pageSize),
  total,page,pageSize,pageCount};
}
/** A record associated to multiple Sprints has one canonical identity.
 * Conflicting duplicates are invalid rather than silently overwriting data. */
export function selectSprintRegisterPage(
 source:RegisterSource,teamId:string,sprint:{id:string;startAt:string;endAt:string},
 requestedPage=1
):Omit<Extract<SprintRegisterResult,{state:"available"}>,
 "state"|"source"|"snapshotVersion">|null{
 if(!Array.isArray(source.records)||!Array.isArray(source.availableKinds)||
  source.availableKinds.some(k=>!isRegisterKind(k))||
  new Set(source.availableKinds).size!==source.availableKinds.length)return null;
 const seen=new Map<string,SprintRegister>();
 for(const raw of source.records){
  const item=normalizeRegister(raw);
  if(!item||!source.availableKinds.includes(item.kind))return null;
  const key=item.kind+":"+item.id;
  if(seen.has(key)){
   const before=seen.get(key)!;
   if(JSON.stringify({...before,sprintIds:[]})!==
    JSON.stringify({...item,sprintIds:[]}))return null;
   seen.set(key,{...before,sprintIds:[
    ...new Set([...before.sprintIds,...item.sprintIds])
   ].sort()});
   continue;
  }
  seen.set(key,item);
 }
 const relevant=[...seen.values()].filter(x=>relevantToSprint(x,teamId,sprint));
 const missingKinds=registerKinds.filter(k=>!source.availableKinds.includes(k));
 return {...registerPage(relevant,requestedPage),missingKinds};
}
