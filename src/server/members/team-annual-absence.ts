import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export async function readTeamAnnualAbsence(db:Client,actor:TeamActor,
 memberId:string,teamId:string,year:number):Promise<{year:number;halfDays:number;months:{month:string;halfDays:number}[]}>{
 if(!UUID.test(memberId)||!Number.isInteger(year)||year<1900||year>2200)
  throw Error("team-annual-absence-invalid-input");
 const team=await resolveAdminTeam(db,actor,teamId);
 const membership=await db.query<{id:string}>(`SELECT a.id FROM public.smn_member_assignment a
 JOIN public.smn_member m ON m.id=a.member_id
 WHERE a.member_id=$1 AND a.team_id=$2 AND m.installation_id='singleton' LIMIT 1`,
 [memberId,team.team_id]);
 if(membership.rows.length!==1)throw Error("member-out-of-team");
 const result=await db.query<{day:string;morning:boolean;afternoon:boolean}>(`
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
 ), eligible_days AS (
  SELECT d.day
  FROM member_days d
  WHERE EXTRACT(ISODOW FROM d.day) BETWEEN 1 AND 5
   AND NOT EXISTS (
    SELECT 1 FROM public.smn_national_holiday h
    WHERE h.holiday_date=d.day AND h.country_code=(
     SELECT l.country_iso2 FROM public.smn_member_location l
     WHERE l.member_id=$1 ORDER BY l.revision DESC LIMIT 1
    )
   )
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
  FROM eligible_days d
 )
 SELECT day::text AS day,morning,afternoon FROM slots ORDER BY day`,
  [memberId,team.team_id,year]);
 // Une ligne par jour éligible : la somme est vérifiable, et chaque
 // demi-journée est comptée au plus une fois, même en cas de doublon.
 const perMonth=new Map<string,number>();
 let halfDays=0;
 for(const day of result.rows){
  const count=Number(day.morning===true)+Number(day.afternoon===true);
  if(!count)continue;
  halfDays+=count;
  const month=day.day.slice(0,7);
  perMonth.set(month,(perMonth.get(month)??0)+count);
 }
 return {year,halfDays,months:[...perMonth].map(([month,halfDays])=>({month,halfDays}))};
}
