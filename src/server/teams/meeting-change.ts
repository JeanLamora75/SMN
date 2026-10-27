import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

type Kind="scrum"|"kanban";
type Change=Readonly<{
 teamId:string;kind:Kind;meetingId:string;action:"reschedule"|"cancel";
 expectedStartAt:string;expectedEndAt:string;startAt?:string;endAt?:string;
}>;
type ErrorCode="invalid-input"|"not-found"|"closed-period"|"protected"|
 "conflict"|"outside-period"|"storage-unavailable"|"mode-mismatch";
type Result=Readonly<{ok:true;changed:boolean;teamId:string;meetingId:string}>|
 Readonly<{ok:false;error:ErrorCode}>;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const validTime=(s:unknown):s is string=>typeof s==="string"&&UTC.test(s)&&
 Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;

export function parseTeamMeetingChange(raw:unknown):Change|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const x=raw as Record<string,unknown>;
 const keys=x.action==="reschedule"?[
  "action","endAt","expectedEndAt","expectedStartAt","kind","meetingId","startAt","teamId"
 ]:["action","expectedEndAt","expectedStartAt","kind","meetingId","teamId"];
 if(Object.keys(x).sort().join(",")!==keys.slice().sort().join(",")||
    (x.action!=="reschedule"&&x.action!=="cancel")||
    (x.kind!=="scrum"&&x.kind!=="kanban")||
    typeof x.teamId!=="string"||!ID.test(x.teamId)||
    typeof x.meetingId!=="string"||!ID.test(x.meetingId)||
    !validTime(x.expectedStartAt)||!validTime(x.expectedEndAt)||
    x.expectedEndAt<=x.expectedStartAt)return null;
 if(x.action==="cancel")return {
  action:"cancel",teamId:x.teamId,kind:x.kind,meetingId:x.meetingId,
  expectedStartAt:x.expectedStartAt,expectedEndAt:x.expectedEndAt
 };
 if(!validTime(x.startAt)||!validTime(x.endAt)||
    x.endAt<=x.startAt||
    (Date.parse(x.endAt)-Date.parse(x.startAt))/60000>480||
    !Number.isSafeInteger((Date.parse(x.endAt)-Date.parse(x.startAt))/60000))
   return null;
 return {action:"reschedule",teamId:x.teamId,kind:x.kind,meetingId:x.meetingId,
  expectedStartAt:x.expectedStartAt,expectedEndAt:x.expectedEndAt,
  startAt:x.startAt,endAt:x.endAt};
}
function localDate(timestamp:number,zone:string):string{
 const p=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",
  month:"2-digit",day:"2-digit"}).formatToParts(new Date(timestamp));
 const take=(name:string)=>p.find(x=>x.type===name)?.value??"";
 return take("year")+"-"+take("month")+"-"+take("day");
}
/** Une replanification ne porte que sur les réunions exceptionnelles Scrum
 * et les réunions Kanban manuelles. Cérémonies générées bloquées en v28.
 * CAS sur horaires originaux et statut, verrou cycle, audit atomique.
 */
