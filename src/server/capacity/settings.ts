import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {validHoursPerJh} from "./engine";

export type CapacitySettings={hoursPerJh:number;revision:number;updatedAt:string};
export type SettingsResult={ok:true;settings:CapacitySettings}|
 {ok:false;error:"invalid-input"|"conflict"};
const select="SELECT hours_per_jh::float8 AS hours_per_jh,revision,updated_at::text AS updated_at "+
 "FROM public.smn_capacity_settings WHERE installation_id='singleton'";
type Row={hours_per_jh:number;revision:number;updated_at:string};
const project=(r:Row):CapacitySettings=>({
 hoursPerJh:r.hours_per_jh,revision:r.revision,updatedAt:r.updated_at
});
export async function readCapacitySettings(db:Client):Promise<CapacitySettings>{
 const r=await db.query<Row>(select);
 if(r.rows.length!==1||!validHoursPerJh(r.rows[0].hours_per_jh))
  throw Error("capacity-settings-unavailable");
 return project(r.rows[0]);
}
export async function updateCapacitySettings(db:Client,actorId:string,raw:unknown):
 Promise<SettingsResult>{
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||!actorId)
  return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==2||!validHoursPerJh(v.hoursPerJh)||
  !Number.isSafeInteger(v.revision)||typeof v.revision!=="number"||v.revision<1)
  return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const current=await db.query<Row>(select+" FOR UPDATE");
  if(current.rows.length!==1)throw Error("capacity-settings-unavailable");
  if(current.rows[0].revision!==v.revision){
   await db.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  const next=await db.query<Row>([
   "UPDATE public.smn_capacity_settings",
   "SET hours_per_jh=$1,revision=revision+1,updated_by=$2,updated_at=now()",
   "WHERE installation_id='singleton' AND revision=$3",
   "RETURNING hours_per_jh::float8 AS hours_per_jh,revision,updated_at::text AS updated_at"
  ].join(" "),[v.hoursPerJh,actorId,v.revision]);
  if(next.rows.length!==1){
   await db.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  await db.query([
   "INSERT INTO public.smn_capacity_settings_audit",
   "(id,installation_id,revision,previous_hours,new_hours,changed_by)",
   "VALUES($1,'singleton',$2,$3,$4,$5)"
  ].join(" "),[randomUUID(),next.rows[0].revision,current.rows[0].hours_per_jh,
   next.rows[0].hours_per_jh,actorId]);
  await db.query("COMMIT");
  return {ok:true,settings:project(next.rows[0])};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
