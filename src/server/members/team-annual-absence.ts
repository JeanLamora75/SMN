import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export async function readTeamAnnualAbsence(db:Client,actor:TeamActor,
 memberId:string,teamId:string,year:number):Promise<{year:number;halfDays:number}>{
 if(!UUID.test(memberId)||!Number.isInteger(year)||year<1900||year>2200)
  throw Error("team-annual-absence-invalid-input");
 const team=await resolveAdminTeam(db,actor,teamId);
 const membership=await db.query<{id:string}>(`SELECT a.id FROM public.smn_member_assignment a
 JOIN public.smn_member m ON m.id=a.member_id
 WHERE a.member_id=$1 AND a.team_id=$2 AND m.installation_id='singleton' LIMIT 1`,
 [memberId,team.team_id]);
 if(membership.rows.length!==1)throw Error("member-out-of-team");
 const result=await db.query<{half_days:number}>(`
 WITH member_days AS (
  SELECT DISTINCT g.day::date AS day
  FROM public.smn_member_assignment x
  JOIN public.smn_member m ON m.id=x.member_id
  JOIN public.smn_team t ON t.id=x.team_id
  CROSS JOIN LATERAL generate_series(
   GREATEST(x.start_on,make_date($3,1,1)),
   LEAST(COALESCE(x.end_on,make_date($3,12,31)),make_date($3,12,31)),
   interval '1 day') AS g(day)
  WHERE x.member_id=$1 AND x.team_id=$2
   AND m.installation_id='singleton' AND t.installation_id=m.installation_id
 ), slots AS (
  SELECT d.day,
   EXISTS(SELECT 1 FROM public.smn_member_absence a
    WHERE a.member_id=$1 AND a.start_on<=d.day AND a.end_on>=d.day
     AND (a.start_on<d.day OR a.start_slot='morning')
     AND NOT EXISTS(SELECT 1 FROM public.smn_member_absence_history h
      WHERE h.absence_id=a.id AND h.revision=a.revision
       AND h.after_values->>'deleted'='true')) AS morning,
   EXISTS(SELECT 1 FROM public.smn_member_absence a
    WHERE a.member_id=$1 AND a.start_on<=d.day AND a.end_on>=d.day
     AND (a.end_on>d.day OR a.end_slot='afternoon')
     AND NOT EXISTS(SELECT 1 FROM public.smn_member_absence_history h
      WHERE h.absence_id=a.id AND h.revision=a.revision
       AND h.after_values->>'deleted'='true')) AS afternoon
  FROM member_days d
 )
 SELECT COUNT(*) FILTER (WHERE morning)::int+
        COUNT(*) FILTER (WHERE afternoon)::int AS half_days
 FROM slots`,[memberId,team.team_id,year]);
 return {year,halfDays:result.rows[0]?.half_days??0};
}
