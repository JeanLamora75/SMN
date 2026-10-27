import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export type TeamMeetingInput=Readonly<{
 teamId:string;kind:"scrum"|"kanban";cycleId:string;name:string;
 startAt:string;duration:number;
}>;
type ErrorCode="invalid-input"|"not-found"|"closed-period"|
 "outside-period"|"storage-unavailable"|"conflict"|"mode-mismatch";
export type TeamMeetingResult=
 Readonly<{ok:true;id:string;teamId:string;kind:"scrum"|"kanban"}>|
 Readonly<{ok:false;error:ErrorCode}>;

export function parseTeamMeeting(raw:unknown):TeamMeetingInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="cycleId,duration,kind,name,startAt,teamId"||
   typeof v.teamId!=="string"||!ID.test(v.teamId)||
   typeof v.cycleId!=="string"||!ID.test(v.cycleId)||
   (v.kind!=="scrum"&&v.kind!=="kanban")||
   typeof v.name!=="string"||v.name.trim().length<1||
   v.name.trim().length>160||
   typeof v.startAt!=="string"||!UTC.test(v.startAt)||
   !Number.isFinite(Date.parse(v.startAt))||
   new Date(v.startAt).toISOString()!==v.startAt||
   typeof v.duration!=="number"||!Number.isSafeInteger(v.duration)||
   v.duration<1||v.duration>480)return null;
 return {teamId:v.teamId,cycleId:v.cycleId,kind:v.kind,
  name:v.name.trim(),startAt:v.startAt,duration:v.duration};
}
function localDay(time:number,zone:string):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(new Date(time));
 const val=(part:string)=>parts.find(p=>p.type===part)?.value??"";
 return val("year")+"-"+val("month")+"-"+val("day");
}
/** Un rendez-vous est strictement rattaché au cycle de l'équipe sélectionnée.
 * Il n'y a aucun DDL durant la requête : les structures doivent exister.
 * Toute insertion et trace d'audit ont lieu dans la même transaction.
 */
export async function createTeamMeeting(db:Client,actor:TeamActor,
 raw:unknown):Promise<TeamMeetingResult>{
 const input=parseTeamMeeting(raw);
 if(!input)return {ok:false,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const reject=async(error:ErrorCode):Promise<TeamMeetingResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.mode!==input.kind)return reject("mode-mismatch");
  const endAt=new Date(Date.parse(input.startAt)+input.duration*60000).toISOString();
  const endTime=Date.parse(endAt);
  const required=input.kind==="scrum"?
   ["smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history"]:
   ["smn_kanban_meeting","smn_kanban_period_audit"];
  const tables=await db.query<{name:string|null}>(`
   SELECT to_regclass('public.'||x.name)::text AS name
   FROM unnest($1::text[]) AS x(name)`,[required]);
  if(tables.rows.length!==required.length||tables.rows.some(x=>!x.name))
   return reject("storage-unavailable");

  if(input.kind==="scrum"){
   const cycle=await db.query<{id:string;status:string;start_at:string;end_at:string}>(`
    SELECT s.id,s.status,s.start_at::text,s.end_at::text
    FROM public.smn_sprint s
    JOIN public.smn_team t ON t.id=s.team_id
    WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
      AND s.deleted_at IS NULL FOR UPDATE OF s`,[input.cycleId,team.team_id]);
   const row=cycle.rows[0];
   if(cycle.rows.length!==1)return reject("not-found");
   if(row.status==="closed")return reject("closed-period");
   if(Date.parse(input.startAt)<Date.parse(row.start_at)||
      endTime>Date.parse(row.end_at))return reject("outside-period");
   const id=randomUUID();
   await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting
    (id,sprint_id,name,starts_at,ends_at,duration_minutes,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[
     id,input.cycleId,input.name,input.startAt,endAt,input.duration,actor.accountId
   ]);
   await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history
    (id,meeting_id,action,actor_id,details)
    VALUES($1,$2,'created',$3,$4::jsonb)`,[
     randomUUID(),id,actor.accountId,
     JSON.stringify({teamId:team.team_id,sprintId:input.cycleId,
      name:input.name,startAt:input.startAt,endAt,duration:input.duration})
   ]);
   await db.query("COMMIT");
   return {ok:true,id,teamId:team.team_id,kind:input.kind};
  }

  const cycle=await db.query<{
   id:string;status:string;start_on:string;end_on:string;time_zone:string
  }>(`SELECT p.id,p.status,p.start_on::text,p.end_on::text,p.time_zone
   FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id
   WHERE p.id=$1 AND p.team_id=$2 AND t.installation_id='singleton'
     AND p.deleted_at IS NULL FOR UPDATE OF p`,[input.cycleId,team.team_id]);
  const period=cycle.rows[0];
  if(cycle.rows.length!==1)return reject("not-found");
  if(period.status==="closed")return reject("closed-period");
  let starts:string,ends:string;
  try{
   starts=localDay(Date.parse(input.startAt),period.time_zone);
   ends=localDay(endTime-1,period.time_zone);
  }catch{return reject("storage-unavailable");}
  if(starts<period.start_on||ends>period.end_on)
   return reject("outside-period");
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_kanban_meeting
   (id,period_id,name,starts_at,ends_at,created_by)
   VALUES($1,$2,$3,$4,$5,$6)`,[
    id,input.cycleId,input.name,input.startAt,endAt,actor.accountId
  ]);
  // Le journal append-only du cycle permet de retrouver l'événement créé,
  // même avant l'introduction d'un journal dédié aux réunions Kanban.
  await db.query(`INSERT INTO public.smn_kanban_period_audit
   (id,period_id,action,details,actor_id)
   VALUES($1,$2,'meeting-created',$3::jsonb,$4)`,[
    randomUUID(),input.cycleId,JSON.stringify({meetingId:id,
     teamId:team.team_id,name:input.name,startAt:input.startAt,endAt,
     duration:input.duration}),actor.accountId
  ]);
  await db.query("COMMIT");
  return {ok:true,id,teamId:team.team_id,kind:input.kind};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
