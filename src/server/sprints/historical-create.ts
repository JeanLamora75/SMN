import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
import {saveGeneratedCeremonies} from "./ceremonies";
import {ensureTemplateOccurrenceSchema} from "./template-occurrences";
const UUID=/^[a-f0-9-]{36}$/i;
export type HistoricalSprintInput={name:string;startAt:string;endAt:string;generateCeremonies:boolean;operationId:string};
export function parseHistoricalSprint(raw:unknown):HistoricalSprintInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="endAt,generateCeremonies,name,operationId,startAt"||
 typeof v.generateCeremonies!=="boolean"||typeof v.operationId!=="string"||!UUID.test(v.operationId)||
 typeof v.name!=="string"||!v.name.trim()||v.name.trim().length>160||
 typeof v.startAt!=="string"||typeof v.endAt!=="string"||
 !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.startAt)||
 !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.endAt)||
 !Number.isFinite(Date.parse(v.startAt))||!Number.isFinite(Date.parse(v.endAt))||
 Date.parse(v.endAt)<=Date.parse(v.startAt))return null;
 return {name:v.name.trim(),startAt:v.startAt,endAt:v.endAt,generateCeremonies:v.generateCeremonies,operationId:v.operationId};
}
export async function createHistoricalSprint(db:Client,actorId:string,raw:unknown){
 const value=parseHistoricalSprint(raw);
 if(!actorId||!value)return {ok:false as const,error:"invalid-input"};
 await ensureSprintSchema(db);
 await db.query("SELECT to_regclass('public.smn_sprint_historical_request') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("BEGIN");
 try{
  const team=await db.query<{id:string;time_zone:string}>(`
   SELECT t.id,c.time_zone FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   JOIN public.smn_scrum_cadence c ON c.team_id=t.id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
  if(team.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"team-unavailable"};}
  const t=team.rows[0];
  // Share the same team creation lock used by normal Sprint generation.
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[t.id]);
  const previous=await db.query<{actor_id:string;request_json:HistoricalSprintInput;sprint_id:string}>(`
   SELECT actor_id,request_json,sprint_id FROM public.smn_sprint_historical_request WHERE operation_id=$1`,[value.operationId]);
  if(previous.rows[0]){
   const old=previous.rows[0];
   if(old.actor_id!==actorId||JSON.stringify(old.request_json)!==JSON.stringify(value)){
    await db.query("ROLLBACK");return {ok:false as const,error:"operation-conflict"};
   }
   await db.query("COMMIT");return {ok:true as const,reused:true,sprint:{id:old.sprint_id}};
  }
  const clock=await db.query<{is_past:boolean}>(`SELECT $1::timestamptz < now() AS is_past`,[value.endAt]);
  if(clock.rows[0]?.is_past!==true){await db.query("ROLLBACK");return {ok:false as const,error:"not-finished"};}
  const conflicts=await db.query<{id:string;name:string;start_at:string;end_at:string}>(`
   SELECT id,name,start_at::text,end_at::text FROM public.smn_sprint
   WHERE team_id=$1 AND deleted_at IS NULL
   AND start_at<$3::timestamptz AND end_at>$2::timestamptz
   ORDER BY start_at,id LIMIT 10`,[t.id,value.startAt,value.endAt]);
  if(conflicts.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"overlap",conflicts:conflicts.rows};}
  const number=await db.query<{next_number:number}>(`SELECT (COALESCE(MAX(number),0)+1)::int AS next_number FROM public.smn_sprint WHERE team_id=$1`,[t.id]);
  const next=number.rows[0]?.next_number;
  if(!next){await db.query("ROLLBACK");return {ok:false as const,error:"number-unavailable"};}
  const id=randomUUID();
  const saved=await db.query<{created_at:string}>(`
   INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,'finished',$8) RETURNING created_at::text`,
   [id,t.id,next,value.name,value.startAt,value.endAt,t.time_zone,actorId]);
  let generated=0;
  let templateConfiguration:unknown[]=[];
  if(value.generateCeremonies){
   await ensureTemplateOccurrenceSchema(db);
   const templates=await db.query(`SELECT id,name,revision,frequency,weekday,position,local_time::text AS local_time,
    duration_minutes FROM public.smn_scrum_ceremony_template
    WHERE team_id=$1 AND active=true ORDER BY id`,[t.id]);
   templateConfiguration=templates.rows;
   generated=await saveGeneratedCeremonies(db,{id,startAt:value.startAt,endAt:value.endAt,timeZone:t.time_zone},1,{reconstructed:true});
  }
  await db.query(`INSERT INTO public.smn_sprint_historical_request(operation_id,actor_id,request_json,sprint_id)
   VALUES($1,$2,$3::jsonb,$4)`,[value.operationId,actorId,JSON.stringify(value),id]);
  await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
   VALUES($1,$2,'historical-created',$3,$4::jsonb)`,
   [randomUUID(),id,actorId,JSON.stringify({...value,number:next,historical:true,recordedAt:saved.rows[0].created_at,ceremonies:value.generateCeremonies?"reconstructed-from-current-configuration":"not-reconstructed",generated,templateConfiguration,configurationSource:"currently-recorded-not-historically-attested"})]);
  await db.query("COMMIT");
  return {ok:true as const,sprint:{id,number:next,...value,status:"finished" as const,historical:true,recordedAt:saved.rows[0].created_at},generated};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
