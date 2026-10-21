import type {Client} from "pg";
import {validRecordId,type DashboardContext} from "./read";
import {projectCollectiveContext} from "@/lib/collective-projection";

/** Fiche collective courante uniquement : ni données personnelles ni vue historique inventée. */
export async function readTeamDetail(client: Client, id: string): Promise<DashboardContext|null> {
  if (!validRecordId(id)) return null;
  const response=await client.query<{
    product_id:string; product:string; team_id:string; team:string; mode:string;
  }>(`SELECT p.id AS product_id,p.name AS product,t.id AS team_id,t.name AS team,i.mode
       FROM public.smn_installation i
       JOIN public.smn_product p ON p.installation_id=i.id
       JOIN public.smn_team t ON t.installation_id=i.id AND t.product_id=p.id
       WHERE i.id='singleton' AND i.state='initialized'
         AND t.installation_id='singleton' AND t.id=$1
       LIMIT 2`,[id]);
  if (response.rows.length!==1) return null;
  const row=response.rows[0];
  if (!validRecordId(row.product_id) || row.team_id!==id ||
      (row.mode!=="scrum" && row.mode!=="kanban") ||
      typeof row.product!=="string" || typeof row.team!=="string") return null;
  return projectCollectiveContext({productId:row.product_id,product:row.product,teamId:id,team:row.team,mode:row.mode});
}

