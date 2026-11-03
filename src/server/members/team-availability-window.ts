import type {Client} from "pg";
import {isValidDate} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

export type TeamDayAvailability=Readonly<{
 date:string;morningAbsent:boolean;afternoonAbsent:boolean;holidayName:string|null;
 isExit:boolean;exitReason:string|null;
}>;
export type TeamAvailabilityWindow=Readonly<{
 memberId:string;teamId:string;startOn:string;endOn:string;
 days:readonly TeamDayAvailability[];
}>;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const validTeamId=(id:unknown):id is string=>
 typeof id==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id);

export function parseTeamAvailabilityWindow(memberId:unknown,teamId:unknown,
 startOn:unknown,endOn:unknown):Readonly<{
 memberId:string;teamId:string;startOn:string;endOn:string;
}>|null{
 if(typeof memberId!=="string"||!UUID.test(memberId)||!validTeamId(teamId)||
    !isValidDate(startOn)||!isValidDate(endOn)||startOn>endOn)return null;
 const days=(Date.parse(endOn+"T00:00:00.000Z")-
  Date.parse(startOn+"T00:00:00.000Z"))/86400000+1;
 if(!Number.isInteger(days)||days<1||days>31)return null;
 return {memberId,teamId,startOn,endOn};
}

/** 
 * Read-only v28 : no personal reasons, categories, raw historical events,
 * identities, or periods outside this team's membership are returned.
 * The authorized team and the current role are checked server-side first.
 * Dates are scoped within assignments, including ended historical ones.
 */
export async function readTeamAvailabilityWindow(db:Client,actor:TeamActor,
 raw:unknown):Promise<TeamAvailabilityWindow>{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  throw Error("team-availability-invalid-input");
 const input=raw as Record<string,unknown>;
 if(Object.keys(input).length!==4)
  throw Error("team-availability-invalid-input");
 const parsed=parseTeamAvailabilityWindow(input.memberId,input.teamId,
  input.startOn,input.endOn);
 if(!parsed)throw Error("team-availability-invalid-input");
 const authorized=await resolveAdminTeam(db,actor,parsed.teamId);
 // The member/team assignment and all daily absences share one SQL snapshot.
 // A former team receives dates from its own assignment, not dates when the
 // member subsequently joined another team.
 const membership=await db.query<{id:string}>(`
 SELECT a.id FROM public.smn_member_assignment a
 JOIN public.smn_member m ON m.id=a.member_id
 WHERE a.member_id=$1 AND a.team_id=$2 AND m.installation_id='singleton'
 LIMIT 1`,[parsed.memberId,authorized.team_id]);
 if(!membership.rows.length)throw Error("member-out-of-team");
 const result=await db.query<{
  day:string;morning_absent:boolean;afternoon_absent:boolean;holiday_name:string|null;
  assigned:boolean;is_exit:boolean;exit_reason:string|null;
 }>(`
 WITH member_days AS (
  SELECT gs.day::date AS day,
   EXISTS(SELECT 1 FROM public.smn_member_assignment x
    WHERE x.member_id=$1 AND x.team_id=$2
     AND x.start_on<=gs.day::date
     AND (x.end_on IS NULL OR x.end_on>=gs.day::date)) AS assigned
  FROM generate_series($3::date,$4::date,interval '1 day') AS gs(day)
 ),
 scoped_days AS (
  SELECT d.day,d.assigned,
   (SELECT x.id FROM public.smn_member_assignment x
    WHERE x.member_id=$1 AND x.team_id=$2 AND x.end_on=d.day-1
    ORDER BY x.start_on DESC,x.id DESC LIMIT 1) AS exit_assignment_id
  FROM member_days d
 )
 SELECT d.day::text AS day,d.assigned,
  (NOT d.assigned AND d.exit_assignment_id IS NOT NULL) AS is_exit,
  CASE WHEN NOT d.assigned AND d.exit_assignment_id IS NOT NULL THEN
   (SELECT NULLIF(btrim(e.details->>'reason'),'')
    FROM public.smn_member_lifecycle_event e
    WHERE e.member_id=$1 AND e.assignment_id=d.exit_assignment_id
     AND e.action='close' AND e.effective_on=d.day-1
    ORDER BY e.id DESC LIMIT 1)
  ELSE NULL END AS exit_reason,
  CASE WHEN d.assigned THEN (SELECT h.name FROM public.smn_national_holiday h
   WHERE h.country_code=(
    /* Match the country currently configured in the member's location
       editor, regardless of the month being displayed. Never inherit
       historical countries or the installation reference country. */
    SELECT l.country_iso2 FROM public.smn_member_location l
    WHERE l.member_id=$1
    ORDER BY l.revision DESC LIMIT 1
   ) AND h.holiday_date=d.day
   ORDER BY h.name LIMIT 1) ELSE NULL END AS holiday_name,
  COALESCE(bool_or(d.assigned AND a.id IS NOT NULL AND
   (a.start_on<d.day OR a.start_slot='morning')),false) AS morning_absent,
  COALESCE(bool_or(d.assigned AND a.id IS NOT NULL AND
   (a.end_on>d.day OR a.end_slot='afternoon')),false) AS afternoon_absent
 FROM scoped_days d
 LEFT JOIN public.smn_member_absence a
  ON a.member_id=$1 AND a.start_on<=d.day AND a.end_on>=d.day
  AND NOT EXISTS(SELECT 1 FROM public.smn_member_absence_history h
   WHERE h.absence_id=a.id AND h.revision=a.revision
    AND h.after_values->>'deleted'='true')
 GROUP BY d.day,d.assigned,d.exit_assignment_id ORDER BY d.day LIMIT 31`,
 [parsed.memberId,authorized.team_id,parsed.startOn,parsed.endOn]);
 if(!result.rows.length)throw Error("member-out-of-team");
 return {
  memberId:parsed.memberId,teamId:authorized.team_id,
  startOn:parsed.startOn,endOn:parsed.endOn,
  days:result.rows.filter(r=>r.assigned||r.is_exit).map(r=>({
   date:r.day,morningAbsent:r.assigned&&r.morning_absent,
   afternoonAbsent:r.assigned&&r.afternoon_absent,
   holidayName:r.assigned?r.holiday_name??null:null,
   isExit:r.is_exit,exitReason:r.is_exit?r.exit_reason??null:null
  }))
 };
}
