import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {requireScopedCycleSchema} from "@/server/teams/cycle-schema";
import {calculateSprint} from "./creation";
import {saveGeneratedCeremonies} from "./ceremonies";

type Request={teamId:string;startOn:string;name?:string;cadenceRevision:number};
type Cadence={duration_weeks:number;start_day:number;start_time:string;end_day:number;end_time:string;time_zone:string;revision:number};
const identifier=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const validStartOn=(value:string):boolean=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T00:00:00Z");
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
};
export function parseScopedSprintCreate(raw:unknown):Request|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).some(k=>!["teamId","startOn","name","cadenceRevision"].includes(k))||
 typeof value.teamId!=="string"||!identifier.test(value.teamId)||
 (typeof value.startOn!=="string"||!validStartOn(value.startOn))||
 typeof value.cadenceRevision!=="number"||!Number.isSafeInteger(value.cadenceRevision)||
 value.cadenceRevision<1||
 (value.name!==undefined&&(typeof value.name!=="string"||!value.name.trim()||value.name.trim().length>160)))
 return null;
 return value as Request;
}
const sprintName=(startOn:string,endOn:string)=>
 `Sprint du ${startOn.slice(8,10)}/${startOn.slice(5,7)}/${startOn.slice(0,4)} au ${endOn.slice(8,10)}/${endOn.slice(5,7)}/${endOn.slice(0,4)}`;

/** staged service with schema validation. No HTTP exposure before the cross-team authorization review. */
export async function createScopedSprint(db:Client,actor:TeamActor,raw:unknown){
 const input=parseScopedSprintCreate(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  await requireScopedCycleSchema(db,"scrum");
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.team_id!==input.teamId||team.mode!=="scrum")throw Error("scrum-team-unavailable");
  const locked=await db.query<{id:string}>(`
   SELECT t.id FROM public.smn_team t
   JOIN public.smn_account a ON a.installation_id=t.installation_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE t.id=$1 AND a.id=$2 AND a.role='admin' AND a.is_active=true
    AND a.must_change_password=false AND i.schema_version IN (29,30)
    AND t.agile_mode='scrum' AND t.is_archived=false FOR UPDATE OF t`,
   [team.team_id,actor.accountId]);
  if(locked.rows.length!==1)throw Error("scrum-team-unavailable");
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[team.team_id]);
  const cadence=await db.query<Cadence>(`
   SELECT duration_weeks,start_day,start_time::text,end_day,end_time::text,time_zone,revision
   FROM public.smn_scrum_cadence WHERE team_id=$1 FOR UPDATE`,[team.team_id]);
  const settings=cadence.rows[0];
  if(!settings)throw Error("cadence-unavailable");
  if(settings.revision!==input.cadenceRevision){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"stale-cadence" as const};
  }
  let dates:ReturnType<typeof calculateSprint>;
  try{dates=calculateSprint(input.startOn,settings);}
  catch{
   await db.query("ROLLBACK");
   return {ok:false as const,error:"invalid-start" as const};
  }
  const overlaps=await db.query<{id:string}>(`
   SELECT id FROM public.smn_sprint
   WHERE team_id=$1 AND deleted_at IS NULL AND start_at<$3::timestamptz
     AND end_at>$2::timestamptz LIMIT 1`,[team.team_id,dates.startAt,dates.endAt]);
  if(overlaps.rows.length){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"overlap" as const};
  }
  // Preserve historical numbering even for logically deleted sprints.
  const numbering=await db.query<{next_number:number}>(`
   SELECT (COALESCE(MAX(number),0)+1)::integer AS next_number
   FROM public.smn_sprint WHERE team_id=$1`,[team.team_id]);
  const number=numbering.rows[0]?.next_number;
  if(!Number.isSafeInteger(number)||!number||number<1)throw Error("sprint-number-unavailable");
  const name=input.name?.trim()??sprintName(dates.startOn,dates.endOn);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_sprint
   (id,team_id,number,name,start_at,end_at,time_zone,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
   [id,team.team_id,number,name,dates.startAt,dates.endAt,dates.timeZone,actor.accountId]);
  await db.query(`INSERT INTO public.smn_sprint_audit
   (id,sprint_id,action,actor_id,details)
   VALUES($1,$2,'created',$3,$4::jsonb)`,
   [randomUUID(),id,actor.accountId,JSON.stringify({...dates,name,number,teamId:team.team_id,
    cadenceRevision:settings.revision})]);
  const ceremonies=await saveGeneratedCeremonies(db,{
   id,startAt:dates.startAt,endAt:dates.endAt,timeZone:dates.timeZone
  },settings.duration_weeks);
  await db.query("COMMIT");
  return {ok:true as const,sprint:{id,number,name,...dates,teamId:team.team_id},ceremonies};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
