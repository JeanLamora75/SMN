import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {withAuthDb} from "@/server/auth/database";

const uuid=/^[a-f0-9-]{36}$/i;

/** A cycle identifier supplied in a URL cannot grant access to another team. */
export async function assertTeamReportCycle(db:Client,actor:TeamActor,teamId:string,cycleId:string){
 if(!uuid.test(cycleId))return false;
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")return false;
 const rows=await db.query<{id:string}>(`
 SELECT s.id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id
 WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
 AND s.deleted_at IS NULL LIMIT 2`,[cycleId,team.team_id]);
 return rows.rows.length===1;
}

export async function withTeamReportCycle<T>(
 actor:TeamActor,teamId:string,cycleId:string,
 action:(db:Client)=>Promise<T>
):Promise<T|null>{
 return withAuthDb(async db=>{
  if(!await assertTeamReportCycle(db,actor,teamId,cycleId))return null;
  return action(db);
 });
}
