import {registryStatuses,registryTypes,type RegistryType} from "./registry-types";

export const registryIndexPath="/app/admin/registries";
export type RegistryIndexState={
 type:"all"|RegistryType;search:string;status:string;owner:string;
 lifecycle:"all"|"followup"|"final";
 sort:"default"|"dateDesc"|"dateAsc"|"titleAsc"|"titleDesc";
 cycleId:string;page:number;view:"list"|"cards";teamId?:string;
};
export type RegistryNavigation={origin:string;trail:string[]};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sorts=["default","dateDesc","dateAsc","titleAsc","titleDesc"] as const;
const lifecycleValues=["all","followup","final"] as const;
const allowed=new Set(["type","search","status","owner","lifecycle","sort","cycleId","page","view","teamId"]);
const empty:RegistryIndexState={
 type:"all",search:"",status:"",owner:"",lifecycle:"all",
 sort:"default",cycleId:"",page:1,view:"list"
};
export function parseRegistryIndexState(raw:unknown):RegistryIndexState{
 if(typeof raw!=="string"||raw.length>850||!raw.startsWith("/app/")||
  raw.startsWith("//")||/[\\\u0000-\u001f]/.test(raw))return {...empty};
 let url:URL;
 try{url=new URL(raw,"https://smn.invalid");}catch{return {...empty};}
 if(url.origin!=="https://smn.invalid"||url.pathname!==registryIndexPath)return {...empty};
 const p=url.searchParams;
 const rawType=p.get("type")??"all";
 const type=rawType==="all"||registryTypes.some(v=>v===rawType)?
  rawType as RegistryIndexState["type"]:"all";
 const search=(p.get("search")??"").slice(0,120);
 const owner=(p.get("owner")??"").slice(0,200);
 const rawStatus=p.get("status")??"";
 const statuses=type==="all"?registryTypes.flatMap(v=>[...registryStatuses[v]]):
  [...registryStatuses[type]];
 const status=rawStatus===""||statuses.some(v=>v===rawStatus)?rawStatus:"";
 const rawLifecycle=p.get("lifecycle");
 const lifecycle=lifecycleValues.find(v=>v===rawLifecycle)??"all";
 const rawSort=p.get("sort");
 const sort=sorts.find(v=>v===rawSort)??"default";
 const rawPage=Number(p.get("page")??"1");
 const page=Number.isSafeInteger(rawPage)&&rawPage>=1&&rawPage<=100000?rawPage:1;
 const rawCycle=p.get("cycleId")??"";
 const teamId=p.get("teamId");
 return {type,search,status,owner,lifecycle,sort,
  cycleId:uuid.test(rawCycle)?rawCycle:"",
  page,view:p.get("view")==="cards"?"cards":"list",
  ...(teamId&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(teamId)?{teamId}:{})};
}
export function registryIndexUrl(state:RegistryIndexState):string{
 const params=new URLSearchParams();
 if(state.type!=="all")params.set("type",state.type);
 if(state.teamId&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(state.teamId))
  params.set("teamId",state.teamId);
 if(state.search)params.set("search",state.search.slice(0,120));
 if(state.status)params.set("status",state.status);
 if(state.owner)params.set("owner",state.owner.slice(0,200));
 if(state.lifecycle!=="all")params.set("lifecycle",state.lifecycle);
 if(state.sort!=="default")params.set("sort",state.sort);
 if(state.cycleId&&uuid.test(state.cycleId))params.set("cycleId",state.cycleId);
 if(state.page>1&&Number.isSafeInteger(state.page))params.set("page",String(state.page));
 params.set("view",state.view);
 const query=params.toString();
 return registryIndexPath+(query?"?"+query:"");
}
/** Untrusted deep-link parameters must never become external or privileged destinations. */
export function safeRegistryIndexPath(raw:unknown):string{
 if(typeof raw!=="string"||raw.length>850)return registryIndexPath;
 try{
  const url=new URL(raw,"https://smn.invalid");
  if(!raw.startsWith("/app/")||raw.startsWith("//")||
   url.pathname!==registryIndexPath||url.origin!=="https://smn.invalid"||
   [...url.searchParams.keys()].some(key=>!allowed.has(key)))return registryIndexPath;
  return registryIndexUrl(parseRegistryIndexState(raw));
 }catch{return registryIndexPath;}
}
export function parseRegistryNavigation(input:{
 origin?:unknown;trail?:unknown;
},currentId:string):RegistryNavigation{
 const origin=safeRegistryIndexPath(input.origin);
 if(typeof input.trail!=="string"||input.trail.length>300||!uuid.test(currentId))
  return {origin,trail:[]};
 const trail=input.trail?input.trail.split(","):[];
 return {origin,trail:trail.length<=7&&trail.every(v=>uuid.test(v))?trail:[]};
}
export function enterRegistryRelation(context:RegistryNavigation,id:string):RegistryNavigation{
 return {origin:context.origin,trail:uuid.test(id)?[...context.trail,id].slice(-7):context.trail};
}
export function registryDetailHref(id:string,context:RegistryNavigation):string{
 if(!uuid.test(id))return registryIndexPath;
 const params=new URLSearchParams();
 const origin=safeRegistryIndexPath(context.origin);
 if(origin!==registryIndexPath)params.set("origin",origin);
 if(context.trail.length>0&&context.trail.length<=7&&
  context.trail.every(v=>uuid.test(v)))params.set("trail",context.trail.join(","));
 const query=params.toString();
 return registryIndexPath+"/"+encodeURIComponent(id)+(query?"?"+query:"");
}
export function registryScrollKey(origin:string):string{
 return "smn:registry-scroll:"+safeRegistryIndexPath(origin);
}
