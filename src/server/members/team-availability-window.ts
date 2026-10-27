import type {Client} from "pg";
import {isValidDate} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

export type TeamDayAvailability=Readonly<{
 date:string;morningAbsent:boolean;afternoonAbsent:boolean;
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
 const result=await db.query<{
  day:string;morning_absent:boolean;afternoon_absent:boolean;
 }>(`
 WITH member_days AS (
  SELECT gs.day::date AS day FROM generate_series($3::date,$4::date,
   interval '1 day') AS gs(day)
  WHERE EXISTS (
   SELECT 1 FROM public.smn_member_assignment x
   JOIN public.smn_member m ON m.id=x.member_id
   JOIN public.smn_team t ON t.id=x.team_id
   WHERE x.member_id=$1 AND x.team_id=$2
    AND m.installation_id=t.installation_id
    AND t.installation_id='singleton'
    AND x.start_on<=gs.day::date
    AND (x.end_on IS NULL OR x.end_on>=gs.day::date)
  )
 )
 SELECT d.day::text AS day,
  COALESCE(bool_or(a.id IS NOT NULL AND
    (a.start_on<d.day OR a.start_slot='morning')),false) AS morning_absent,
  COALESCE(bool_or(a.id IS NOT NULL AND
    (a.end_on>d.day OR a.end_slot='afternoon')),false) AS afternoon_absent
 FROM member_days d
 LEFT JOIN public.smn_member_absence a
  ON a.member_id=$1 AND a.start_on<=d.day AND a.end_on>=d.day
  AND NOT EXISTS(
   SELECT 1 FROM public.smn_member_absence_history h
   WHERE h.absence_id=a.id AND h.revision=a.revision
    AND h.after_values->>'deleted'='true'
  )
 GROUP BY d.day
 ORDER BY d.day
 LIMIT 31`,
 [parsed.memberId,authorized.team_id,parsed.startOn,parsed.endOn]);
 if(!result.rows.length)throw Error("member-out-of-team");
 return {
  memberId:parsed.memberId,teamId:authorized.team_id,
  startOn:parsed.startOn,endOn:parsed.endOn,
  days:result.rows.map(r=>({
   date:r.day,morningAbsent:r.morning_absent,
   afternoonAbsent:r.afternoon_absent
  }))
 };
}
