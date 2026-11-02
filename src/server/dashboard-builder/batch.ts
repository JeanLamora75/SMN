import type {Client} from "pg";
import {readRegistryDashboardList,readCalendarDashboardList,readNotesDashboardList,type DashboardListPayload} from "./lists";
import type {LayoutScope} from "./layout";
import {requireDashboardPermission} from "./permissions";
import {listDashboardSources,resolveDashboardSource} from "./sources";

export type BatchRequest=Readonly<{id:string;source:string;view:string;cycleId?:string|null;filters?:Record<string,unknown>}>;
export type BatchResult=Readonly<{id:string;state:"available"|"null"|"absent"|"unavailable"|"incompatible"|"error";value?:string;unit?:string|null;message?:string;list?:DashboardListPayload}>;
const idOk=(v:unknown):v is string=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const sourceOk=(v:unknown):v is string=>typeof v==="string"&&/^[A-Za-z][A-Za-z0-9:_-]{0,119}$/.test(v);
const cleanFilter=(f:unknown):f is Record<string,unknown>=>f===undefined||(!!f&&typeof f==="object"&&!Array.isArray(f)&&Object.keys(f).length<=20&&JSON.stringify(f).length<=3000);
export function validateBatchRequests(input:unknown):BatchRequest[]{
 if(!Array.isArray(input)||input.length>80)throw Error("dashboard-batch-invalid");
 const ids=new Set<string>();
 return input.map((v:unknown)=>{
  if(!v||typeof v!=="object"||Array.isArray(v))throw Error("dashboard-batch-invalid");
  const r=v as Record<string,unknown>;
  if(!idOk(r.id)||ids.has(r.id)||!sourceOk(r.source)||typeof r.view!=="string"||
   (r.cycleId!==undefined&&r.cycleId!==null&&!idOk(r.cycleId))||!cleanFilter(r.filters))
   throw Error("dashboard-batch-invalid");
  ids.add(r.id);
  return {id:r.id,source:r.source,view:r.view,cycleId:r.cycleId as string|null|undefined,
   filters:r.filters as Record<string,unknown>|undefined};
 });
}
/** Stable, canonical cache identity; caller must use a permission fingerprint from the checked session. */
export function batchCacheKey(scope:LayoutScope,permissionFingerprint:string,request:BatchRequest):string{
 if(!permissionFingerprint)throw Error("dashboard-cache-scope-invalid");
 const sort=(v:unknown):unknown=>Array.isArray(v)?v.map(sort):
  v&&typeof v==="object"?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,sort(x)])):v;
 return JSON.stringify([scope.installationId,scope.accountId,scope.teamId,permissionFingerprint,
  request.cycleId??null,request.source,request.view,sort(request.filters??{})]);
}
type IndicatorResult={value:string|null;result_state?:string};
/** Each requested source is isolated: one failing query cannot poison other slots. */
export async function readDashboardBatch(db:Client,scope:LayoutScope,requests:readonly BatchRequest[]):Promise<BatchResult[]>{
 const permission=await requireDashboardPermission(db,scope,"read");
 const catalog=await listDashboardSources(db,scope);
 const permissionFingerprint=JSON.stringify(permission);
 const unique=new Map<string,Promise<Omit<BatchResult,"id">>>();
 const resolve=async(r:BatchRequest):Promise<Omit<BatchResult,"id">>=>{
  const source=resolveDashboardSource(catalog,r.source,r.view);
  if(source.status==="unknown")return {state:"absent"};
  if(source.status==="unavailable")return {state:"unavailable",message:source.reason};
  if(source.status==="incompatible")return {state:"incompatible"};
  if(source.source.category==="registry"&&r.view==="list"){
   try{const list=await readRegistryDashboardList(db,scope,r);return {state:list.rows.length?"available":"absent",list};}
   catch{return {state:"error",message:"registry-read-failed"};}
  }
  if((source.source.category==="calendar"||source.source.category==="notes")&&r.view==="list"){
   try{
    const list=source.source.category==="calendar"?await readCalendarDashboardList(db,scope,r):await readNotesDashboardList(db,scope,r);
    return {state:list.rows.length?"available":"absent",list};
   }catch{return {state:"error",message:"dashboard-list-read-failed"};}
  }
  if(source.source.category!=="indicator")return {state:"unavailable"};
  if(!r.cycleId)return {state:"absent"};
  try{
   const indicatorId=r.source.slice("indicator:".length);
   const query=await db.query<IndicatorResult>(`
    SELECT value::text AS value FROM public.smn_indicator_manual_value
    WHERE team_id=$1 AND indicator_id=$2 AND cycle_id=$3
    UNION ALL
    SELECT CASE WHEN result_state='available' THEN value::text ELSE NULL END AS value
    FROM public.smn_indicator_computed_result
    WHERE team_id=$1 AND indicator_id=$2 AND cycle_id=$3
    LIMIT 2`,[scope.teamId,indicatorId,r.cycleId]);
   if(!query.rows.length)return {state:"absent"};
   if(query.rows.length!==1)return {state:"error",message:"ambiguous-producer"};
   const value=query.rows[0].value;
   return value===null?{state:"null"}:{state:"available",value,unit:source.source.unit};
  }catch{return {state:"error",message:"source-read-failed"};}
 };
 // Batch coalesces duplicate data requests without persisting sensitive values globally.
 return Promise.all(requests.map(async r=>{
  const key=batchCacheKey(scope,permissionFingerprint,r);
  let pending=unique.get(key);
  if(!pending){pending=resolve(r);unique.set(key,pending);}
  return {id:r.id,...await pending};
 }));
}
