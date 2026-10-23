import type {Client} from "pg";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
export type RegistryFilters={type:RegistryType;search:string;status:string;owner:string;page:number};
export function parseRegistryFilters(params:URLSearchParams):RegistryFilters|null{
 const type=params.get("type")??"risk",search=(params.get("search")??"").trim(),status=params.get("status")??"",
 owner=(params.get("owner")??"").trim(),page=Number(params.get("page")??"1");
 if(!registryTypes.some(t=>t===type)||search.length>120||owner.length>200||
  !Number.isSafeInteger(page)||page<1||page>100000||
  (status!==""&&!registryStatuses[type as RegistryType].some(s=>s===status)))return null;
 return {type:type as RegistryType,search,status,owner,page};
}
export async function readRegistryPage(db:Client,filters:RegistryFilters,canSeeOwner:boolean){
 // A missing source must not be represented as an empty register.
 const installed=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS present`);
 if(!installed.rows[0]?.present)return {state:"unavailable" as const,reason:"not-installed" as const};
 const team=await db.query<{id:string;name:string}>(`SELECT t.id,t.name FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban') LIMIT 2`);
 if(team.rows.length!==1)return {state:"unavailable" as const,reason:"team-unavailable" as const};
 if(filters.owner&&!canSeeOwner)return {state:"forbidden" as const};
 const values=[team.rows[0].id,filters.type,"%"+filters.search+"%",filters.status,
  "%"+filters.owner+"%"];
 const where=`r.team_id=$1 AND r.type=$2
  AND ($3='%%' OR r.title ILIKE $3 OR COALESCE(r.description,'') ILIKE $3)
  AND ($4='' OR r.status=$4)
  AND ($5='%%' OR COALESCE(r.owner_name,'') ILIKE $5)`;
 const count=await db.query<{total:number}>(`SELECT COUNT(*)::int AS total FROM public.smn_registry_item r WHERE ${where}`,values);
 const total=count.rows[0]?.total??0,pageSize=25,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(filters.page,totalPages);
 const rows=await db.query(`SELECT r.id,r.type,r.title,r.status,r.occurred_on::text AS "occurredOn",
  r.due_on::text AS "dueOn" ${canSeeOwner?',r.owner_name AS "owner"':''}
  FROM public.smn_registry_item r WHERE ${where}
  ORDER BY r.occurred_on DESC,r.id ASC LIMIT 25 OFFSET $6`,[...values,(page-1)*pageSize]);
 return {state:"available" as const,team:team.rows[0],items:rows.rows,
  total,page,pageSize,totalPages,
  filters:{...filters,owner:canSeeOwner?filters.owner:""}};
}
