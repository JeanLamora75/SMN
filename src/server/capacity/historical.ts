import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseCapacityPeriod} from "./engine";

export type HistoricalQuality="known"|"estimated"|"not-supplied";
export type HistoricalSource="document"|"import"|"reconstruction"|"other";
export type HistoricalValue={
 quality:HistoricalQuality;qualifiedJh:number|null;
 sourceKind:HistoricalSource|null;sourceRef:string|null;rationale:string|null;
 revision:number;updatedAt:string|null;
};
export type HistoricalRevision={revision:number;before:HistoricalValue|null;
 after:HistoricalValue;changedAt:string;changedBy:string|null};
export type HistoricalResult=HistoricalValue&{
 start:string;end:string;asOfDate:string;isHistorical:boolean;
 history:HistoricalRevision[];
};
export type HistoricalInput={
 start:string;end:string;revision:number;quality:HistoricalQuality;
 qualifiedJh:number|null;sourceKind:HistoricalSource|null;
 sourceRef:string|null;rationale:string;
};
export type HistoricalWriteResult={ok:true;revision:number}|
 {ok:false;error:"invalid-input"|"not-historical"|"conflict"|"team-unavailable"};

type DbRow={
 id:string;quality:HistoricalQuality;qualified_jh:number|null;
 source_kind:HistoricalSource|null;source_ref:string|null;rationale:string;
 revision:number;updated_at:string;
};
type HistoryDbRow={
 revision:number;before_values:HistoricalValue|null;after_values:HistoricalValue;
 changed_at:string;changed_by:string|null;
};
const teamSql=[
 "SELECT t.id FROM public.smn_team t",
 "JOIN public.smn_installation i ON i.id=t.installation_id",
 "WHERE i.id='singleton' AND i.state='initialized'",
 "AND i.mode IN ('scrum','kanban') LIMIT 2"
].join(" ");
const rowSql=[
 "SELECT id,quality,qualified_jh::float8 AS qualified_jh,source_kind,",
 "source_ref,rationale,revision,updated_at::text AS updated_at",
 "FROM public.smn_capacity_historical_quality",
 "WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date"
].join(" ");
const empty:HistoricalValue={
 quality:"not-supplied",qualifiedJh:null,sourceKind:null,sourceRef:null,
 rationale:null,revision:0,updatedAt:null
};
const project=(r:DbRow):HistoricalValue=>({
 quality:r.quality,qualifiedJh:r.qualified_jh,sourceKind:r.source_kind,
 sourceRef:r.source_ref,rationale:r.rationale,
 revision:r.revision,updatedAt:r.updated_at
});
export function parseHistoricalInput(raw:unknown):HistoricalInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 const keys=["start","end","revision","quality","qualifiedJh",
  "sourceKind","sourceRef","rationale"];
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k))||
  typeof v.start!=="string"||typeof v.end!=="string"||
  !parseCapacityPeriod(new URLSearchParams({start:v.start,end:v.end}))||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<0||
  !["known","estimated","not-supplied"].includes(String(v.quality))||
  typeof v.rationale!=="string"||v.rationale.trim().length<5||
  v.rationale.trim().length>1000)return null;
 const quality=v.quality as HistoricalQuality;
 if(quality==="not-supplied"){
  if(v.qualifiedJh!==null||v.sourceKind!==null||v.sourceRef!==null)return null;
  return {start:v.start,end:v.end,revision:v.revision,quality,
   qualifiedJh:null,sourceKind:null,sourceRef:null,rationale:v.rationale.trim()};
 }
 if(typeof v.qualifiedJh!=="number"||!Number.isFinite(v.qualifiedJh)||
  v.qualifiedJh<0||v.qualifiedJh>99999999.9999||
  Math.abs(Math.round(v.qualifiedJh*10000)-v.qualifiedJh*10000)>1e-6||
  !["document","import","reconstruction","other"].includes(String(v.sourceKind))||
  typeof v.sourceRef!=="string"||v.sourceRef.trim().length<3||
  v.sourceRef.trim().length>500||
  (quality==="known"&&v.sourceKind==="reconstruction"))return null;
 return {start:v.start,end:v.end,revision:v.revision,quality,
  qualifiedJh:v.qualifiedJh,sourceKind:v.sourceKind as HistoricalSource,
  sourceRef:v.sourceRef.trim(),rationale:v.rationale.trim()};
}

