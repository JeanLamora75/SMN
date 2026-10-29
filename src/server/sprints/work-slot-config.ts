import type {Client} from "pg";
import {validWorkSlots,readWorkSlots} from "@/server/capacity/work-slots";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";
export async function getTeamSlots(db:Client,actor?:{accountId:string;role:"admin"|"user"},requestedTeamId?:string|null){
 const installation=await db.query<{schema_version:number}>(`SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
 const version=installation.rows[0]?.schema_version;
 if(evaluateSchemaCapability(version,"multi-team").ok){
  if(!actor)throw Error("team-access-forbidden");
  const team=await resolveAdminTeam(db,actor,requestedTeamId);
  if(team.mode!=="scrum")throw Error("scrum-team-unavailable");
  return {teamId:team.team_id,current:await readWorkSlots(db,team.team_id)};
 }
 if(version===undefined||version>27)throw Error("team-schema-unavailable");
 const x=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(x.rows.length!==1)throw Error("team-unavailable");
 const teamId=x.rows[0].id;
 const current=await readWorkSlots(db,teamId);
 return {teamId,current};
}
export async function saveTeamSlots(db:Client,actorId:string,input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const x=input as Record<string,unknown>;
 const {revision,timeZone,teamId:requestedTeamId,...slots}=x;
 if(requestedTeamId!==undefined&&typeof requestedTeamId!=="string")return {ok:false as const,error:"invalid-input"};
 if(!["afternoonEnd,afternoonStart,morningEnd,morningStart,revision,timeZone","afternoonEnd,afternoonStart,morningEnd,morningStart,revision,teamId,timeZone"].includes(Object.keys(x).sort().join(","))||
 !validWorkSlots(slots)||typeof timeZone!=="string"||timeZone.length>80||
 !Number.isSafeInteger(revision)||Number(revision)<0)return {ok:false as const,error:"invalid-input"};
 try{new Intl.DateTimeFormat("en",{timeZone});}catch{return {ok:false as const,error:"invalid-zone"};}
 await db.query("BEGIN");
 try{
  const {teamId}=await getTeamSlots(db,{accountId:actorId,role:"admin"},requestedTeamId as string|undefined);
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
