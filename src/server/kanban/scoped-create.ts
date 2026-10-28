import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {requireScopedCycleSchema} from "@/server/teams/cycle-schema";
import {periodFromStart,normalizePeriodName} from "./dates";
import type {KanbanFrequency} from "./cadence";

type Request={teamId:string;startOn:string;name?:string;cadenceRevision:number};
const identifier=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const validStartOn=(value:string):boolean=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T00:00:00Z");
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
};
export function parseScopedKanbanCreate(raw:unknown):Request|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["teamId","startOn","name","cadenceRevision"].includes(k))||
  typeof v.teamId!=="string"||!identifier.test(v.teamId)||
  (typeof v.startOn!=="string"||!validStartOn(v.startOn))||typeof v.cadenceRevision!=="number"||
  !Number.isSafeInteger(v.cadenceRevision)||v.cadenceRevision<1||
  (v.name!==undefined&&typeof v.name!=="string"))return null;
 return v as Request;
}

/** staged; no HTTP route until the multi-team security review is complete. */
export async function createScopedKanbanPeriod(db:Client,actor:TeamActor,raw:unknown){
 const input=parseScopedKanbanCreate(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  await requireScopedCycleSchema(db,"kanban");
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.team_id!==input.teamId||team.mode!=="kanban")
   throw Error("kanban-team-unavailable");
  // Team row lock serializes archival with the entire creation transaction.
  const locked=await db.query<{id:string}>(`
   SELECT t.id FROM public.smn_team t
   JOIN public.smn_account a ON a.installation_id=t.installation_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE t.id=$1 AND a.id=$2 AND a.role='admin' AND a.is_active=true
    AND a.must_change_password=false AND i.schema_version IN (29,30)
    AND t.agile_mode='kanban' AND t.is_archived=false FOR UPDATE OF t`,
   [team.team_id,actor.accountId]);
  if(locked.rows.length!==1)throw Error("kanban-team-unavailable");
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[team.team_id+":kanban-period"]);
  const cadence=await db.query<{
   frequency:KanbanFrequency;time_zone:string;revision:number
  }>(`SELECT frequency,time_zone,revision FROM public.smn_kanban_cadence
      WHERE team_id=$1 FOR UPDATE`,[team.team_id]);
  const settings=cadence.rows[0];
  if(!settings)throw Error("kanban-cadence-unavailable");
  if(settings.revision!==input.cadenceRevision){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"stale-cadence" as const};
  }
  let dates:ReturnType<typeof periodFromStart>;
  try{dates=periodFromStart(input.startOn,settings.frequency);}
  catch{
   await db.query("ROLLBACK");
   return {ok:false as const,error:"invalid-start" as const};
  }
  const name=input.name===undefined?dates.name:normalizePeriodName(input.name);
  if(!name){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"invalid-name" as const};
  }
  const overlap=await db.query<{id:string}>(`
   SELECT id FROM public.smn_kanban_period
   WHERE team_id=$1 AND deleted_at IS NULL AND start_on<=$3::date
     AND end_on>=$2::date LIMIT 1`,[team.team_id,dates.startOn,dates.endOn]);
  if(overlap.rows.length){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"overlap" as const};
  }
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_kanban_period
   (id,team_id,name,start_on,end_on,time_zone,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [id,team.team_id,name,dates.startOn,dates.endOn,settings.time_zone,actor.accountId]);
  await db.query(`INSERT INTO public.smn_kanban_period_audit
   (id,period_id,action,details,actor_id)
   VALUES($1,$2,'created',$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify({...dates,name,cadenceRevision:settings.revision,
    teamId:team.team_id}),actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,period:{id,...dates,name,teamId:team.team_id}};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
