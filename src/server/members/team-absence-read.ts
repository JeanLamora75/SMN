import type {Client} from "pg";
import {readMemberAbsences,type AbsenceState} from "./absence";
import {requireTeamMemberScope} from "./team-scope";
import type {TeamActor} from "@/server/teams/resolve";

/** Ne divulgue que les absences intégralement couvertes par la seule équipe demandée. */
export async function readScopedTeamAbsences(db:Client,actor:TeamActor,
 memberId:string,teamId:string):Promise<AbsenceState>{
 const scope=await requireTeamMemberScope(db,actor,memberId,teamId);
 const state=await readMemberAbsences(db,memberId);
 const allowed=await db.query<{id:string}>(`
  SELECT a.id FROM public.smn_member_absence a
  WHERE a.member_id=$1
   AND EXISTS (
    SELECT 1 FROM public.smn_member_assignment own
    WHERE own.member_id=$1 AND own.team_id=$2
      AND own.start_on<=a.start_on
      AND (own.end_on IS NULL OR own.end_on>=a.end_on))
   AND NOT EXISTS (
    SELECT 1 FROM public.smn_member_assignment other
    JOIN public.smn_team t ON t.id=other.team_id
    WHERE other.member_id=$1 AND other.team_id<>$2
      AND t.installation_id='singleton'
      AND other.start_on<=a.end_on
      AND (other.end_on IS NULL OR other.end_on>=a.start_on))
 `,[memberId,scope.teamId]);
 const ids=new Set(allowed.rows.map(row=>row.id));
 return {...state,absences:state.absences.filter(a=>ids.has(a.id)),onDate:[]};
}