export async function changeTeamMeeting(db:Client,actor:TeamActor,
 raw:unknown):Promise<Result>{
 const input=parseTeamMeetingChange(raw);
 if(!input)return {ok:false,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const reject=async(error:ErrorCode):Promise<Result>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  if(team.mode!==input.kind)return reject("mode-mismatch");
  const scrum=input.kind==="scrum";
  const table=scrum?"smn_sprint_exceptional_meeting":"smn_kanban_meeting";
  const cycleTable=scrum?"smn_sprint":"smn_kanban_period";
  const cycleField=scrum?"sprint_id":"period_id";
  const audit=scrum?"smn_sprint_exceptional_meeting_history":"smn_kanban_period_audit";
  const ready=await db.query<{present:boolean}>(
   "SELECT to_regclass($1) IS NOT NULL AS present",["public."+audit]);
  if(ready.rows[0]?.present!==true)return reject("storage-unavailable");
  // Les identifiants SQL sont déterminés par une allowlist interne, pas par l'API.
  const rows=await db.query<{
   id:string;cycle_id:string;status:string;starts_at:string;ends_at:string;
   cycle_status:string;cycle_start:string;cycle_end:string;time_zone:string|null
  }>(`SELECT m.id,m.${cycleField} AS cycle_id,m.status,
     m.starts_at::text AS starts_at,m.ends_at::text AS ends_at,
     c.status AS cycle_status,
     ${scrum?"c.start_at::text":"c.start_on::text"} AS cycle_start,
     ${scrum?"c.end_at::text":"c.end_on::text"} AS cycle_end,
     c.time_zone
    FROM public.${table} m JOIN public.${cycleTable} c
      ON c.id=m.${cycleField}
    JOIN public.smn_team t ON t.id=c.team_id
    WHERE m.id=$1 AND c.team_id=$2 AND t.installation_id='singleton'
      AND c.deleted_at IS NULL FOR UPDATE OF m,c`,
    [input.meetingId,team.team_id]);
  if(rows.rows.length!==1)return reject("not-found");
  const current=rows.rows[0];
  if(current.cycle_status==="closed")return reject("closed-period");
  if(current.status!=="scheduled")return reject("protected");
  const previousStart=new Date(current.starts_at).toISOString();
  const previousEnd=new Date(current.ends_at).toISOString();
  if(previousStart!==input.expectedStartAt||
     previousEnd!==input.expectedEndAt)return reject("conflict");
  const start=input.action==="reschedule"?input.startAt!:previousStart;
  const end=input.action==="reschedule"?input.endAt!:previousEnd;
  if(input.action==="reschedule"){
   if(scrum){
    if(Date.parse(start)<Date.parse(current.cycle_start)||
       Date.parse(end)>Date.parse(current.cycle_end))
     return reject("outside-period");
   }else{
    try{
     if(localDate(Date.parse(start),current.time_zone!)<current.cycle_start||
        localDate(Date.parse(end)-1,current.time_zone!)>current.cycle_end)
      return reject("outside-period");
    }catch{return reject("storage-unavailable");}
   }
  }
  if(input.action==="reschedule"&&start===previousStart&&end===previousEnd){
   await db.query("COMMIT");
   return {ok:true,changed:false,teamId:team.team_id,meetingId:input.meetingId};
  }
  const nextStatus=input.action==="cancel"?"cancelled":"scheduled";
  const query=`UPDATE public.${table}
    SET starts_at=$2::timestamptz,ends_at=$3::timestamptz,
       status=$4${scrum?",duration_minutes=$5":""}
    WHERE id=$1 AND starts_at=$6::timestamptz
      AND ends_at=$7::timestamptz AND status='scheduled' RETURNING id`;
  const saved=await db.query(query,[input.meetingId,start,end,nextStatus,
   (Date.parse(end)-Date.parse(start))/60000,previousStart,previousEnd]);
  if(saved.rowCount!==1)return reject("conflict");
  const details=JSON.stringify({teamId:team.team_id,meetingId:input.meetingId,
   before:{startAt:previousStart,endAt:previousEnd,status:"scheduled"},
   after:{startAt:start,endAt:end,status:nextStatus}});
  if(scrum){
   await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history
     (id,meeting_id,action,actor_id,details)
     VALUES($1,$2,$3,$4,$5::jsonb)`,[
      randomUUID(),input.meetingId,input.action==="cancel"?"cancelled":"rescheduled",
      actor.accountId,details
   ]);
  }else{
   await db.query(`INSERT INTO public.smn_kanban_period_audit
     (id,period_id,action,details,actor_id)
     VALUES($1,$2,$3,$4::jsonb,$5)`,[
      randomUUID(),current.cycle_id,input.action==="cancel"?
       "meeting-cancelled":"meeting-rescheduled",details,actor.accountId
   ]);
  }
  await db.query("COMMIT");
  return {ok:true,changed:true,teamId:team.team_id,meetingId:input.meetingId};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
