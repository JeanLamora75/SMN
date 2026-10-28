import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseCapacityPeriod,readDevelopmentCapacity,type CapacityReport,type CapacityMissing} from "./engine";
import {readInitialSnapshot} from "./opening";

export type PeriodStatus="upcoming"|"in-progress"|"finished"|"closed";
export type ActualSource="Saisie"|"Calcul"|"Non renseigné";
export type ActualResult={
 status:PeriodStatus;start:string;end:string;asOfDate:string;
 observedThrough:string|null;referenceJh:number|null;manualJh:number|null;
 retainedJh:number|null;source:ActualSource;revision:number;
 closedAt:string|null;closureEventId:string|null;initialJh:number|null;
 gapJh:number|null;missingSources:CapacityMissing[];
};
type PeriodRow={id:string;closed_at:string|null};
type ManualRow={id:string;manual_jh:number|null;revision:number};
type ClosedRow={retained_jh:number|null;reference_jh:number|null;
 provenance:ActualSource;closed_at:string;event_id:string};
type ActorTeam={id:string};
type Change={action:"set"|"clear";start:string;end:string;
 revision:number;manualJh?:number};
export type ActualWriteResult={ok:true;revision:number}|{ok:false;
 error:"invalid-input"|"future-period"|"protected"|"conflict"|"nothing-to-clear"|"team-unavailable"};
