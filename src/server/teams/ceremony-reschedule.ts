import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "./resolve";

type Input={teamId:string;ceremonyId:string;revision:number;startAt:string;endAt:string};
const ID=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export function parseScopedCeremonyChange(x:unknown):Input|null{
 if(!x||typeof x!=="object"||Array.isArray(x))return null;
 const p=x as Record<string,unknown>;
 if(Object.keys(p).sort().join(",")!=="ceremonyId,endAt,revision,startAt,teamId"||
  typeof p.teamId!=="string"||!ID.test(p.teamId)||
  typeof p.ceremonyId!=="string"||!ID.test(p.ceremonyId)||
  !Number.isSafeInteger(p.revision)||Number(p.revision)<1||
  typeof p.startAt!=="string"||typeof p.endAt!=="string"||
  !UTC.test(p.startAt)||!UTC.test(p.endAt))return null;
 const start=Date.parse(p.startAt),end=Date.parse(p.endAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||
  new Date(start).toISOString()!==p.startAt||new Date(end).toISOString()!==p.endAt||
  (end-start)/60000>600||!Number.isSafeInteger((end-start)/60000))return null;
 return p as Input;
}
/** Écriture strictement contextualisée, sans DDL ni route historique. */
export async function rescheduleScopedCeremony(db:Client,actor:TeamActor,raw:unknown){
 const input=parseScopedCeremonyChange(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const reject=async(error:string)=>{await db.query("ROLLBACK");return {ok:false as const,error};};
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.mode!=="scrum")return reject("mode-mismatch");
  const result=await db.query<{revision:number;status:string;sprint_status:string;start_at:string;end_at:string;sprint_start:string;sprint_end:string;minutes:number}>(`
   SELECT c.revision,c.occurrence_status AS status,s.status AS sprint_status,
    c.starts_at::text AS start_at,c.ends_at::text AS end_at,
    s.start_at::text AS sprint_start,s.end_at::text AS sprint_end,c.minutes
   FROM public.smn_sprint_ceremony c
   JOIN public.smn_sprint s ON s.id=c.sprint_id
   WHERE c.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   FOR UPDATE OF c,s`,[input.ceremonyId,team.team_id]);
  if(result.rows.length!==1)return reject("not-found");
  const row=result.rows[0];
  if(row.sprint_status==="closed")return reject("closed-period");
  if(row.status==="cancelled")return reject("protected");
  if(Number(row.revision)!==input.revision)return reject("conflict");
  if(Date.parse(input.startAt)<Date.parse(row.sprint_start)||
     Date.parse(input.endAt)>Date.parse(row.sprint_end))return reject("outside-sprint");
  const before={startAt:new Date(row.start_at).toISOString(),endAt:new Date(row.end_at).toISOString()};
  if(before.startAt===input.startAt&&before.endAt===input.endAt){
   await db.query("COMMIT");return {ok:true as const,changed:false,revision:row.revision};
  }
  const minutes=(Date.parse(input.endAt)-Date.parse(input.startAt))/60000;
  const changed=await db.query(`
   UPDATE public.smn_sprint_ceremony
   SET starts_at=$2::timestamptz,ends_at=$3::timestamptz,
    minutes=$4,revision=revision+1,provenance='customized'
   WHERE id=$1 AND revision=$5 RETURNING id`,
   [input.ceremonyId,input.startAt,input.endAt,minutes,input.revision]);
  if(changed.rowCount!==1)return reject("conflict");
  await db.query("DELETE FROM public.smn_sprint_ceremony_segment WHERE ceremony_id=$1",[input.ceremonyId]);
  await db.query(`INSERT INTO public.smn_sprint_ceremony_segment
   (ceremony_id,position,starts_at,ends_at,minutes)
   VALUES($1,1,$2::timestamptz,$3::timestamptz,$4)`,
   [input.ceremonyId,input.startAt,input.endAt,minutes]);
  await db.query(`INSERT INTO public.smn_sprint_ceremony_history
   (id,ceremony_id,revision,previous_values,next_values,changed_by)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
   [randomUUID(),input.ceremonyId,input.revision+1,
    JSON.stringify({...before,minutes:row.minutes}),
    JSON.stringify({startAt:input.startAt,endAt:input.endAt,minutes}),actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,changed:true,revision:input.revision+1};
 }catch(e){
  await db.query("ROLLBACK").catch(()=>undefined);throw e;
 }
}