/** Distinct retrospective qualification: NEVER fabricates an original opening snapshot. */
export function comparisonJh(initial:HistoricalValue,actualJh:number|null,
 actualStatus:"upcoming"|"in-progress"|"finished"|"closed"):number|null{
 if(initial.quality!=="known"||initial.qualifiedJh===null||
  actualJh===null||!Number.isFinite(actualJh)||
  (actualStatus!=="finished"&&actualStatus!=="closed"))return null;
 return Math.round((actualJh-initial.qualifiedJh+Number.EPSILON)*10000)/10000;
}

export async function readHistoricalQuality(db:Client,start:string,end:string):
 Promise<HistoricalResult>{
 if(!parseCapacityPeriod(new URLSearchParams({start,end})))
  throw Error("historical-quality-invalid-period");
 await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  const team=await db.query<{id:string}>(teamSql);
  if(team.rows.length!==1)throw Error("historical-quality-team-unavailable");
  const clock=await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today");
  const today=clock.rows[0]?.today;
  if(!today)throw Error("historical-quality-clock-unavailable");
  const historical=end<today;
  const found=await db.query<DbRow>(rowSql+" LIMIT 1",
   [team.rows[0].id,start,end]);
  const row=found.rows[0];
  const history:HistoricalRevision[]=[];
  if(row){
   const changes=await db.query<HistoryDbRow>([
    "SELECT revision,before_values AS before_values,after_values AS after_values,",
    "changed_at::text AS changed_at,changed_by",
    "FROM public.smn_capacity_historical_quality_history",
    "WHERE qualification_id=$1 ORDER BY revision DESC LIMIT 100"
   ].join(" "),[row.id]);
   for(const change of changes.rows)history.push({
    revision:change.revision,before:change.before_values,after:change.after_values,
    changedAt:change.changed_at,changedBy:change.changed_by
   });
  }
  await db.query("COMMIT");
  return {...(row?project(row):empty),start,end,asOfDate:today,
   isHistorical:historical,history};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);throw error;
 }
}
export async function saveHistoricalQuality(db:Client,actorId:string,raw:unknown):
 Promise<HistoricalWriteResult>{
 const value=parseHistoricalInput(raw);
 if(!actorId||!value)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-historical"|"conflict"|"team-unavailable"):
   Promise<HistoricalWriteResult>=>{
    await db.query("ROLLBACK");return {ok:false,error};
   };
  // Lock the single team to serialize creation of an absent qualification.
  const team=await db.query<{id:string}>(teamSql+" FOR UPDATE OF t");
  if(team.rows.length!==1)return fail("team-unavailable");
  const clock=await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today");
  const today=clock.rows[0]?.today;
  if(!today)throw Error("historical-quality-clock-unavailable");
  if(value.end>=today)return fail("not-historical");
  const old=(await db.query<DbRow>(rowSql+" FOR UPDATE",
   [team.rows[0].id,value.start,value.end])).rows[0];
  if((old?.revision??0)!==value.revision)return fail("conflict");
  const nextRevision=value.revision+1;
  const id=old?.id??randomUUID();
  if(old){
   const updated=await db.query([
    "UPDATE public.smn_capacity_historical_quality",
    "SET quality=$2,qualified_jh=$3,source_kind=$4,source_ref=$5,",
    "rationale=$6,revision=revision+1,updated_by=$7,updated_at=clock_timestamp()",
    "WHERE id=$1 AND revision=$8"
   ].join(" "),[id,value.quality,value.qualifiedJh,value.sourceKind,
    value.sourceRef,value.rationale,actorId,value.revision]);
   if(updated.rowCount!==1)return fail("conflict");
  }else{
   await db.query([
    "INSERT INTO public.smn_capacity_historical_quality",
    "(id,team_id,start_on,end_on,quality,qualified_jh,source_kind,",
    "source_ref,rationale,revision,updated_by)",
    "VALUES($1,$2,$3::date,$4::date,$5,$6,$7,$8,$9,1,$10)"
   ].join(" "),[id,team.rows[0].id,value.start,value.end,value.quality,
    value.qualifiedJh,value.sourceKind,value.sourceRef,value.rationale,actorId]);
  }
  const after=(await db.query<DbRow>(rowSql+" LIMIT 1",
   [team.rows[0].id,value.start,value.end])).rows[0];
  if(!after||after.revision!==nextRevision)
   throw Error("historical-quality-inconsistent-revision");
  await db.query([
   "INSERT INTO public.smn_capacity_historical_quality_history",
   "(id,qualification_id,revision,before_values,after_values,changed_by)",
   "VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)"
  ].join(" "),[randomUUID(),id,nextRevision,
   old?JSON.stringify(project(old)):null,JSON.stringify(project(after)),actorId]);
  await db.query("COMMIT");
  return {ok:true,revision:nextRevision};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505")return {ok:false,error:"conflict"};
  throw error;
 }
}