export type CloseResult={ok:true;alreadyClosed:boolean;result:ActualResult}|{
 ok:false;error:"invalid-input"|"not-finished"|"conflict"|"team-unavailable"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const teamSql=[
 "SELECT t.id FROM public.smn_team t JOIN public.smn_installation i",
 "ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized'",
 "AND i.schema_version<=27 AND i.mode IN ('scrum','kanban') LIMIT 2"
].join(" ");
const periodSql=[
 "SELECT id,closed_at::text AS closed_at FROM public.smn_capacity_period_override",
 "WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date"
].join(" ");
const manualSql=[
 "SELECT id,manual_jh::float8 AS manual_jh,revision",
 "FROM public.smn_capacity_actual_override WHERE period_id=$1"
].join(" ");
const closedSql=[
 "SELECT retained_jh::float8 AS retained_jh,reference_jh::float8 AS reference_jh,",
 "provenance,closed_at::text AS closed_at,event_id",
 "FROM public.smn_capacity_actual_snapshot WHERE period_id=$1"
].join(" ");
const trim=(v:number)=>Math.round((v+Number.EPSILON)*10000)/10000;
const fromToday=(today:string)=>new Date(Date.parse(today+"T00:00:00Z")-86400000)
 .toISOString().slice(0,10);
export function periodStatus(start:string,end:string,today:string,closed:boolean):PeriodStatus{
 if(closed)return "closed";
 if(start>today)return "upcoming";
 return end<today?"finished":"in-progress";
}
export function realThrough(end:string,today:string):string|null{
 const last=fromToday(today);
 return last<end?last:end;
}
export function parseActualChange(raw:unknown):Change|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(v.action!=="set"&&v.action!=="clear")return null;
 const keys=v.action==="set"?["action","start","end","revision","manualJh"]:
  ["action","start","end","revision"];
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k))||
  typeof v.start!=="string"||typeof v.end!=="string"||
  !parseCapacityPeriod(new URLSearchParams({start:v.start,end:v.end}))||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<0)
  return null;
 if(v.action==="set"&&(
  typeof v.manualJh!=="number"||!Number.isFinite(v.manualJh)||
  v.manualJh<0||v.manualJh>99999999.9999||
  Math.abs(Math.round(v.manualJh*10000)-v.manualJh*10000)>1e-6))
  return null;
 return {action:v.action,start:v.start,end:v.end,revision:v.revision,
  ...(v.action==="set"?{manualJh:v.manualJh as number}:{})};
}
export function parseClosing(raw:unknown):{start:string;end:string;eventId:string}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==3||typeof v.start!=="string"||
  typeof v.end!=="string"||typeof v.eventId!=="string"||
  !UUID.test(v.eventId)||!parseCapacityPeriod(new URLSearchParams({
   start:v.start,end:v.end
  })))return null;
 return {start:v.start,end:v.end,eventId:v.eventId.toLowerCase()};
}
const state=(input:{
 status:PeriodStatus;start:string;end:string;today:string;
 referenceJh:number|null;manualJh:number|null;revision:number;
 closedAt:string|null;closureEventId:string|null;
 initialJh:number|null;missingSources:CapacityMissing[];
}):ActualResult=>{
 const source:ActualSource=input.status==="upcoming"?"Non renseigné":
  input.manualJh!==null?"Saisie":input.referenceJh!==null?"Calcul":"Non renseigné";
 const retained=input.status==="upcoming"?null:
  input.manualJh!==null?input.manualJh:input.referenceJh;
 const observed=input.status==="upcoming"?null:
  input.status==="closed"?input.end:realThrough(input.end,input.today);
 const gap=(input.status==="finished"||input.status==="closed")&&
  input.initialJh!==null&&retained!==null?
  trim(retained-input.initialJh):null;
 return {status:input.status,start:input.start,end:input.end,asOfDate:input.today,
  observedThrough:observed,referenceJh:input.status==="upcoming"?null:input.referenceJh,
  manualJh:input.status==="upcoming"?null:input.manualJh,
  retainedJh:retained,source,revision:input.revision,closedAt:input.closedAt,
  closureEventId:input.closureEventId,initialJh:input.initialJh,
  gapJh:gap,missingSources:input.missingSources};
};
export async function readActualCapacity(db:Client,start:string,end:string,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true;includeExceptionalImpact?:boolean;teamId?:string})=>
  Promise<CapacityReport>=readDevelopmentCapacity,
 options:{externalTransaction?:boolean;teamId?:string}={}):Promise<ActualResult>{
 if(!parseCapacityPeriod(new URLSearchParams({start,end})))throw Error("actual-invalid-period");
 // Le dashboard possède déjà sa transaction cohérente et strictement READ ONLY.
 // Les appels historiques gardent leur transaction autonome par défaut.
 if(!options.externalTransaction)
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  // v28: teamId issu du résolveur Admin. Le lecteur sans contexte refuse v28.
  const teams=options.teamId?await db.query<ActorTeam>(
   "SELECT t.id FROM public.smn_team t JOIN public.smn_installation i "+
   "ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' "+
   "AND i.schema_version IN (28,29,30) AND t.id=$1 LIMIT 2",[options.teamId]):
   await db.query<ActorTeam>(teamSql);
  if(teams.rows.length!==1)throw Error("actual-team-unavailable");
  const teamId=teams.rows[0].id;
  const clock=await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today");
  const today=clock.rows[0]?.today;
  if(!today)throw Error("actual-clock-unavailable");
  const row=(await db.query<PeriodRow>(periodSql+" LIMIT 1",
   [teamId,start,end])).rows[0];
  const status=periodStatus(start,end,today,Boolean(row?.closed_at));
  const snapshot=row?.closed_at?
   (await db.query<ClosedRow>(closedSql,[row.id])).rows[0]:undefined;
  if(status==="closed"){
   // Closed without a frozen snapshot: never reconstruct history from later data.
   const initial=await readInitialSnapshot(db,teamId,start,end);
   const result=state({status,start,end,today,referenceJh:snapshot?.reference_jh??null,
    manualJh:snapshot?.provenance==="Saisie"?snapshot.retained_jh:null,
    revision:0,closedAt:row?.closed_at??null,
    closureEventId:snapshot?.event_id??null,initialJh:initial?.initialJh??null,
    missingSources:[]});
   // A closed snapshot marked "Non renseigné" must not be converted to a current calculation.
   if(!options.externalTransaction)await db.query("COMMIT");
   return result;
  }
  const manual=row?(await db.query<ManualRow>(manualSql,[row.id])).rows[0]:undefined;
  const initial=await readInitialSnapshot(db,teamId,start,end);
  let referenceJh:number|null=null;
  let missingSources:CapacityMissing[]=[];
  if(status!=="upcoming"){
   const last=realThrough(end,today);
   if(last!==null&&last>=start){
    const report=await calculate(db,start,last,{externalTransaction:true,includeExceptionalImpact:true,
     ...(options.teamId?{teamId:options.teamId}:{})});
    if(report.team.id!==teamId)throw Error("actual-team-changed");
    referenceJh=report.totalJh;
    missingSources=[...new Set(report.missing.map(m=>m.source))];
   }
  }
  const result=state({status,start,end,today,referenceJh,
   manualJh:manual?.manual_jh??null,revision:manual?.revision??0,
   closedAt:null,closureEventId:null,
   initialJh:initial?.initialJh??null,missingSources});
  if(!options.externalTransaction)await db.query("COMMIT");
  return result;
 }catch(error){if(!options.externalTransaction)await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function saveActualCapacity(db:Client,actorId:string,raw:unknown):
 Promise<ActualWriteResult>{
 const value=parseActualChange(raw);
 if(!actorId||!value)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const fail=async(error:"future-period"|"protected"|"conflict"|"nothing-to-clear"|"team-unavailable"):
   Promise<ActualWriteResult>=>{await db.query("ROLLBACK");return {ok:false,error};};
  const teams=await db.query<ActorTeam>(teamSql+" FOR UPDATE OF t");
  if(teams.rows.length!==1)return fail("team-unavailable");
  const today=(await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today")).rows[0]?.today;
  if(!today)throw Error("actual-clock-unavailable");
  if(value.start>today)return fail("future-period");
  const teamId=teams.rows[0].id;
  const period=(await db.query<PeriodRow>(periodSql+" FOR UPDATE",
   [teamId,value.start,value.end])).rows[0];
  if(period?.closed_at)return fail("protected");
  const old=period?(await db.query<ManualRow>(manualSql+" FOR UPDATE",[period.id])).rows[0]:undefined;
  if((old?.revision??0)!==value.revision)return fail("conflict");
  if(value.action==="clear"&&(!old||old.manual_jh===null))return fail("nothing-to-clear");
  let periodId=period?.id;
  if(!periodId){
   periodId=randomUUID();
   await db.query([
    "INSERT INTO public.smn_capacity_period_override",
    "(id,team_id,start_on,end_on,manual_jh,revision)",
    "VALUES($1,$2,$3::date,$4::date,NULL,1)"
   ].join(" "),[periodId,teamId,value.start,value.end]);
  }
  const nextJh=value.action==="set"?value.manualJh!:null;
  const actualId=old?.id??randomUUID(),revision=(old?.revision??0)+1;
  if(old){
   const updated=await db.query([
    "UPDATE public.smn_capacity_actual_override",
    "SET manual_jh=$2,revision=revision+1,updated_by=$3,updated_at=now()",
    "WHERE id=$1 AND revision=$4"
   ].join(" "),[actualId,nextJh,actorId,old.revision]);
   if(updated.rowCount!==1)return fail("conflict");
  }else{
   await db.query([
    "INSERT INTO public.smn_capacity_actual_override",
    "(id,period_id,manual_jh,revision,updated_by)",
    "VALUES($1,$2,$3,1,$4)"
   ].join(" "),[actualId,periodId,nextJh,actorId]);
  }
  await db.query([
   "INSERT INTO public.smn_capacity_actual_override_history",
   "(id,actual_id,revision,operation,before_jh,after_jh,changed_by)",
   "VALUES($1,$2,$3,$4,$5,$6,$7)"
  ].join(" "),[randomUUID(),actualId,revision,value.action,old?.manual_jh??null,nextJh,actorId]);
  await db.query("COMMIT");
  return {ok:true,revision};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function closeActualCapacity(db:Client,actorId:string,raw:unknown,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true;includeExceptionalImpact?:boolean})=>
  Promise<CapacityReport>=readDevelopmentCapacity):Promise<CloseResult>{
 const input=parseClosing(raw);
 if(!actorId||!input)return {ok:false,error:"invalid-input"};
 const {start,end,eventId}=input;
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
 try{
  const fail=async(error:"not-finished"|"conflict"|"team-unavailable"):Promise<CloseResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const teams=await db.query<ActorTeam>(teamSql+" FOR UPDATE OF t");
  if(teams.rows.length!==1)return fail("team-unavailable");
  const today=(await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today")).rows[0]?.today;
  if(!today)throw Error("actual-clock-unavailable");
  const teamId=teams.rows[0].id;
  const row=(await db.query<PeriodRow>(periodSql+" FOR UPDATE",
   [teamId,start,end])).rows[0];
  const saved=row?(await db.query<ClosedRow>(closedSql,[row.id])).rows[0]:undefined;
  if(saved){
   const initial=await readInitialSnapshot(db,teamId,start,end);
   const result=state({status:"closed",start,end,today,referenceJh:saved.reference_jh,
    manualJh:saved.provenance==="Saisie"?saved.retained_jh:null,
    revision:0,closedAt:saved.closed_at,closureEventId:saved.event_id,
    initialJh:initial?.initialJh??null,missingSources:[]});
   await db.query("COMMIT");
   return {ok:true,alreadyClosed:true,result};
  }
  if(row?.closed_at)return fail("conflict");
  if(end>=today)return fail("not-finished");
  const manual=row?(await db.query<ManualRow>(manualSql,[row.id])).rows[0]:undefined;
  const reference=await calculate(db,start,end,{externalTransaction:true,includeExceptionalImpact:true});
  if(reference.team.id!==teamId)throw Error("actual-team-changed");
  const manualJh=manual?.manual_jh??null;
  const referenceJh=reference.totalJh;
  const retained=manualJh!==null?manualJh:referenceJh;
  const provenance:ActualSource=manualJh!==null?"Saisie":
   referenceJh!==null?"Calcul":"Non renseigné";
  const periodId=row?.id??randomUUID();
  if(!row){
   await db.query([
    "INSERT INTO public.smn_capacity_period_override",
    "(id,team_id,start_on,end_on,manual_jh,revision,closed_at)",
    "VALUES($1,$2,$3::date,$4::date,NULL,1,now())"
   ].join(" "),[periodId,teamId,start,end]);
  }else{
   const closed=await db.query([
    "UPDATE public.smn_capacity_period_override SET closed_at=now()",
    "WHERE id=$1 AND closed_at IS NULL"
   ].join(" "),[periodId]);
   if(closed.rowCount!==1)return fail("conflict");
  }
  const snap=(await db.query<ClosedRow>([
   "INSERT INTO public.smn_capacity_actual_snapshot",
   "(id,period_id,event_id,retained_jh,reference_jh,provenance,closed_at,closed_by)",
   "VALUES($1,$2,$3,$4,$5,$6,now(),$7)",
   "RETURNING retained_jh::float8 AS retained_jh,reference_jh::float8 AS reference_jh,",
   "provenance,closed_at::text AS closed_at,event_id"
  ].join(" "),[randomUUID(),periodId,eventId,retained,referenceJh,provenance,actorId])).rows[0];
  if(!snap)throw Error("actual-closure-missing");
  const initial=await readInitialSnapshot(db,teamId,start,end);
  const result=state({status:"closed",start,end,today,referenceJh:snap.reference_jh,
   manualJh:provenance==="Saisie"?snap.retained_jh:null,
   revision:0,closedAt:snap.closed_at,closureEventId:snap.event_id,
   initialJh:initial?.initialJh??null,missingSources:[]});
  await db.query("COMMIT");
  return {ok:true,alreadyClosed:false,result};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505")return {ok:false,error:"conflict"};
  throw error;
 }
}
