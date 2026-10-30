import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureCeremonyEditSchema} from "./ceremony-edits";
import {ensureTemplateOccurrenceSchema} from "./template-occurrences";
import {ensureExceptionalMeetingSchema} from "./exceptional-meetings";
import {validCalendarMeetingRef,type CalendarMeetingKind} from "./calendar-meeting-detail";

const tables={
 ceremony:{table:"smn_sprint_ceremony",status:"occurrence_status",max:600},
 template:{table:"smn_scrum_template_occurrence",status:"status",max:480},
 exceptional:{table:"smn_sprint_exceptional_meeting",status:"status",max:480}
} as const;
type ScheduleInput={kind:CalendarMeetingKind;id:string;startAt:string;endAt:string;revision:number};
type ScheduleError="invalid-input"|"not-found"|"conflict"|"closed-period"|
 "outside-sprint"|"protected";
type Row={id:string;sprint_id:string;starts_at:string;ends_at:string;revision:number;
 sprint_start:string;sprint_end:string;sprint_status:string;status:string;
 planned_minutes:number|null;};
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function parse(raw:unknown):ScheduleInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).sort().join(",")!=="endAt,id,kind,revision,startAt"||
  typeof x.kind!=="string"||typeof x.id!=="string"||
  !validCalendarMeetingRef(x.kind,x.id)||
  typeof x.startAt!=="string"||typeof x.endAt!=="string"||
  !iso.test(x.startAt)||!iso.test(x.endAt)||
  !Number.isSafeInteger(x.revision)||Number(x.revision)<1)return null;
 const start=Date.parse(x.startAt),end=Date.parse(x.endAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start|| 
  new Date(start).toISOString()!==x.startAt||new Date(end).toISOString()!==x.endAt)return null;
 const duration=(end-start)/60000;
 if(!Number.isSafeInteger(duration)||duration<1||duration>tables[x.kind].max)return null;
 return {kind:x.kind as CalendarMeetingKind,id:x.id as string,
  startAt:x.startAt as string,endAt:x.endAt as string,revision:x.revision as number};
}
async function ensureScheduleSchema(db:Client){
 const names=["smn_calendar_meeting_schedule_history"] as const;
 const found=await db.query<{present:string[]}>(`SELECT array_agg(relname)::text[] AS present FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[names]);
 if(names.some(name=>!found.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
/** Reschedules one occurrence without changing its recurrence template. */
export async function updateCalendarMeetingSchedule(db:Client,actorId:string,raw:unknown):
 Promise<{ok:true;changed:boolean;revision:number;warningCount:number}|
 {ok:false;error:ScheduleError}>{
 const input=parse(raw);
 if(!input)return {ok:false,error:"invalid-input"};
 await ensureScheduleSchema(db);
 const spec=tables[input.kind],duration=(Date.parse(input.endAt)-Date.parse(input.startAt))/60000;
 await db.query("BEGIN");
 try{
  const planned=input.kind==="ceremony"?"m.minutes AS planned_minutes":"NULL::integer AS planned_minutes";
  const rows=await db.query<Row>(`SELECT m.id,m.sprint_id,m.starts_at::text AS starts_at,
   m.ends_at::text AS ends_at,m.revision,m.${spec.status} AS status,${planned},
   s.start_at::text AS sprint_start,s.end_at::text AS sprint_end,s.status AS sprint_status
   FROM public.${spec.table} m
   JOIN public.smn_sprint s ON s.id=m.sprint_id
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE m.id=$1 AND i.id='singleton' AND i.state='initialized'
    AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))='scrum' AND s.deleted_at IS NULL
   FOR UPDATE OF m,s`,[input.id]);
  const prior=rows.rows[0];
  const reject=async(error:ScheduleError)=>{
   await db.query("ROLLBACK");return {ok:false as const,error};
  };
  if(!prior)return reject("not-found");
  if(prior.sprint_status==="closed")return reject("closed-period");
  if(Number(prior.revision)!==input.revision)return reject("conflict");
  if(prior.status==="cancelled")return reject("protected");
  if(Date.parse(input.startAt)<Date.parse(prior.sprint_start)||
   Date.parse(input.endAt)>Date.parse(prior.sprint_end))return reject("outside-sprint");
  const before={startAt:new Date(prior.starts_at).toISOString(),endAt:new Date(prior.ends_at).toISOString()};
  if(before.startAt===input.startAt&&before.endAt===input.endAt){
   await db.query("COMMIT");
   return {ok:true,changed:false,revision:input.revision,warningCount:0};
  }
  const overlap=await db.query<{count:string}>(`SELECT COUNT(*)::text AS count FROM (
   SELECT c.id FROM public.smn_sprint_ceremony c
    JOIN public.smn_sprint s ON s.id=c.sprint_id
    WHERE s.team_id=(SELECT team_id FROM public.smn_sprint WHERE id=$1)
      AND s.deleted_at IS NULL AND c.id<>$2 AND c.starts_at<$4 AND c.ends_at>$3
   UNION ALL
   SELECT o.id FROM public.smn_scrum_template_occurrence o
    JOIN public.smn_sprint s ON s.id=o.sprint_id
    WHERE s.team_id=(SELECT team_id FROM public.smn_sprint WHERE id=$1)
      AND s.deleted_at IS NULL AND o.id<>$2 AND o.starts_at<$4 AND o.ends_at>$3
   UNION ALL
   SELECT e.id FROM public.smn_sprint_exceptional_meeting e
    JOIN public.smn_sprint s ON s.id=e.sprint_id
    WHERE s.team_id=(SELECT team_id FROM public.smn_sprint WHERE id=$1)
      AND s.deleted_at IS NULL AND e.id<>$2 AND e.starts_at<$4 AND e.ends_at>$3
  ) conflicts`,[prior.sprint_id,input.id,input.startAt,input.endAt]);
  const extra=input.kind==="ceremony"?",minutes=$4,provenance='customized'":
   input.kind==="exceptional"?",duration_minutes=$4":"";
  const args=input.kind==="template"?[input.id,input.startAt,input.endAt]:
   [input.id,input.startAt,input.endAt,duration];
  await db.query(`UPDATE public.${spec.table}
   SET starts_at=$2,ends_at=$3${extra},revision=revision+1 WHERE id=$1`,args);
  if(input.kind==="ceremony"){
   await db.query("DELETE FROM public.smn_sprint_ceremony_segment WHERE ceremony_id=$1",[input.id]);
   await db.query(`INSERT INTO public.smn_sprint_ceremony_segment
    (ceremony_id,position,starts_at,ends_at,minutes) VALUES($1,1,$2,$3,$4)`,
    [input.id,input.startAt,input.endAt,duration]);
   await db.query(`INSERT INTO public.smn_sprint_ceremony_history
    (id,ceremony_id,revision,previous_values,next_values,changed_by)
    VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
    [randomUUID(),input.id,input.revision+1,JSON.stringify({...before,minutes:prior.planned_minutes}),
     JSON.stringify({startAt:input.startAt,endAt:input.endAt,minutes:duration}),actorId]);
  }
  if(input.kind==="exceptional"){
   await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history
    (id,meeting_id,action,actor_id,details)
    VALUES($1,$2,'rescheduled',$3,$4::jsonb)`,
    [randomUUID(),input.id,actorId,JSON.stringify({before,after:{
     startAt:input.startAt,endAt:input.endAt,duration}})]);
  }
  await db.query(`INSERT INTO public.smn_calendar_meeting_schedule_history
   (id,meeting_kind,meeting_id,previous_values,next_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
   [randomUUID(),input.kind,input.id,JSON.stringify(before),JSON.stringify({
    startAt:input.startAt,endAt:input.endAt,durationMinutes:duration,
    revision:input.revision+1}),actorId]);
  await db.query("COMMIT");
  return {ok:true,changed:true,revision:input.revision+1,
   warningCount:Number(overlap.rows[0]?.count??0)};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23505")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
