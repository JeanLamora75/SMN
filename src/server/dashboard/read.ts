import type { Client } from "pg";

export type DashboardContext = Readonly<{
  product: string;
  team: string;
  mode: "scrum" | "kanban";
}>;
export type CollectiveDashboard = Readonly<{
  context: DashboardContext;
  currentCycle: null;
  pendingCycles: readonly [];
  objectives: readonly [];
  metrics: readonly [];
  events: readonly [];
  attention: readonly [];
}>;

/**
 * Lecture collective strictement limitée à l'installation active. Les futurs
 * producteurs métier enrichiront ce contrat ; une table absente n'est jamais
 * simulée par un cycle ou un indicateur à zéro.
 */
export async function readCollectiveDashboard(client: Client): Promise<CollectiveDashboard> {
  const data = await client.query<{ product: string; team: string; mode: string }>(`
    SELECT p.name AS product, t.name AS team, i.mode
    FROM public.smn_installation i
      JOIN public.smn_product p ON p.installation_id = i.id
      JOIN public.smn_team t ON t.installation_id = i.id AND t.product_id = p.id
    WHERE i.id='singleton' AND i.state='initialized'
    LIMIT 2
  `);
  if (data.rows.length !== 1 || !["scrum", "kanban"].includes(data.rows[0].mode)) {
    throw new Error("dashboard-context-unavailable");
  }
  const context: DashboardContext = {
    product: data.rows[0].product,
    team: data.rows[0].team,
    mode: data.rows[0].mode as DashboardContext["mode"],
  };
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
