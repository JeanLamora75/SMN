import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "./resolve";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Input={teamId:string;ceremonyId:string;revision:number;status:"held"|"not_held"|"cancelled";reason:string;actualMinutes:number};
export function parseScopedCeremonyAttendance(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="actualMinutes,ceremonyId,reason,revision,status,teamId"||
  typeof v.teamId!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v.teamId)||
  typeof v.ceremonyId!=="string"||!UUID.test(v.ceremonyId)||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<1||
  !["held","not_held","cancelled"].includes(String(v.status))||
  typeof v.reason!=="string"||v.reason.length>1000||
  !Number.isSafeInteger(v.actualMinutes)||Number(v.actualMinutes)<0||Number(v.actualMinutes)>1440)return null;
 return v as Input;
}
/** Mise à jour atomique, sans création de structure et limitée au sprint autorisé. */
export async function recordScopedCeremonyAttendance(db:Client,actor:TeamActor,raw:unknown){
 const input=parseScopedCeremonyAttendance(raw);
 if(!input)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const reject=async(error:string)=>{await db.query("ROLLBACK");return {ok:false as const,error};};
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.mode!=="scrum")return reject("mode-mismatch");
  const storage=await db.query<{available:boolean}>(`
   SELECT to_regclass('public.smn_sprint_ceremony_status_history') IS NOT NULL
    AND to_regclass('public.smn_meeting_actual_duration_audit') IS NOT NULL AS available`);
  if(storage.rows[0]?.available!==true)return reject("storage-unavailable");
  const found=await db.query<{revision:number;status:string;end_at:string;sprint_status:string;minutes:number;actual_minutes:number|null}>(`
   SELECT c.revision,c.occurrence_status AS status,c.ends_at::text AS end_at,
    s.status AS sprint_status,c.minutes,c.actual_minutes
   FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
   WHERE c.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   FOR UPDATE OF c,s`,[input.ceremonyId,team.team_id]);
  if(found.rows.length!==1)return reject("not-found");
  const previous=found.rows[0];
  if(previous.sprint_status==="closed")return reject("closed-period");
  if(previous.status==="cancelled")return reject("protected");
  if(Number(previous.revision)!==input.revision)return reject("conflict");
  if(input.status!=="cancelled"&&Date.parse(previous.end_at)>Date.now())return reject("not-yet-due");
  const updated=await db.query(`
   UPDATE public.smn_sprint_ceremony
   SET occurrence_status=$2,status_explicit=true,actual_minutes=$3,revision=revision+1
   WHERE id=$1 AND revision=$4 RETURNING id`,
   [input.ceremonyId,input.status,input.actualMinutes,input.revision]);
  if(updated.rowCount!==1)return reject("conflict");
  await db.query(`INSERT INTO public.smn_sprint_ceremony_status_history
   (id,ceremony_id,previous_status,next_status,reason,actor_id)
   VALUES($1,$2,$3,$4,$5,$6)`,[
    randomUUID(),input.ceremonyId,previous.status,input.status,input.reason,actor.accountId]);
  await db.query(`INSERT INTO public.smn_meeting_actual_duration_audit
   (id,kind,event_id,previous_minutes,new_minutes,planned_minutes,actor_id)
   VALUES($1,'standard',$2,$3,$4,$5,$6)`,[
    randomUUID(),input.ceremonyId,previous.actual_minutes,input.actualMinutes,previous.minutes,actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,revision:input.revision+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
