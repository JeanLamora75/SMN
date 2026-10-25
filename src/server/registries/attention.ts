import type {Client} from "pg";
import {deadlineState} from "@/lib/registry-deadlines";
import {criticality,type Level} from "@/lib/risk-criticality";
import {readDeadlineSettings} from "./deadlines";
export type Attention={id:string;type:string;title:string;status:string;reason:string;dueOn:string|null};
export function riskAttention(probability:Level|null,impact:Level|null,roam:string|null):boolean{
 return criticality(probability,impact).level==="high"&&roam!=="resolved";
}
export async function readAttention(db:Client,teamId:string,cycleId:string|null,today:string){
 const threshold=await readDeadlineSettings(db);
 const tables=await db.query<{item:boolean;assess:boolean;roam:boolean;vigilance:boolean;links:boolean}>([
 "SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS item,",
 "to_regclass('public.smn_risk_assessment') IS NOT NULL AS assess,",
 "to_regclass('public.smn_risk_roam') IS NOT NULL AS roam,",
 "to_regclass('public.smn_dependency_vigilance') IS NOT NULL AS vigilance,",
 "to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS links"].join(" "));
 const t=tables.rows[0];
 if(!t?.item)return {state:"unavailable" as const,reason:"registry-not-installed" as const};
 const assessment=t.assess?"LEFT JOIN public.smn_risk_assessment a ON a.item_id=r.id":"LEFT JOIN LATERAL (SELECT NULL::smallint AS probability,NULL::smallint AS impact) a ON TRUE";
 const roam=t.roam?"LEFT JOIN public.smn_risk_roam m ON m.item_id=r.id":"LEFT JOIN LATERAL (SELECT NULL::text AS classification) m ON TRUE";
 const vigilance=t.vigilance?"LEFT JOIN public.smn_dependency_vigilance v ON v.item_id=r.id":"LEFT JOIN LATERAL (SELECT false AS at_risk) v ON TRUE";
 const linkClause=cycleId&&t.links?"AND EXISTS(SELECT 1 FROM public.smn_registry_cycle_link l WHERE l.item_id=r.id AND l.sprint_id=$2)":"";
 const sql=["SELECT r.id,r.type,r.title,r.status,r.due_on::text AS \"dueOn\",",
 "a.probability,a.impact,m.classification AS roam,COALESCE(v.at_risk,false) AS \"atRisk\"",
 "FROM public.smn_registry_item r",assessment,roam,vigilance,
 "WHERE r.team_id=$1",linkClause,"AND r.type IN ('risk','obstacle','dependency','action')",
 "ORDER BY r.occurred_on DESC,r.id"].join(" ");
 const rows=await db.query<{id:string;type:string;title:string;status:string;dueOn:string|null;probability:Level|null;impact:Level|null;roam:string|null;atRisk:boolean}>(sql,cycleId&&t.links?[teamId,cycleId]:[teamId]);
 const alerts:Attention[]=[];
 for(const r of rows.rows){
  if(r.type==="risk"&&r.status==="open"&&riskAttention(r.probability,r.impact,r.roam))
   alerts.push({id:r.id,type:r.type,title:r.title,status:r.status,reason:"highRisk",dueOn:null});
  if(r.type==="obstacle"&&(r.status==="open"||r.status==="in_progress"))
   alerts.push({id:r.id,type:r.type,title:r.title,status:r.status,reason:"obstacle",dueOn:null});
  if(r.type==="dependency"&&r.atRisk&&(r.status==="open"||r.status==="in_progress"))
   alerts.push({id:r.id,type:r.type,title:r.title,status:r.status,reason:"atRisk",dueOn:null});
  const deadline=deadlineState(r.type,r.status,r.dueOn,today,threshold.days);
  if(deadline)alerts.push({id:r.id,type:r.type,title:r.title,status:r.status,reason:deadline,dueOn:r.dueOn});
 }
 return {state:"available" as const,alerts,days:threshold.days};
}
