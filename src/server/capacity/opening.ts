import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseCapacityPeriod,readDevelopmentCapacity,type CapacityReport} from "./engine";

const EVENT_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
type InitialRow={
 id:string;period_id:string;event_id:string;initial_jh:number|null;
 provenance:"Saisie"|"Calcul"|"Non renseigné";
 actual_opened_at:string;recorded_at:string;manual_revision:number|null;
};
type Team={id:string};
export type InitialSnapshot={
 id:string;eventId:string;initialJh:number|null;
 provenance:"Saisie"|"Calcul"|"Non renseigné";
 actualOpenedAt:string;recordedAt:string;manualRevision:number|null;
};
export type OpeningResult={ok:true;snapshot:InitialSnapshot;alreadyOpened:boolean}|
 {ok:false;error:"invalid-input"|"team-unavailable"|"conflict"};
const rowFields=[
 "SELECT s.id,s.period_id,s.event_id,s.initial_jh::float8 AS initial_jh,",
 "s.provenance,s.actual_opened_at::text AS actual_opened_at,",
 "s.recorded_at::text AS recorded_at,s.manual_revision",
 "FROM public.smn_capacity_initial_snapshot s"
].join(" ");
const teamSql=[
 "SELECT t.id FROM public.smn_team t JOIN public.smn_installation i",
 "ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized'",
 "AND i.schema_version<=27 AND i.mode IN ('scrum','kanban') LIMIT 2"
].join(" ");
const present=(r:InitialRow):InitialSnapshot=>({
 id:r.id,eventId:r.event_id,initialJh:r.initial_jh,
 provenance:r.provenance,actualOpenedAt:r.actual_opened_at,
 recordedAt:r.recorded_at,manualRevision:r.manual_revision
});
export function parseOpening(raw:unknown):{start:string;end:string;eventId:string}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==3||typeof v.start!=="string"||
  typeof v.end!=="string"||typeof v.eventId!=="string"||
  !EVENT_ID.test(v.eventId)||!parseCapacityPeriod(new URLSearchParams({
   start:v.start,end:v.end
  })))return null;
 return {start:v.start,end:v.end,eventId:v.eventId.toLowerCase()};
}
/** Read-only lookup. Merely consulting a theoretical date NEVER inserts a snapshot. */
export async function readInitialSnapshot(db:Client,teamId:string,start:string,end:string):
 Promise<InitialSnapshot|null>{
 const result=await db.query<InitialRow>(rowFields+" "+[
  "JOIN public.smn_capacity_period_override p ON p.id=s.period_id",
  "WHERE p.team_id=$1 AND p.start_on=$2::date AND p.end_on=$3::date",
  "LIMIT 1"
 ].join(" "),[teamId,start,end]);
 return result.rows[0]?present(result.rows[0]):null;
}
/**
 * Business operation: first genuine opening ONLY.
 * One repeatable-read snapshot, guarded by a team row lock and a UNIQUE period.
 * No reconstruction using post-opening facts on retries or retroactive periods.
 */
export async function openCapacityPeriod(db:Client,actorId:string,raw:unknown,
 calculate:(db:Client,start:string,end:string,options:{externalTransaction:true})=>
  Promise<CapacityReport>=readDevelopmentCapacity):Promise<OpeningResult>{
 const parsed=parseOpening(raw);
 if(!actorId||!parsed)return {ok:false,error:"invalid-input"};
 const {start,end,eventId}=parsed;
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
 try{
  const reject=async(error:"team-unavailable"|"conflict"):Promise<OpeningResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const teams=await db.query<Team>(teamSql+" FOR UPDATE OF t");
  if(teams.rows.length!==1)return reject("team-unavailable");
  const teamId=teams.rows[0].id;
  const period=await db.query<{
   id:string;manual_jh:number|null;revision:number;
   frozen_at:string|null;closed_at:string|null
  }>([
   "SELECT id,manual_jh::float8 AS manual_jh,revision,",
   "frozen_at::text AS frozen_at,closed_at::text AS closed_at",
   "FROM public.smn_capacity_period_override",
   "WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date FOR UPDATE"
  ].join(" "),[teamId,start,end]);
  const previous=period.rows[0]??null;
  // Check BEFORE any recalculation: a replay must never see new absences.
  if(previous){
   const existing=await db.query<InitialRow>(rowFields+
    " WHERE s.period_id=$1 LIMIT 1",[previous.id]);
   if(existing.rows[0]){
    await db.query("COMMIT");
    return {ok:true,snapshot:present(existing.rows[0]),alreadyOpened:true};
   }
   // A frozen/closed period without the initial evidence cannot be reconstructed.
   if(previous.frozen_at||previous.closed_at)return reject("conflict");
  }
  const clock=await db.query<{today:string}>([
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today"
  ].join(" "));
  const today=clock.rows[0]?.today;
  if(!today)throw Error("initial-opening-clock-unavailable");
  const retrospective=end<today;
  let initialJh:number|null=null;
  let provenance:InitialSnapshot["provenance"]="Non renseigné";
  if(!retrospective){
   if(previous?.manual_jh!==null&&previous?.manual_jh!==undefined){
    initialJh=previous.manual_jh;provenance="Saisie";
   }else{
    const reference=await calculate(db,start,end,{externalTransaction:true});
    if(reference.team.id!==teamId)throw Error("initial-opening-team-changed");
    if(reference.totalJh!==null){
     initialJh=reference.totalJh;provenance="Calcul";
    }
   }
  }
  const periodId=previous?.id??randomUUID();
  if(!previous){
   await db.query([
    "INSERT INTO public.smn_capacity_period_override",
    "(id,team_id,start_on,end_on,manual_jh,revision,frozen_at,updated_by)",
    "VALUES($1,$2,$3::date,$4::date,NULL,1,now(),$5)"
   ].join(" "),[periodId,teamId,start,end,actorId]);
  }else{
   const updated=await db.query([
    "UPDATE public.smn_capacity_period_override SET frozen_at=now()",
    "WHERE id=$1 AND frozen_at IS NULL AND closed_at IS NULL"
   ].join(" "),[periodId]);
   if(updated.rowCount!==1)return reject("conflict");
  }
  const stored=await db.query<InitialRow>([
   "INSERT INTO public.smn_capacity_initial_snapshot",
   "(id,period_id,event_id,initial_jh,provenance,actual_opened_at,opened_by,manual_revision)",
   "VALUES($1,$2,$3,$4,$5,now(),$6,$7)",
   "RETURNING id,period_id,event_id,initial_jh::float8 AS initial_jh,",
   "provenance,actual_opened_at::text AS actual_opened_at,",
   "recorded_at::text AS recorded_at,manual_revision"
  ].join(" "),[
   randomUUID(),periodId,eventId,initialJh,provenance,actorId,
   previous?.manual_jh!==null&&previous?.manual_jh!==undefined?previous.revision:null
  ]);
  if(stored.rows.length!==1)throw Error("initial-opening-insert-failed");
  await db.query("COMMIT");
  return {ok:true,snapshot:present(stored.rows[0]),alreadyOpened:false};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  // A reused eventId for a different period is a conflict, never a new opening.
  if((error as {code?:string})?.code==="23505")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
