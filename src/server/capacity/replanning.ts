import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseCapacityPeriod,readDevelopmentCapacity,type CapacityReport,type CapacityMissing} from "./engine";

type Dates={oldStart:string;oldEnd:string;newStart:string;newEnd:string};
export type Reference={jh:number|null;status:"calculated"|"not-calculable";missing:CapacityMissing[]};
export type ReplanningPreview=Dates&{
 teamId:string;revision:number;originRevision:number;previewDigest:string;
 before:Reference;after:Reference;referenceDeltaJh:number|null;
 manualPlannedJh:number|null;manualActualJh:number|null;
 retainedBeforeJh:number|null;proposedRetainedAfterJh:number|null;
 initialFrozenJh:number|null;initialFrozenSource:string|null;
 originalClosed:boolean;targetOccupied:boolean;canConfirm:boolean;
 blockers:("closed"|"target-in-use"|"same-period"|"missing-reference")[];
};
type PreviewError="invalid-input"|"period-not-found"|"team-unavailable"|"calculation-error";
type ConfirmError=PreviewError|"conflict"|"closed"|"target-in-use"|"not-calculable";
export type PreviewResponse={ok:true;preview:ReplanningPreview}|
 {ok:false;error:PreviewError};
export type ConfirmResponse={ok:true;alreadyConfirmed:boolean;preview:ReplanningPreview}|
 {ok:false;error:ConfirmError};
type PlanningRow={id:string;period_id:string;target_start_on:string;target_end_on:string;
 revision:number};
type PeriodRow={id:string;manual_jh:number|null;revision:number;frozen_at:string|null;closed_at:string|null};
type EventRow={confirmed_values:ReplanningPreview;period_id:string};
const token=/^[a-f0-9]{64}$/u;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export function parseReplanning(raw:unknown):Dates|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 const keys=["oldStart","oldEnd","newStart","newEnd"];
 if(Object.keys(v).length!==4||Object.keys(v).some(k=>!keys.includes(k))||
  keys.some(k=>typeof v[k]!=="string"))return null;
 const old=parseCapacityPeriod(new URLSearchParams({
  start:v.oldStart as string,end:v.oldEnd as string
 }));
 const next=parseCapacityPeriod(new URLSearchParams({
  start:v.newStart as string,end:v.newEnd as string
 }));
 if(!old||!next)return null;
 return {oldStart:old.start,oldEnd:old.end,newStart:next.start,newEnd:next.end};
}
export function parseConfirmation(raw:unknown):
 (Dates&{revision:number;previewDigest:string;eventId:string})|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==7||!["revision","previewDigest","eventId"].every(k=>k in v)||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<0||
  typeof v.previewDigest!=="string"||!token.test(v.previewDigest)||
  typeof v.eventId!=="string"||!uuid.test(v.eventId))return null;
 const parsed=parseReplanning({
  oldStart:v.oldStart,oldEnd:v.oldEnd,newStart:v.newStart,newEnd:v.newEnd
 });
 return parsed?{...parsed,revision:v.revision,previewDigest:v.previewDigest,
  eventId:v.eventId.toLowerCase()}:null;
}
const teamSql=[
 "SELECT t.id FROM public.smn_team t JOIN public.smn_installation i",
 "ON t.installation_id=i.id WHERE i.id='singleton' AND i.state='initialized'",
 "AND i.schema_version<=27 AND i.mode IN ('scrum','kanban') LIMIT 2"
].join(" ");
const originSql=[
 "SELECT id,manual_jh::float8 AS manual_jh,revision,",
 "frozen_at::text AS frozen_at,closed_at::text AS closed_at",
 "FROM public.smn_capacity_period_override",
 "WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date"
].join(" ");
const plannedSql=[
 "SELECT id,period_id,target_start_on::text AS target_start_on,",
 "target_end_on::text AS target_end_on,revision",
 "FROM public.smn_capacity_replanning WHERE period_id=$1"
].join(" ");
export const capacityDelta=(a:number|null,b:number|null):number|null=>
 a===null||b===null?null:
 Math.round((b-a+Number.EPSILON)*10000)/10000;
function reference(r:CapacityReport):Reference{
 return {jh:r.totalJh,status:r.totalJh===null?"not-calculable":"calculated",
  missing:[...new Set(r.missing.map(x=>x.source))]};
}
const digest=(payload:unknown)=>createHash("sha256").update(JSON.stringify(payload)).digest("hex");
type Context={teamId:string;origin:PeriodRow|null;plan:PlanningRow|null;
 initialJh:number|null;initialSource:string|null;actualManualJh:number|null;
 targetOccupied:boolean};
