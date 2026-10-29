import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type ScrumCadence={durationWeeks:number;startDay:number;startTime:string;endDay:number;endTime:string;timeZone:string;revision:number;updatedAt:string};
type Row={duration_weeks:number;start_day:number;start_time:string;end_day:number;end_time:string;time_zone:string;revision:number;updated_at:string};
const query=`SELECT duration_weeks,start_day,start_time,end_day,end_time,time_zone,revision,updated_at::text AS updated_at
 FROM public.smn_scrum_cadence WHERE team_id=$1`;
const map=(r:Row):ScrumCadence=>({durationWeeks:r.duration_weeks,startDay:r.start_day,startTime:r.start_time.slice(0,5),endDay:r.end_day,endTime:r.end_time.slice(0,5),timeZone:r.time_zone,revision:r.revision,updatedAt:r.updated_at});
const validTime=(v:unknown):v is string=>typeof v==="string"&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
const validZone=(v:unknown):v is string=>{
 if(typeof v!=="string"||v.length>100||!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(v))return false;
 try{new Intl.DateTimeFormat("en",{timeZone:v});return true;}catch{return false;}
};
export function parseCadence(raw:unknown):Omit<ScrumCadence,"revision"|"updatedAt"> & {revision:number}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 const keys=["durationWeeks","startDay","startTime","endDay","endTime","timeZone","revision"];
 if(Object.keys(o).length!==keys.length||Object.keys(o).some(k=>!keys.includes(k)))return null;
 if(!Number.isInteger(o.durationWeeks)||!(o.durationWeeks as number>=1&&o.durationWeeks as number<=4)||
 !Number.isInteger(o.startDay)||!(o.startDay as number>=1&&o.startDay as number<=7)||
 !Number.isInteger(o.endDay)||!(o.endDay as number>=1&&o.endDay as number<=7)||
 !validTime(o.startTime)||!validTime(o.endTime)||!validZone(o.timeZone)||
 !Number.isSafeInteger(o.revision)||!(o.revision as number>=1))return null;
 if((o.endDay as number)<(o.startDay as number)||((o.endDay as number)===(o.startDay as number)&&(o.endTime as string)<=(o.startTime as string)))return null;
 return o as ReturnType<typeof parseCadence> & object;
}
export async function ensureCadenceTable(db:Client){
 const names=["smn_scrum_cadence","smn_scrum_cadence_audit"] as const;
 const found=await db.query<{present:string[]}>(`SELECT array_agg(relname)::text[] AS present FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[names]);
 if(names.some(name=>!found.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
async function teamId(db:Client,actor?:{accountId:string;role:"admin"|"user"},requestedTeamId?:string|null):Promise<string>{
 const installation=await db.query<{schema_version:number}>(`SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
 const version=installation.rows[0]?.schema_version;
 if(evaluateSchemaCapability(version,"multi-team").ok){
  if(!actor)throw Error("team-access-forbidden");
  const team=await resolveAdminTeam(db,actor,requestedTeamId);
  if(team.mode!=="scrum")throw Error("scrum-team-unavailable");
  return team.team_id;
 }
 if(version===undefined||version>27)throw Error("team-schema-unavailable");
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1)throw Error("scrum-team-unavailable");
 return r.rows[0].id;
}
export async function readCadence(db:Client,actor?:{accountId:string;role:"admin"|"user"},requestedTeamId?:string|null):Promise<ScrumCadence>{
 const id=await teamId(db,actor,requestedTeamId);
 const r=await db.query<Row>(query,[id]);
 if(r.rows.length!==1)throw Error("cadence-unavailable");
 return map(r.rows[0]);
}
export async function updateCadence(db:Client,actorId:string,raw:unknown,requestedTeamId?:string|null){
 const input=parseCadence(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await ensureCadenceTable(db);
 const id=await teamId(db,{accountId:actorId,role:"admin"},requestedTeamId);
 await db.query("BEGIN");
 try{
  await db.query(`INSERT INTO public.smn_scrum_cadence(team_id) VALUES($1) ON CONFLICT DO NOTHING`,[id]);
  const r=await db.query<Row>(query+" FOR UPDATE",[id]);
  if(r.rows.length!==1)throw Error("cadence-unavailable");
  const previous=map(r.rows[0]);
  if(previous.revision!==input.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  const fields=["durationWeeks","startDay","startTime","endDay","endTime","timeZone"] as const;
  if(fields.every(k=>previous[k]===input[k])){await db.query("COMMIT");return {ok:true as const,cadence:previous,changed:false};}
  const changed=await db.query<Row>(`UPDATE public.smn_scrum_cadence SET
   duration_weeks=$2,start_day=$3,start_time=$4,end_day=$5,end_time=$6,time_zone=$7,
   revision=revision+1,updated_at=now(),updated_by=$8 WHERE team_id=$1
   RETURNING duration_weeks,start_day,start_time,end_day,end_time,time_zone,revision,updated_at::text AS updated_at`,
   [id,input.durationWeeks,input.startDay,input.startTime,input.endDay,input.endTime,input.timeZone,actorId]);
  const next=map(changed.rows[0]);
  await db.query(`INSERT INTO public.smn_scrum_cadence_audit
   (id,team_id,revision,before_values,after_values,changed_by)
   VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
   [randomUUID(),id,next.revision,JSON.stringify(previous),JSON.stringify(next),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,cadence:next,changed:true};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
