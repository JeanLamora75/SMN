import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** Vérifie le propriétaire d'une période avant toute lecture ou mutation. */
export type KanbanTeamAccess=Readonly<{actor:TeamActor;teamId:string}>;
export async function scopedKanbanPeriod(db:Client,id:string,lock=false,
 access?:KanbanTeamAccess,actorId?:string):Promise<{id:string;status:string}|null>{
 const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
 if(access&&(team?.mode!=="kanban"||(actorId!==undefined&&access.actor.accountId!==actorId)))
  throw Error("team-access-forbidden");
 const criterion=team?
  "AND p.team_id=$2 AND i.schema_version IN (28,29,30) AND lower(t.agile_mode)='kanban' AND t.is_archived=false":
  "AND i.schema_version<=27 AND lower(i.mode)='kanban'";
 const row=await db.query<{id:string;status:string}>(`SELECT p.id,p.status FROM public.smn_kanban_period p
  JOIN public.smn_team t ON t.id=p.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton'
   AND i.state='initialized' ${criterion} ${lock?"FOR UPDATE OF p":""}`,
  team?[id,team.team_id]:[id]);
 return row.rows[0]??null;
}