async function load(db:Client,dates:Dates,lock:boolean):
 Promise<Context>{
 const teams=await db.query<{id:string}>(teamSql+(lock?" FOR UPDATE OF t":""));
 if(teams.rows.length!==1)throw Error("replanning-team-unavailable");
 const teamId=teams.rows[0].id;
 const origin=(await db.query<PeriodRow>(originSql+(lock?" FOR UPDATE":" LIMIT 1"),
  [teamId,dates.oldStart,dates.oldEnd])).rows[0]??null;
 const [plan,initial,actual,target]=await Promise.all([
  origin?db.query<PlanningRow>(plannedSql+(lock?" FOR UPDATE":" LIMIT 1"),[origin.id]):
   Promise.resolve({rows:[] as PlanningRow[]}),
  origin?db.query<{initial_jh:number|null;provenance:string}>([
   "SELECT initial_jh::float8 AS initial_jh,provenance",
   "FROM public.smn_capacity_initial_snapshot WHERE period_id=$1 LIMIT 1"
  ].join(" "),[origin.id]):Promise.resolve({rows:[] as {initial_jh:number|null;provenance:string}[]}),
  origin?db.query<{manual_jh:number|null}>([
   "SELECT manual_jh::float8 AS manual_jh",
   "FROM public.smn_capacity_actual_override WHERE period_id=$1 LIMIT 1"
  ].join(" "),[origin.id]):Promise.resolve({rows:[] as {manual_jh:number|null}[]}),
  db.query<{id:string}>([
   "SELECT id FROM public.smn_capacity_period_override",
   "WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date LIMIT 1"
  ].join(" "),[teamId,dates.newStart,dates.newEnd])
 ]);
 return {teamId,origin,plan:plan.rows[0]??null,
  initialJh:initial.rows[0]?.initial_jh??null,
  initialSource:initial.rows[0]?.provenance??null,
  actualManualJh:actual.rows[0]?.manual_jh??null,
  targetOccupied:target.rows.length>0&&target.rows[0].id!==origin?.id};
}
async function compute(db:Client,dates:Dates,ctx:Context,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true})=>
  Promise<CapacityReport>):Promise<ReplanningPreview>{
 const [current,future]=await Promise.all([
  calculate(db,dates.oldStart,dates.oldEnd,{externalTransaction:true}),
  calculate(db,dates.newStart,dates.newEnd,{externalTransaction:true})
 ]);
 if(current.team.id!==ctx.teamId||future.team.id!==ctx.teamId)
  throw Error("replanning-team-changed");
 const before=reference(current),after=reference(future);
 const same=dates.oldStart===dates.newStart&&dates.oldEnd===dates.newEnd;
 const blockers:ReplanningPreview["blockers"]=[];
 if(ctx.origin?.closed_at)blockers.push("closed");
 if(ctx.targetOccupied)blockers.push("target-in-use");
 if(same)blockers.push("same-period");
 if(before.jh===null||after.jh===null)blockers.push("missing-reference");
 const manual=ctx.origin?.manual_jh??null;
 const retainedBefore=manual!==null?manual:before.jh;
 // This is a PROPOSAL only: no manual value is copied to the target row.
 const proposedAfter=manual!==null?manual:after.jh;
 const facts={dates,teamId:ctx.teamId,originId:ctx.origin?.id??null,
  originRevision:ctx.origin?.revision??0,originalClosed:Boolean(ctx.origin?.closed_at),
  initialJh:ctx.initialJh,initialSource:ctx.initialSource,
  actualManualJh:ctx.actualManualJh,manual,planRevision:ctx.plan?.revision??0,
  planTarget:ctx.plan?{
   start:ctx.plan.target_start_on,end:ctx.plan.target_end_on
  }:null,occupied:ctx.targetOccupied,before,after,
  currentReportDigest:digest(current),futureReportDigest:digest(future)};
 return {...dates,teamId:ctx.teamId,revision:ctx.plan?.revision??0,
  originRevision:ctx.origin?.revision??0,previewDigest:digest(facts),
  before,after,referenceDeltaJh:capacityDelta(before.jh,after.jh),
  manualPlannedJh:manual,manualActualJh:ctx.actualManualJh,
  retainedBeforeJh:retainedBefore,proposedRetainedAfterJh:proposedAfter,
  initialFrozenJh:ctx.initialJh,initialFrozenSource:ctx.initialSource,
  originalClosed:Boolean(ctx.origin?.closed_at),targetOccupied:ctx.targetOccupied,
  canConfirm:blockers.length===0,blockers};
}
export async function previewReplanning(db:Client,raw:unknown,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true})=>
  Promise<CapacityReport>=readDevelopmentCapacity):Promise<PreviewResponse>{
 const dates=parseReplanning(raw);
 if(!dates)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  const ctx=await load(db,dates,false);
  const preview=await compute(db,dates,ctx,calculate);
  await db.query("COMMIT");
  return {ok:true,preview};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as Error).message==="replanning-team-unavailable")
   return {ok:false,error:"team-unavailable"};
  return {ok:false,error:"calculation-error"};
 }
}
/** Confirms a CAPACITY PLANNING target, not the eventual Epic 4/7 cycle entity.
 * The source period and both sets of manual values/snapshots are never updated. */
