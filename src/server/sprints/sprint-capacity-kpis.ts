import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import type {SprintContextItem} from "@/lib/sprint-context";

import {readDevelopmentCapacity} from "@/server/capacity/engine";
import {readActualCapacity} from "@/server/capacity/actual";

const MAX=99999999.9999;
export type SprintCapacityKpiValues=Readonly<{
 planned:number|null;actual:number|null;
 calculatedPlanned:number|null;calculatedActual:number|null;
}>;
export type SprintCapacityKpiView=
 |Readonly<{state:"available";values:SprintCapacityKpiValues;revision:number;
  source:"current"|"closure-snapshot";historicalQuality?:"known"|"estimated"|"not-supplied";historicalSource?:string|null;historicalActualQuality?:"known"|"estimated"|"not-supplied";historicalActualSource?:string|null;historicalActualRevision?:number;historicalRecordedAt?:string|null;historicalActualRecordedAt?:string|null;historicalCreatedAt?:string|null}>
 |Readonly<{state:"unavailable";reason:"history-missing"|"read-failed"}>;
type Stored={planned_jh:number|null;actual_jh:number|null;revision:number};
const valid=(v:unknown):v is number|null=>v===null||
 (typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=MAX&&
 Math.abs(Math.round(v*10000)-v*10000)<1e-6);
