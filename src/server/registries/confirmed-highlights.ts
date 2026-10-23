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
