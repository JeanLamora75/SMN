import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const RECORD=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type TeamRegistryItem=Readonly<{
 id:string;teamId:string;type:string;title:string;status:string;
 occurredOn:string;description:string|null;dueOn:string|null;
 owner:string|null;comment:string|null;revision:number;
}>;

/** Une fiche v28 est récupérée PAR équipe autorisée, jamais par l'ID seul.
 * Cet inventaire réduit est SELECT-only, sans DDL ni chargement automatique
 * des historiques/relationnels non encore isolés.
 */
export async function readTeamRegistryItem(db:Client,actor:TeamActor,
 requestedTeamId:string|null,recordId:string
):Promise<TeamRegistryItem|null>{
 if(!RECORD.test(recordId))throw Error("registry-item-id-invalid");
 const team=await resolveAdminTeam(db,actor,requestedTeamId);
 const result=await db.query<{
  id:string;teamId:string;type:string;title:string;status:string;
  occurredOn:string;description:string|null;dueOn:string|null;
  owner:string|null;comment:string|null;revision:number;
 }>(`SELECT r.id,r.team_id AS "teamId",r.type,r.title,r.status,
  r.occurred_on::text AS "occurredOn",r.description,
  r.due_on::text AS "dueOn",r.owner_name AS owner,r.comment,r.revision
  FROM public.smn_registry_item r
  JOIN public.smn_team t ON t.id=r.team_id
  WHERE r.id=$1 AND r.team_id=$2 AND t.installation_id='singleton'
  LIMIT 2`,[recordId,team.team_id]);
 return result.rows.length===1?result.rows[0]:null;
}
