import type {Client} from "pg";
/**
 * Kanban qualitative links are explicit: never infer period membership from dates,
 * titles, Scrum sprint links or mere team membership.
 */
export async function ensureKanbanQualitativeLinks(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_registry_link(
 period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(period_id,item_id))`);
}
export async function captureKanbanQualitative(db:Client,periodId:string,teamId:string){
 const schema=await db.query<{items:boolean;links:boolean}>(`
 SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS items,
 to_regclass('public.smn_kanban_registry_link') IS NOT NULL AS links`);
 if(!schema.rows[0]?.items||!schema.rows[0]?.links)
  return {state:"no-explicit-kanban-links" as const,items:[]};
 const rows=await db.query<{
  id:string;type:string;title:string;description:string|null;status:string;
  occurred_on:string|null;comment:string|null;revision:number
 }>(`SELECT r.id,r.type,r.title,r.description,r.status,
 r.occurred_on::text AS occurred_on,r.comment,r.revision
 FROM public.smn_kanban_registry_link l
 JOIN public.smn_registry_item r ON r.id=l.item_id
 WHERE l.period_id=$1 AND r.team_id=$2
 ORDER BY r.type,r.id`,[periodId,teamId]);
 return {state:"captured-explicit-links" as const,items:rows.rows};
}
