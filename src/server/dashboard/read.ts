import type { Client } from "pg";
import {projectCollectiveContext,type CollectiveContext} from "@/lib/collective-projection";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

export type DashboardContext = CollectiveContext;
export type CollectiveDashboard = Readonly<{
  context: DashboardContext;
  currentCycle: null;
  pendingCycles: readonly [];
  objectives: readonly [];
  metrics: readonly [];
  events: readonly [];
  attention: readonly [];
}>;

export function validRecordId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id);
}

/**
 * Lecture collective strictement limitée à l'installation active. Les futurs
 * producteurs métier enrichiront ce contrat ; une table absente n'est jamais
 * simulée par un cycle ou un indicateur à zéro.
 */
export async function readCollectiveDashboard(client: Client,
 actor?:TeamActor,requestedTeamId?:string|null): Promise<CollectiveDashboard> {
  // Un appel sans acteur reste l'ancien lecteur monoéquipe.
  // La cible multiéquipes exige l'acteur Admin et l'appartenance du teamId.
  const data = actor ? {rows:[await resolveAdminTeam(client,actor,requestedTeamId)]} :
   await client.query<{ product_id: string; product: string; team_id: string; team: string; mode: string }>(`
    SELECT p.id AS product_id, p.name AS product, t.id AS team_id, t.name AS team, i.mode
    FROM public.smn_installation i
      JOIN public.smn_product p ON p.installation_id = i.id
      JOIN public.smn_team t ON t.installation_id = i.id AND t.product_id = p.id
    WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27
    LIMIT 2
  `);
  if (data.rows.length !== 1 || !["scrum", "kanban"].includes(data.rows[0].mode)) {
    throw new Error("dashboard-context-unavailable");
  }
  const context=projectCollectiveContext({
    productId:data.rows[0].product_id,teamId:data.rows[0].team_id,
    product:data.rows[0].product,team:data.rows[0].team,mode:data.rows[0].mode,
  });
  if(!context)throw new Error("dashboard-context-unavailable");
  return {
    context,
    currentCycle: null,
    pendingCycles: [],
    objectives: [],
    metrics: [],
    events: [],
    attention: [],
  };
}

/** Compatibilité monoéquipe : en v27, lecture historique inchangée.
 * En v28, l'acteur devient obligatoire pour résoudre une équipe.
 * Aucun fallback vers « première équipe » n'est autorisé en multiéquipes.
 */
export async function readAccountDashboard(client:Client,actor:TeamActor,
 requestedTeamId?:string|null):Promise<CollectiveDashboard>{
 const result=await client.query<{schema_version:number}>(`
  SELECT i.schema_version FROM public.smn_installation i
  JOIN public.smn_account a ON a.installation_id=i.id
  WHERE i.id='singleton' AND i.state='initialized'
   AND a.id=$1 AND a.is_active=true`,[actor.accountId]);
 if(result.rows.length!==1)throw new Error("dashboard-context-unavailable");
 if(result.rows[0].schema_version===28)
  return readCollectiveDashboard(client,actor,requestedTeamId);
 if(result.rows[0].schema_version>=1&&result.rows[0].schema_version<=27)
  return readCollectiveDashboard(client);
 throw new Error("dashboard-context-unavailable");
}
