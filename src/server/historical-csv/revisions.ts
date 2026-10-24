import type {Client} from "pg";
export type MetricRevision={id:string;batchId:string;cycleId:string;metricCode:string;before:number|null;after:number;beforeQuality:string|null;quality:string;sourceLine:number|null;action:string;changedAt:string;actorId:string|null;origin:"csv-retrospective"};
/** Admin-only caller. Read-only; no raw CSV or personal account details. */
export async function listHistoricalMetricRevisions(db:Client,cycleId?:string):Promise<MetricRevision[]>{
 const exists=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_historical_csv_change') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return [];
 const columns=await db.query<{name:string}>(`SELECT column_name AS name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='smn_historical_csv_change'
 AND column_name IN ('source_line','previous_quality')`);
 const available=new Set(columns.rows.map(r=>r.name));
 const line=available.has("source_line")?"c.source_line":"NULL::integer";
 const prior=available.has("previous_quality")?"c.previous_quality":"NULL::text";
 const rows=await db.query<Omit<MetricRevision,"origin">>(`SELECT c.id,c.batch_id AS "batchId",c.cycle_id AS "cycleId",
 c.metric_code AS "metricCode",c.previous_value::float8 AS before,c.next_value::float8 AS after,
 ${prior} AS "beforeQuality",c.quality,c.action,${line} AS "sourceLine",
 c.changed_at::text AS "changedAt",c.actor_id AS "actorId"
 FROM public.smn_historical_csv_change c
 JOIN public.smn_historical_csv_batch b ON b.id=c.batch_id
 JOIN public.smn_installation i ON i.id='singleton' AND i.state='initialized' AND lower(i.mode)=b.mode
 WHERE ($1::text IS NULL OR c.cycle_id=$1)
 AND (
   (b.mode='scrum' AND EXISTS(
    SELECT 1 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
    WHERE s.id=c.cycle_id AND s.deleted_at IS NULL AND t.installation_id=i.id
   ))
   OR
   (b.mode='kanban' AND EXISTS(
    SELECT 1 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
    WHERE p.id=c.cycle_id AND p.deleted_at IS NULL AND t.installation_id=i.id
   ))
 )
 ORDER BY c.changed_at DESC,c.id DESC LIMIT 200`,[cycleId??null]);
 return rows.rows.map(r=>({...r,origin:"csv-retrospective" as const}));
}
