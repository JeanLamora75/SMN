import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "./resolve";

type ScopedResource = "sprint"|"kanban-period"|"member-assignment"|"team";
const resources:Record<ScopedResource,{table:string;teamColumn:string}>={
 sprint:{table:"smn_sprint",teamColumn:"team_id"},
 "kanban-period":{table:"smn_kanban_period",teamColumn:"team_id"},
 "member-assignment":{table:"smn_member_assignment",teamColumn:"team_id"},
 team:{table:"smn_team",teamColumn:"id"}
};
const validId=(value:unknown):value is string=>
 typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);

/**
 * Fail-closed guard for resources scoped to the selected active team.
 * Call inside the same transaction as the subsequent mutation; consumers
 * must still scope their own UPDATE/DELETE by team_id.
 */
export async function assertActiveTeamResource(
 db:Client,actor:TeamActor,teamId:string,resource:ScopedResource,resourceId:string,
):Promise<void>{
 if(!validId(teamId)||!validId(resourceId)||!resources[resource])
  throw Error("team-resource-invalid");
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.team_id!==teamId)throw Error("team-access-forbidden");
 const {table,teamColumn}=resources[resource];
 const records=await db.query<{id:string}>(
  `SELECT id FROM public.${table} WHERE id=$1 AND ${teamColumn}=$2 LIMIT 2`,
  [resourceId,teamId]
 );
 if(records.rows.length!==1)throw Error("team-resource-unavailable");
}
