import type {Client} from "pg";
import {registryTypes,type RegistryType} from "@/lib/registry-types";
type Kind="record"|"goal";
export type CandidateQuery={kind:Kind;types:RegistryType[];search:string};
const idRx=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function parseRelationSearch(params:URLSearchParams):CandidateQuery|null{
 const kind=params.get("kind")??"record",search=(params.get("search")??"").trim(),
  types=(params.get("types")??"").split(",").filter(Boolean);
 if([...params.keys()].some(k=>!["kind","search","types"].includes(k))||
  (kind!=="record"&&kind!=="goal")||search.length>120||
  (kind==="goal"&&types.length>0)||types.length>registryTypes.length||
  new Set(types).size!==types.length||
  types.some(type=>!registryTypes.some(t=>t===type)))return null;
 return {kind,types:types as RegistryType[],search};
}

/** Queries are scoped to the current record's installed team and return only stored IDs.
 * No DDL, no mutations, and no client-supplied team identifier.
 */
export async function readRelationCandidates(db:Client,id:string,filter:CandidateQuery){
 if(!idRx.test(id))return null;
 const base=await db.query<{team_id:string;type:RegistryType}>(`SELECT r.team_id,r.type
  FROM public.smn_registry_item r
  JOIN public.smn_team t ON t.id=r.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'
   AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode')) IN ('scrum','kanban')`,[id]);
 const source=base.rows[0];
 if(!source)return null;
 if(filter.kind==="goal"&&source.type!=="action")return null;
 const table=filter.kind==="goal"?"smn_sprint_goal":"smn_registry_item";
 const reg=await db.query<{present:boolean}>(`SELECT to_regclass($1) IS NOT NULL AS present`,
  ["public."+table]);
 if(!reg.rows[0]?.present)return {state:"unavailable" as const};
 const escaped=filter.search.replace(/[\\%_]/g,c=>"\\"+c);
 const pattern="%"+escaped+"%";
 if(filter.kind==="record"){
  const result=await db.query<{id:string;title:string;type:RegistryType;status:string}>(`
   SELECT r.id,r.title,r.type,r.status FROM public.smn_registry_item r
   WHERE r.team_id=$1 AND r.id<>$2
    AND r.title ILIKE $3 ESCAPE '\\'
    AND (cardinality($4::text[])=0 OR r.type=ANY($4::text[]))
   ORDER BY r.title ASC,r.id ASC LIMIT 25`,[source.team_id,id,pattern,filter.types]);
  return {state:"available" as const,items:result.rows};
 }
 const sprint=await db.query<{present:boolean}>(`SELECT
  to_regclass('public.smn_sprint') IS NOT NULL AS present`);
 if(!sprint.rows[0]?.present)return {state:"unavailable" as const};
 const result=await db.query<{id:string;title:string;type:"goal"}>(`
  SELECT g.id,g.title,'goal'::text AS type
  FROM public.smn_sprint_goal g JOIN public.smn_sprint s ON s.id=g.sprint_id
  WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status<>'closed'
   AND g.title ILIKE $2 ESCAPE '\\'
  ORDER BY g.title ASC,g.id ASC LIMIT 25`,[source.team_id,pattern]);
 return {state:"available" as const,items:result.rows};
}
