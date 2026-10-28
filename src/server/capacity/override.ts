import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseCapacityPeriod,type CapacityReport} from "./engine";

const MAX_JH=99999999.9999;
export type OverrideRow={id:string;team_id:string;start_on:string;end_on:string;
 manual_jh:number|null;revision:number;frozen_at:string|null;closed_at:string|null;
 updated_at:string};
export type CapacitySelection={
 start:string;end:string;manualJh:number|null;referenceJh:number|null;
 retainedJh:number|null;source:"Saisie"|"Calcul"|"Non calculable";
 revision:number;frozen:boolean;closed:boolean;updatedAt:string|null;
};
type WriteAction={action:"set";start:string;end:string;revision:number;manualJh:number}|
 {action:"clear";start:string;end:string;revision:number};
type WriteError="invalid-input"|"conflict"|"protected"|"nothing-to-clear"|
 "team-unavailable";
export type WriteResult={ok:true;selection:CapacitySelection}|
 {ok:false;error:WriteError};

export function parseCapacityOverride(raw:unknown):
 {ok:true;value:WriteAction}|{ok:false;error:"invalid-input"}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(v.action!=="set"&&v.action!=="clear")return {ok:false,error:"invalid-input"};
 const expected=v.action==="set"?["action","start","end","revision","manualJh"]:
  ["action","start","end","revision"];
 if(Object.keys(v).length!==expected.length||
  Object.keys(v).some(k=>!expected.includes(k))||
  typeof v.start!=="string"||typeof v.end!=="string"||
  !parseCapacityPeriod(new URLSearchParams({start:v.start,end:v.end}))||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<0)
  return {ok:false,error:"invalid-input"};
 if(v.action==="clear")return {ok:true,value:{action:"clear",
  start:v.start,end:v.end,revision:v.revision}};
 // Zero is a legitimate explicit value; null, blank strings and NaN are rejected.
 if(typeof v.manualJh!=="number"||!Number.isFinite(v.manualJh)||
  v.manualJh<0||v.manualJh>MAX_JH||
  Math.abs(Math.round(v.manualJh*10000)-v.manualJh*10000)>1e-6)
  return {ok:false,error:"invalid-input"};
 return {ok:true,value:{action:"set",start:v.start,end:v.end,
  revision:v.revision,manualJh:v.manualJh}};
}
const rowSql=[
 "SELECT id,team_id,start_on::text AS start_on,end_on::text AS end_on,",
 "manual_jh::float8 AS manual_jh,revision,frozen_at::text AS frozen_at,",
 "closed_at::text AS closed_at,updated_at::text AS updated_at",
 "FROM public.smn_capacity_period_override"
].join(" ");
const teamSql=[
 "SELECT t.id FROM public.smn_team t JOIN public.smn_installation i",
 "ON i.id=t.installation_id WHERE i.id='singleton'",
 "AND i.state='initialized' AND i.schema_version<=27 AND i.mode IN ('scrum','kanban') LIMIT 2"
].join(" ");
function selection(start:string,end:string,referenceJh:number|null,row?:OverrideRow):
 CapacitySelection{
 const manualJh=row?.manual_jh??null;
 return {start,end,manualJh,referenceJh,
  retainedJh:manualJh!==null?manualJh:referenceJh,
  source:manualJh!==null?"Saisie":referenceJh!==null?"Calcul":"Non calculable",
  revision:row?.revision??0,frozen:Boolean(row?.frozen_at),
  closed:Boolean(row?.closed_at),updatedAt:row?.updated_at??null};
}
/** Stored manual values always have priority; calculated reference is never overwritten. */
export function chooseCapacity(report:Pick<CapacityReport,"start"|"end"|"totalJh">,
 row?:OverrideRow):CapacitySelection{
 return selection(report.start,report.end,report.totalJh,row);
}
export async function readCapacityOverride(db:Client,report:CapacityReport):
 Promise<CapacitySelection>{
 const r=await db.query<OverrideRow>(rowSql+
  " WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date LIMIT 1",
  [report.team.id,report.start,report.end]);
 return chooseCapacity(report,r.rows[0]);
}
/** Future freeze/close workflows must set frozen_at/closed_at in this same authoritative row. */
export async function saveCapacityOverride(db:Client,actorId:string,
 raw:unknown):Promise<WriteResult>{
 const parsed=parseCapacityOverride(raw);
 if(!parsed.ok)return parsed;
 if(!actorId)return {ok:false,error:"invalid-input"};
 const value=parsed.value;
 await db.query("BEGIN");
 try{
  const reject=async(error:WriteError):Promise<WriteResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const t=await db.query<{id:string}>(teamSql+" FOR UPDATE OF t");
  if(t.rows.length!==1)return reject("team-unavailable");
  const teamId=t.rows[0].id;
  const found=await db.query<OverrideRow>(rowSql+
   " WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date FOR UPDATE",
   [teamId,value.start,value.end]);
  const old=found.rows[0];
  // Protection check precedes revision checking so stale editors cannot bypass it.
  if(old?.frozen_at||old?.closed_at)return reject("protected");
  if((old?.revision??0)!==value.revision)return reject("conflict");
  if(value.action==="clear"&&old?.manual_jh===null)return reject("nothing-to-clear");
  if(value.action==="clear"&&!old)return reject("nothing-to-clear");
  const nextJh=value.action==="set"?value.manualJh:null;
  const nextRevision=(old?.revision??0)+1;
  const periodId=old?.id??randomUUID();
  if(!old){
   if(value.action!=="set")return reject("nothing-to-clear");
   await db.query([
    "INSERT INTO public.smn_capacity_period_override",
    "(id,team_id,start_on,end_on,manual_jh,revision,updated_by)",
    "VALUES($1,$2,$3::date,$4::date,$5,1,$6)"
   ].join(" "),[periodId,teamId,value.start,value.end,nextJh,actorId]);
  }else{
   const changed=await db.query([
    "UPDATE public.smn_capacity_period_override",
    "SET manual_jh=$2,revision=revision+1,updated_by=$3,updated_at=clock_timestamp()",
    "WHERE id=$1 AND revision=$4 AND frozen_at IS NULL AND closed_at IS NULL"
   ].join(" "),[periodId,nextJh,actorId,value.revision]);
   if(changed.rowCount!==1)return reject("conflict");
  }
  await db.query([
   "INSERT INTO public.smn_capacity_period_override_history",
   "(id,period_id,revision,operation,before_jh,after_jh,changed_by)",
   "VALUES($1,$2,$3,$4,$5,$6,$7)"
  ].join(" "),[randomUUID(),periodId,nextRevision,value.action,
   old?.manual_jh??null,nextJh,actorId]);
  const after=await db.query<OverrideRow>(rowSql+" WHERE id=$1",[periodId]);
  if(after.rows.length!==1)throw Error("capacity-override-write-inconsistent");
  await db.query("COMMIT");
  // The current calculated reference must be read separately, not cached into this row.
  return {ok:true,selection:selection(value.start,value.end,null,after.rows[0])};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
