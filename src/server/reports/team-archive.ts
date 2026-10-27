import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** No URL archive identifier or team preference is an authorization token. */
export async function assertTeamPdfArchive(db:Client,actor:TeamActor,teamId:string,archiveId:string){
 if(!/^[a-f0-9-]{36}$/i.test(archiveId))return false;
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")return false;
 const scope=await db.query<{id:string}>(`SELECT a.id
 FROM public.smn_report_pdf_archive a
 JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
 JOIN public.smn_team t ON t.id=a.team_id
 WHERE a.id=$1 AND a.team_id=$2 AND t.installation_id='singleton'
 AND s.deleted_at IS NULL LIMIT 2`,[archiveId,team.team_id]);
 return scope.rows.length===1;
}