export async function confirmReplanning(db:Client,actorId:string,raw:unknown,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true})=>
  Promise<CapacityReport>=readDevelopmentCapacity):Promise<ConfirmResponse>{
 const value=parseConfirmation(raw);
 if(!actorId||!value)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
 try{
  const fail=async(error:ConfirmError):Promise<ConfirmResponse>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const ctx=await load(db,value,true);
  const replay=await db.query<EventRow>([
   "SELECT h.confirmed_values,p.period_id FROM public.smn_capacity_replanning_history h",
   "JOIN public.smn_capacity_replanning p ON p.id=h.replanning_id",
   "WHERE h.event_id=$1 LIMIT 1"
  ].join(" "),[value.eventId]);
  if(replay.rows[0]){
   const stored=replay.rows[0];
   if(stored.period_id!==ctx.origin?.id||
    stored.confirmed_values.newStart!==value.newStart||
    stored.confirmed_values.newEnd!==value.newEnd)
    return fail("conflict");
   await db.query("COMMIT");
   return {ok:true,alreadyConfirmed:true,preview:stored.confirmed_values};
  }
  if(ctx.plan?.revision!==undefined&&ctx.plan.revision!==value.revision||
   !ctx.plan&&value.revision!==0)return fail("conflict");
  // The planning and all referenced capacity values are re-read in this transaction.
  // L'empreinte porte sur les dates métier, sans les champs techniques du POST.
  const dates:Dates={oldStart:value.oldStart,oldEnd:value.oldEnd,
   newStart:value.newStart,newEnd:value.newEnd};
  const preview=await compute(db,dates,ctx,calculate);
  if(preview.originalClosed)return fail("closed");
  if(preview.targetOccupied)return fail("target-in-use");
  if(!preview.canConfirm)return fail("not-calculable");
  if(preview.previewDigest!==value.previewDigest)return fail("conflict");
  const nextRevision=value.revision+1;
  // A computed-only period has no persistence row until an actual confirmation.
  let originalPeriodId=ctx.origin?.id;
  if(!originalPeriodId){
   originalPeriodId=randomUUID();
   await db.query([
    "INSERT INTO public.smn_capacity_period_override",
    "(id,team_id,start_on,end_on,manual_jh,revision)",
    "VALUES($1,$2,$3::date,$4::date,NULL,1)"
   ].join(" "),[originalPeriodId,ctx.teamId,value.oldStart,value.oldEnd]);
  }
  const id=ctx.plan?.id??randomUUID();
  if(ctx.plan){
   const updated=await db.query([
    "UPDATE public.smn_capacity_replanning SET target_start_on=$2::date,",
    "target_end_on=$3::date,revision=revision+1,confirmed_by=$4,",
    "confirmed_at=clock_timestamp() WHERE id=$1 AND revision=$5"
   ].join(" "),[id,value.newStart,value.newEnd,actorId,value.revision]);
   if(updated.rowCount!==1)return fail("conflict");
  }else{
   await db.query([
    "INSERT INTO public.smn_capacity_replanning",
    "(id,period_id,target_start_on,target_end_on,revision,confirmed_by)",
    "VALUES($1,$2,$3::date,$4::date,1,$5)"
   ].join(" "),[id,originalPeriodId,value.newStart,value.newEnd,actorId]);
  }
  const oldValue=ctx.plan?{
   newStart:ctx.plan.target_start_on,newEnd:ctx.plan.target_end_on,
   revision:ctx.plan.revision
  }:null;
  await db.query([
   "INSERT INTO public.smn_capacity_replanning_history",
   "(id,replanning_id,revision,event_id,previous_values,",
   "confirmed_values,preview_digest,confirmed_by)",
   "VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)"
  ].join(" "),[randomUUID(),id,nextRevision,value.eventId,
   oldValue?JSON.stringify(oldValue):null,JSON.stringify(preview),
   preview.previewDigest,actorId]);
  await db.query("COMMIT");
  return {ok:true,alreadyConfirmed:false,preview};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505"||
   (error as {code?:string})?.code==="40001")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
