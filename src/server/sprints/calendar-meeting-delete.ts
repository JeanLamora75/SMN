import type {Client} from "pg";
import {validCalendarMeetingRef,type CalendarMeetingKind} from "./calendar-meeting-detail";

const tables={
 ceremony:"smn_sprint_ceremony",
 template:"smn_scrum_template_occurrence",
 exceptional:"smn_sprint_exceptional_meeting"
} as const;

/** Deletes ONE meeting, not every occurrence of its type. Never edits frozen snapshots. */
export async function deleteCalendarMeeting(db:Client,teamId:string,kind:string,id:string){
 if(!validCalendarMeetingRef(kind,id)||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(teamId))
  return {ok:false as const,error:"invalid-input" as const};
 const table=tables[kind as CalendarMeetingKind];
 await db.query("BEGIN");
 try{
  const record=await db.query<{id:string;sprint_id:string;sprint_status:string}>(`
   SELECT m.id,m.sprint_id,s.status AS sprint_status FROM public.${table} m
   JOIN public.smn_sprint s ON s.id=m.sprint_id
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE m.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
    AND i.id='singleton' AND i.state='initialized'
    AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
   FOR UPDATE OF m,s`,[id,teamId]);
  const existing=record.rows[0];
  if(!existing){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(existing.sprint_status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  const dependencies=kind==="ceremony"?
   ["smn_sprint_ceremony_segment","smn_sprint_ceremony_history","smn_sprint_ceremony_status_history"]:
   kind==="template"?["smn_scrum_template_occurrence_status_history"]:
   ["smn_sprint_exceptional_meeting_history","smn_sprint_exceptional_meeting_status_history",
    "smn_exceptional_capacity_impact_history","smn_exceptional_meeting_participant_audit",
    "smn_exceptional_meeting_participant","smn_sprint_historical_event"];
  const mandatory=[...dependencies,"smn_calendar_meeting_outcome_link","smn_calendar_meeting_schedule_history"];
  const found=await db.query<{name:string}>(`SELECT table_name AS name FROM information_schema.tables
   WHERE table_schema='public' AND table_name=ANY($1::text[])`,[mandatory]);
  if(mandatory.some(name=>!found.rows.some(row=>row.name===name))){
   await db.query("ROLLBACK");return {ok:false as const,error:"incomplete-schema" as const};
  }
  await db.query("DELETE FROM public.smn_calendar_meeting_outcome_link WHERE meeting_kind=$1 AND meeting_id=$2",[kind,id]);
  await db.query("DELETE FROM public.smn_calendar_meeting_schedule_history WHERE meeting_kind=$1 AND meeting_id=$2",[kind,id]);
  const fk=kind==="ceremony"?"ceremony_id":kind==="template"?"occurrence_id":"meeting_id";
  for(const dependency of dependencies)
   await db.query(`DELETE FROM public.${dependency} WHERE ${fk}=$1`,[id]);
  const deleted=await db.query(`DELETE FROM public.${table} WHERE id=$1 AND sprint_id=$2 RETURNING id`,
   [id,existing.sprint_id]);
  if(deleted.rowCount!==1)throw Error("calendar-meeting-delete-lost-lock");
  await db.query("COMMIT");return {ok:true as const};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23503")
   return {ok:false as const,error:"linked-data" as const};
  throw error;
 }
}