const record=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
const storedNumber=(v:unknown):number|null|undefined=>{
 if(v===null||v===undefined)return null;
 const n=typeof v==="string"&&v.trim()!==""?Number(v):v;
 return valid(n)?n:undefined;
};
export function selectCapacityKpis(
 planned:number|null,actual:number|null,calculatedPlanned:number|null,
 calculatedActual:number|null
):SprintCapacityKpiValues{
 return {planned,actual,calculatedPlanned,calculatedActual};
}
export async function ensureSprintCapacityKpiSchema(db:Client){
 const tables=await db.query<{name:string}>(`SELECT relname AS name FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
 AND relname=ANY($1::text[])`,[["smn_sprint_capacity_kpi","smn_sprint_capacity_kpi_audit"]]);
 if(!["smn_sprint_capacity_kpi","smn_sprint_capacity_kpi_audit"].every(name=>tables.rows.some(row=>row.name===name)))
  throw Error("sprint-capacity-kpis-schema-missing: apply explicit KPI migration");
}
export async function readSavedCapacityKpis(db:Client,sprintId:string):Promise<Stored|null>{
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_sprint_capacity_kpi') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return null;
 const found=await db.query<{planned_jh:string|null;actual_jh:string|null;revision:number}>(
  "SELECT planned_jh::text,actual_jh::text,revision FROM public.smn_sprint_capacity_kpi WHERE sprint_id=$1",
  [sprintId]);
 if(!found.rows[0])return null;
 const planned=storedNumber(found.rows[0].planned_jh);
 const actual=storedNumber(found.rows[0].actual_jh);
 if(planned===undefined||actual===undefined||!Number.isSafeInteger(found.rows[0].revision))
  throw Error("capacity-kpi-corrupted");
 return {planned_jh:planned,actual_jh:actual,revision:found.rows[0].revision};
}
/** Called under the dashboard's REPEATABLE READ READ ONLY transaction. */
export async function readSprintCapacityKpiView(
 db:Client,teamId:string,sprint:SprintContextItem
):Promise<SprintCapacityKpiView>{
 if(sprint.status==="closed"){
  const present=await db.query<{present:boolean}>(
   "SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present");
  if(!present.rows[0]?.present)return {state:"unavailable",reason:"history-missing"};
  const row=await db.query<{snapshot:unknown}>(
   "SELECT snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1",
   [sprint.id]);
  if(!row.rows[0])return {state:"unavailable",reason:"history-missing"};
  const snapshot=record(row.rows[0].snapshot);
  if(!snapshot)return {state:"unavailable",reason:"read-failed"};
  const kpi=record(snapshot.capacityKpis),legacy=record(snapshot.capacity);
  if(!kpi&&!legacy)return {state:"unavailable",reason:"history-missing"};
  const planned=storedNumber(kpi?.planned??legacy?.initial_jh);
  const actual=storedNumber(kpi?.actual??legacy?.actual_jh);
  if(planned===undefined||actual===undefined)return {state:"unavailable",reason:"read-failed"};
  return {state:"available",source:"closure-snapshot",revision:0,
   values:selectCapacityKpis(planned,actual,null,null)};
 }
 const recorded=await db.query<{details:unknown;occurred_at:string}>(`
 SELECT details,occurred_at::text AS occurred_at FROM public.smn_sprint_audit WHERE sprint_id=$1 AND action='historical-created'
 ORDER BY occurred_at LIMIT 1`,[sprint.id]);
 const historical=recorded.rows.length>0;
 if(historical){
  const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_sprint_historical_capacity') IS NOT NULL AS present`);
  const value=table.rows[0]?.present?await db.query<{qualified_jh:string|null;quality:"known"|"estimated"|"not-supplied";source_ref:string|null;revision:number;updated_at:string}>(`
   SELECT qualified_jh::text,quality,source_ref,revision,updated_at::text FROM public.smn_sprint_historical_capacity WHERE sprint_id=$1`,[sprint.id]):null;
  const entry=value?.rows[0];
  const planned=entry?.qualified_jh===null||!entry?null:Number(entry.qualified_jh);
  const actualTable=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_sprint_historical_actual_capacity') IS NOT NULL AS present`);
  const actualRows=actualTable.rows[0]?.present?await db.query<{qualified_jh:string|null;quality:"known"|"estimated"|"not-supplied";source_ref:string|null;revision:number;updated_at:string}>(`
   SELECT qualified_jh::text,quality,source_ref,revision,updated_at::text FROM public.smn_sprint_historical_actual_capacity WHERE sprint_id=$1`,[sprint.id]):null;
  const actualEntry=actualRows?.rows[0];
  const actual=actualEntry?.qualified_jh===null||!actualEntry?null:Number(actualEntry.qualified_jh);
  return {state:"available",source:"current",revision:entry?.revision??0,
   historicalQuality:entry?.quality??"not-supplied",historicalSource:entry?.source_ref??null,
   historicalActualQuality:actualEntry?.quality??"not-supplied",
   historicalActualSource:actualEntry?.source_ref??null,
   historicalActualRevision:actualEntry?.revision??0,
   historicalRecordedAt:entry?.updated_at??null,historicalActualRecordedAt:actualEntry?.updated_at??null,
   historicalCreatedAt:recorded.rows[0]?.occurred_at??null,
   values:selectCapacityKpis(planned,actual,null,null)};
 }
 const stored=await readSavedCapacityKpis(db,sprint.id);
 const date=(value:string)=>{const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:sprint.timeZone,year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(new Date(value));
  const v=(key:string)=>parts.find(p=>p.type===key)?.value??"";
  return v("year")+"-"+v("month")+"-"+v("day");
 };
 const start=date(sprint.startAt);
 const end=date(new Date(Date.parse(sprint.endAt)-1).toISOString());
 /** Optional calculators are isolated: missing migrations cannot abort the page. */
 const optional=async(name:string,fn:()=>Promise<number|null>)=>{
  await db.query("SAVEPOINT "+name);
  try{
   const value=await fn();
   await db.query("RELEASE SAVEPOINT "+name);
   return value;
  }catch{
   await db.query("ROLLBACK TO SAVEPOINT "+name);
   await db.query("RELEASE SAVEPOINT "+name);
   return null;
  }
 };
 const calculatedPlanned=await optional("smn_capacity_kpi_planned",async()=>{
  const report=await readDevelopmentCapacity(db,start,end,{externalTransaction:true,teamId});
  if(report.team.id!==teamId||report.missing.length||report.status!=="calculated")return null;
  return valid(report.totalJh)?report.totalJh:null;
 });
 const calculatedActual=await optional("smn_capacity_kpi_actual",async()=>{
  const report=await readActualCapacity(db,start,end,readDevelopmentCapacity,
   {externalTransaction:true,teamId});
  if(report.status==="upcoming"||report.missingSources.length)return null;
  return valid(report.referenceJh)?report.referenceJh:null;
 });
 return {state:"available",source:"current",revision:stored?.revision??0,
  values:selectCapacityKpis(stored?.planned_jh??null,stored?.actual_jh??null,
   calculatedPlanned,calculatedActual)};
}
export async function writeSprintCapacityKpis(db:Client,actorId:string,raw:unknown){
 const input=record(raw);
 if(!input||Object.keys(input).sort().join(",")!=="capacity,revision,sprintId"||
  typeof input.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(input.sprintId)||
  !Number.isSafeInteger(input.revision)||Number(input.revision)<0)
  return {ok:false as const,error:"invalid-input" as const};
 const values=record(input.capacity);
 if(!values||Object.keys(values).sort().join(",")!=="actual,planned"||
  !valid(values.planned)||!valid(values.actual)||!actorId)
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const sprint=await db.query<{id:string;status:string}>(
   "SELECT s.id,s.status FROM public.smn_sprint s "+
   "JOIN public.smn_team t ON t.id=s.team_id "+
   "JOIN public.smn_installation i ON i.id=t.installation_id "+
   "WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' "+
   "AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))='scrum' AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false FOR UPDATE OF s",[input.sprintId]);
  if(!sprint.rows[0]){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};
  }
  if(sprint.rows[0].status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  const historical=await db.query<{historical:boolean}>(`SELECT EXISTS(
   SELECT 1 FROM public.smn_sprint_audit WHERE sprint_id=$1 AND action='historical-created'
  ) AS historical`,[input.sprintId]);
  if(historical.rows[0]?.historical){
   await db.query("ROLLBACK");return {ok:false as const,error:"historical-capacity-protected" as const};
  }
  await ensureSprintCapacityKpiSchema(db);
  const before=await db.query<{planned_jh:string|null;actual_jh:string|null;revision:number}>(
   "SELECT planned_jh::text,actual_jh::text,revision FROM public.smn_sprint_capacity_kpi WHERE sprint_id=$1 FOR UPDATE",
   [input.sprintId]);
  const prior=before.rows[0],revision=prior?.revision??0;
  if(revision!==input.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  if(prior){
   await db.query("UPDATE public.smn_sprint_capacity_kpi SET "+
    "planned_jh=$2,actual_jh=$3,revision=revision+1,updated_by=$4,updated_at=now() "+
    "WHERE sprint_id=$1",[input.sprintId,values.planned,values.actual,actorId]);
  }else{
   await db.query("INSERT INTO public.smn_sprint_capacity_kpi "+
    "(sprint_id,planned_jh,actual_jh,updated_by) VALUES($1,$2,$3,$4)",
    [input.sprintId,values.planned,values.actual,actorId]);
  }
  await db.query("INSERT INTO public.smn_sprint_capacity_kpi_audit "+
   "(id,sprint_id,before_values,after_values,actor_id) "+
   "VALUES($1,$2,$3::jsonb,$4::jsonb,$5)",[
    randomUUID(),input.sprintId,
    prior?JSON.stringify({planned:prior.planned_jh===null?null:Number(prior.planned_jh),
     actual:prior.actual_jh===null?null:Number(prior.actual_jh)}):null,
    JSON.stringify(values),actorId
   ]);
  await db.query("COMMIT");
  return {ok:true as const,revision:revision+1};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
