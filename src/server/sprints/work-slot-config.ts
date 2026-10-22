import type {Client} from "pg";
import {validWorkSlots,readWorkSlots} from "@/server/capacity/work-slots";
export async function getTeamSlots(db:Client){
 const x=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(x.rows.length!==1)throw Error("team-unavailable");
 const teamId=x.rows[0].id;
 const current=await readWorkSlots(db,teamId);
 return {teamId,current};
}
export async function saveTeamSlots(db:Client,actorId:string,input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const x=input as Record<string,unknown>;
 const {revision,timeZone,...slots}=x;
 if(Object.keys(x).sort().join(",")!=="afternoonEnd,afternoonStart,morningEnd,morningStart,revision,timeZone"||
 !validWorkSlots(slots)||typeof timeZone!=="string"||timeZone.length>80||
 !Number.isSafeInteger(revision)||Number(revision)<0)return {ok:false as const,error:"invalid-input"};
 try{new Intl.DateTimeFormat("en",{timeZone});}catch{return {ok:false as const,error:"invalid-zone"};}
 await db.query("BEGIN");
 try{
  const {teamId}=await getTeamSlots(db);
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId]);
  const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_team_work_slots WHERE team_id=$1 FOR UPDATE`,[teamId]);
  if((old.rows[0]?.revision??0)!==revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  await db.query(`INSERT INTO public.smn_team_work_slots(team_id,time_zone,morning_start,morning_end,afternoon_start,afternoon_end,configured_by)
   VALUES($1,$2,$3::time,$4::time,$5::time,$6::time,$7)
   ON CONFLICT(team_id) DO UPDATE SET time_zone=EXCLUDED.time_zone,morning_start=EXCLUDED.morning_start,
   morning_end=EXCLUDED.morning_end,afternoon_start=EXCLUDED.afternoon_start,
   afternoon_end=EXCLUDED.afternoon_end,configured_by=EXCLUDED.configured_by,
   configured_at=now(),revision=public.smn_team_work_slots.revision+1`,[teamId,timeZone,slots.morningStart,slots.morningEnd,slots.afternoonStart,slots.afternoonEnd,actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
