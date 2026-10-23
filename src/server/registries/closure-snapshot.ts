import type {Client} from "pg";
/** Captured only during an effective close, inside the caller's transaction. */
export async function qualitativeClosureSnapshot(db:Client,sprintId:string,teamId:string){
 const schemas=await db.query<{items:boolean;links:boolean;relations:boolean;selections:boolean;events:boolean;invalidated:boolean}>(`
 SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS items,
 to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS links,
 to_regclass('public.smn_registry_relation') IS NOT NULL AS relations,
 to_regclass('public.smn_fact_selection') IS NOT NULL AS selections,
 to_regclass('public.smn_automatic_highlight') IS NOT NULL AS events,
 EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
 AND table_name='smn_automatic_highlight' AND column_name='invalidated_at') AS invalidated`);
 const s=schemas.rows[0];
 if(!s?.items)return {state:"not-installed",capturedAt:new Date().toISOString(),items:[],relations:[],facts:[]};
 // Only explicit cycle associations: no fake membership inferred from dates.
 const rows=s.links?await db.query<{id:string;type:string;title:string;status:string;occurredOn:string;description:string|null;owner:string|null;dueOn:string|null;comment:string|null;revision:number;createdAt:string}>(`
 SELECT r.id,r.type,r.title,r.status,r.occurred_on::text AS "occurredOn",
 r.description,r.owner_name AS owner,r.due_on::text AS "dueOn",r.comment,r.revision,
 r.created_at::text AS "createdAt" FROM public.smn_registry_cycle_link l
 JOIN public.smn_registry_item r ON r.id=l.item_id
 WHERE l.sprint_id=$1 AND r.team_id=$2 ORDER BY r.type,r.id`,[sprintId,teamId]):{rows:[]};
 const items=rows.rows;
 const ids=items.map(r=>r.id);
 const relationRows=s.relations&&ids.length?await db.query(`
 SELECT id,source_id AS "sourceId",target_kind AS "targetKind",target_id AS "targetId",created_at::text AS "createdAt"
 FROM public.smn_registry_relation WHERE source_id=ANY($1::text[])
 OR (target_kind='record' AND target_id=ANY($1::text[])) ORDER BY id`,[ids]):{rows:[]};
 const selections=s.selections?"LEFT JOIN public.smn_fact_selection sel ON sel.origin='manual' AND sel.fact_id=r.id":"";
 const manual=ids.length?await db.query(`SELECT r.id,'manual'::text AS origin,r.title,r.occurred_on::text AS "effectiveOn",
 r.created_at::text AS "recordedAt",${s.selections?"COALESCE(sel.hidden,false)":"false"} AS hidden,
 ${s.selections?"COALESCE(sel.selected,true)":"true"} AS selected,
 ${s.selections?"COALESCE(sel.promoted,false)":"false"} AS promoted
 FROM public.smn_registry_item r ${selections} WHERE r.type='highlight' AND r.id=ANY($1::text[])
 ORDER BY r.id`,[ids]):{rows:[]};
 const auto=s.events&&ids.length?await db.query(`SELECT h.id,'automatic'::text AS origin,h.title,
 h.created_at::date::text AS "effectiveOn",h.created_at::text AS "recordedAt",
 h.category,h.source_kind AS "sourceKind",h.source_id AS "sourceId",h.source_revision AS "sourceRevision",
 ${s.invalidated?"h.invalidated_at IS NOT NULL":"false"} AS invalidated,
 ${s.selections?"COALESCE(sel.hidden,false)":"false"} AS hidden,
 ${s.selections?"COALESCE(sel.selected,true)":"true"} AS selected,
 ${s.selections?"COALESCE(sel.promoted,false)":"false"} AS promoted
 FROM public.smn_automatic_highlight h
 ${s.selections?"LEFT JOIN public.smn_fact_selection sel ON sel.origin='automatic' AND sel.fact_id=h.id":""}
 WHERE h.source_kind='registry' AND h.source_id=ANY($1::text[]) ORDER BY h.id`,[ids]):{rows:[]};
 return {state:s.links?"captured":"no-cycle-links",capturedAt:new Date().toISOString(),
 items,relations:relationRows.rows,facts:[...manual.rows,...auto.rows]};
}
