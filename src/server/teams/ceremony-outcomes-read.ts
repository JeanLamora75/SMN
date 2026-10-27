import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "./resolve";
import {readCalendarMeeting,validCalendarMeetingRef} from "../sprints/calendar-meeting-detail";
import type {MeetingOutcome} from "../sprints/calendar-meeting-outcomes";

/** Lecture seule. Chaque jointure revalide l'équipe et le sprint. Aucun DDL. */
export async function readScopedCeremonyOutcomes(db:Client,actor:TeamActor,
 teamId:string,kind:string,id:string):Promise<MeetingOutcome[]|null>{
 if(!validCalendarMeetingRef(kind,id))return null;
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")return null;
 const meeting=await readCalendarMeeting(db,kind,id,team.team_id);
 if(!meeting)return null;
 const present=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_calendar_meeting_outcome_link') IS NOT NULL AS present");
 if(!present.rows[0]?.present)return [];
 const rows=await db.query<{id:string;type:"decision"|"action"|"highlight";title:string;
 description:string|null;occurred_on:string;created_at:string}>(`
  SELECT r.id,r.type,r.title,r.description,
   r.occurred_on::text,r.created_at::text
  FROM public.smn_calendar_meeting_outcome_link l
  JOIN public.smn_registry_item r ON r.id=l.registry_item_id
   AND r.team_id=l.team_id AND r.type IN ('decision','action','highlight')
  JOIN public.smn_sprint s ON s.id=l.sprint_id AND s.team_id=l.team_id
  WHERE l.team_id=$1 AND l.sprint_id=$2 AND l.meeting_kind=$3
   AND l.meeting_id=$4 AND s.deleted_at IS NULL
  ORDER BY l.created_at DESC,r.id DESC LIMIT 100
 `,[team.team_id,meeting.sprintId,kind,id]);
 return rows.rows.map(r=>({id:r.id,type:r.type,title:r.title,
  description:r.description??"",occurredOn:r.occurred_on,createdAt:r.created_at}));
}
