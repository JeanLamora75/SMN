import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {readAutomaticHighlightSettings} from "./automatic-highlights";
import type {AutomaticHighlightCategory} from "@/lib/automatic-highlights";
export async function recordConfirmedHighlight(db:Client,input:{
 category:AutomaticHighlightCategory;sourceKind:"registry"|"goal";sourceId:string;
 sourceRevision:number;title:string;actorId:string
}){
 const settings=await readAutomaticHighlightSettings(db);
 if(!settings.categories[input.category])return false;
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_automatic_highlight(
 id text PRIMARY KEY,category text NOT NULL,source_kind text NOT NULL,
 source_id text NOT NULL,source_revision integer NOT NULL CHECK(source_revision>0),
 title text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 UNIQUE(category,source_kind,source_id,source_revision))`);
 const saved=await db.query(`INSERT INTO public.smn_automatic_highlight
 (id,category,source_kind,source_id,source_revision,title,actor_id)
 VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,
 [randomUUID(),input.category,input.sourceKind,input.sourceId,input.sourceRevision,input.title,input.actorId]);
 return saved.rows.length===1;
}
export async function riskCriticalEvent(db:Client,id:string,actorId:string,sourceRevision:number){
 const available=await db.query<{assess:boolean;roam:boolean}>(`SELECT to_regclass('public.smn_risk_assessment') IS NOT NULL AS assess,to_regclass('public.smn_risk_roam') IS NOT NULL AS roam`);
 if(!available.rows[0]?.assess)return false;
 const roamJoin=available.rows[0].roam?"LEFT JOIN public.smn_risk_roam m ON m.item_id=r.id":"LEFT JOIN LATERAL (SELECT NULL::text AS classification) m ON TRUE";
 const result=await db.query<{title:string;probability:number|null;impact:number|null;roam:string|null}>(`
 SELECT r.title,a.probability,a.impact,m.classification AS roam
 FROM public.smn_registry_item r
 LEFT JOIN public.smn_risk_assessment a ON a.item_id=r.id
 ${roamJoin}
 WHERE r.id=$1 AND r.type='risk'`,[id]);
 const row=result.rows[0];
 if(!row||row.roam==="resolved"||row.probability===null||row.impact===null||row.probability*row.impact<6)return false;
 return recordConfirmedHighlight(db,{category:"criticalRisk",sourceKind:"registry",sourceId:id,sourceRevision,title:row.title,actorId});
}

export async function readConfirmedHighlights(db:Client,teamId?:string){
 const version=await db.query<{schema_version:number}>(
  "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 const schema=version.rows[0]?.schema_version;
 if(!Number.isSafeInteger(schema)||schema===undefined||schema<1||schema>29)
  throw Error("highlights-schema-unavailable");
 if(schema>=28&&(!teamId||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(teamId)))
  throw Error("highlights-team-required");
 const tables=await db.query<{events:boolean;goals:boolean}>(`SELECT
 to_regclass('public.smn_automatic_highlight') IS NOT NULL AS events,
 to_regclass('public.smn_sprint_goal') IS NOT NULL AS goals`);
 if(!tables.rows[0]?.events)return [];
 const columns=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidated_at') AS present`);
 const invalidationColumn=columns.rows[0]?.present===true;
 const goalScope=tables.rows[0].goals?`OR (h.source_kind='goal' AND EXISTS(
 SELECT 1 FROM public.smn_sprint_goal g JOIN public.smn_sprint s ON s.id=g.sprint_id
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE g.id=h.source_id AND i.id='singleton' AND i.state='initialized' AND ($1::text IS NULL OR s.team_id=$1)))`:"";
 const rows=await db.query<{id:string;category:string;sourceKind:string;sourceId:string;title:string;recordedAt:string}>(`SELECT
 h.id,h.category,h.source_kind AS "sourceKind",h.source_id AS "sourceId",
 h.title,h.created_at::text AS "recordedAt",h.source_revision AS "sourceRevision",
 ${invalidationColumn?`h.invalidated_at::text AS "invalidatedAt",h.invalidation_reason AS "invalidationReason"`:`NULL::text AS "invalidatedAt",NULL::text AS "invalidationReason"`} FROM public.smn_automatic_highlight h
 WHERE (h.source_kind='registry' AND EXISTS(
 SELECT 1 FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=h.source_id AND i.id='singleton' AND i.state='initialized' AND ($1::text IS NULL OR r.team_id=$1)))
 ${goalScope} ORDER BY h.created_at DESC,h.id DESC LIMIT 250`,[teamId??null]);
 return rows.rows;
}
