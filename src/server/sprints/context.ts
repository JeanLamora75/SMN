import type {Client} from "pg";
import type {SprintContextItem} from "@/lib/sprint-context";
import {defaultSprintId} from "@/lib/sprint-context";

/**
 * Lecture de tous les Sprints de l'équipe courante, sans pagination implicite.
 * Pure consultation : pas de DDL, pas de mutation, pas de réconciliation.
 */
export async function readSprintContext(db:Client,teamId:string,now=Date.now()):
 Promise<{items:SprintContextItem[];defaultCycleId:string|null}>{
 const schema=await db.query<{table_exists:boolean;suspension_exists:boolean}>(`
 SELECT to_regclass('public.smn_sprint') IS NOT NULL AS table_exists,
 EXISTS(SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_sprint'
  AND column_name='auto_suspended') AS suspension_exists`);
 if(!schema.rows[0]?.table_exists)return {items:[],defaultCycleId:null};
 const suspended=schema.rows[0]?.suspension_exists?"s.auto_suspended":"false";
 const rows=await db.query<{
  id:string;name:string;status:string;start_at:Date|string;end_at:Date|string;
  time_zone:string;suspended:boolean
 }>(`SELECT s.id,s.name,s.status,s.start_at,s.end_at,s.time_zone,
   ${suspended} AS suspended
   FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
    AND s.team_id=$1 AND s.deleted_at IS NULL
   ORDER BY s.start_at DESC,s.id DESC`,[teamId]);
 const items:SprintContextItem[]=rows.rows.map(item=>({
  id:item.id,name:item.name,status:item.status,
  startAt:new Date(item.start_at).toISOString(),
  endAt:new Date(item.end_at).toISOString(),
  timeZone:item.time_zone,suspended:item.suspended===true
 }));
 return {items,defaultCycleId:defaultSprintId(items,now)};
}
