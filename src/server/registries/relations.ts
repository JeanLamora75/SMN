import {randomUUID} from "node:crypto";
import type {Client} from "pg";
const idRx=/^[a-f0-9-]{36}$/i;
export type RelationTarget={kind:"record"|"goal";id:string};
export function validRelationTarget(v:unknown):v is RelationTarget{
 return !!v&&typeof v==="object"&&!Array.isArray(v)&&
 Object.keys(v).sort().join(",")==="id,kind"&&
 (v as RelationTarget).kind==="record"&&idRx.test((v as RelationTarget).id)||
 !!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join(",")==="id,kind"&&
 (v as RelationTarget).kind==="goal"&&idRx.test((v as RelationTarget).id);
}
export async function ensureRelations(db:Client){
 await db.query("SELECT to_regclass('public.smn_registry_relation') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
 await db.query("SELECT to_regclass('public.smn_registry_relation_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
}
export async function readRelations(db:Client,recordId:string){
 if(!idRx.test(recordId))return null;
 const scope=await db.query<{teamId:string}>(`SELECT r.team_id AS "teamId" FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'`,[recordId]);
 if(scope.rows.length!==1)return null;
 const teamId=scope.rows[0].teamId;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_relation') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {relations:[]};
 const goals=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_sprint_goal') IS NOT NULL AS present`);
 const goalJoin=goals.rows[0]?.present?
  `LEFT JOIN public.smn_sprint_goal g ON l.target_kind='goal' AND g.id=l.target_id
   LEFT JOIN public.smn_sprint goal_sprint ON goal_sprint.id=g.sprint_id
    AND goal_sprint.team_id=$2 AND goal_sprint.deleted_at IS NULL`:
  `LEFT JOIN LATERAL (SELECT NULL::text AS id,NULL::text AS title,NULL::text AS sprint_id) g ON TRUE
   LEFT JOIN LATERAL (SELECT NULL::text AS id,NULL::text AS status) goal_sprint ON TRUE`;
 const rows=await db.query(`SELECT l.id,l.source_id AS "sourceId",l.target_kind AS "targetKind",l.target_id AS "targetId",
 s.title AS "sourceTitle",s.type AS "sourceType",s.status AS "sourceStatus",
 COALESCE(r.title,g.title) AS "targetTitle",
 CASE WHEN l.target_kind='record' THEN r.type ELSE 'goal' END AS "targetType",
 CASE WHEN l.target_kind='record' THEN r.status ELSE NULL END AS "targetStatus",
 goal_sprint.status AS "targetCycleStatus",
 CASE WHEN l.target_kind='goal' THEN g.sprint_id ELSE NULL END AS "targetGoalSprintId"
 FROM public.smn_registry_relation l
 JOIN public.smn_registry_item s ON s.id=l.source_id AND s.team_id=$2
 LEFT JOIN public.smn_registry_item r ON l.target_kind='record'
  AND r.id=l.target_id AND r.team_id=$2
 ${goalJoin}
 WHERE (l.source_id=$1 OR (l.target_kind='record' AND l.target_id=$1))
 AND ((l.target_kind='record' AND r.id IS NOT NULL)
   OR (l.target_kind='goal' AND g.id IS NOT NULL AND goal_sprint.id IS NOT NULL))
 ORDER BY l.created_at,l.id`,[recordId,teamId]);
 return {relations:rows.rows};
}
export async function changeRelation(db:Client,actorId:string,sourceId:string,target:RelationTarget,action:"linked"|"unlinked"){
 if(!actorId||!idRx.test(sourceId)||!validRelationTarget(target)||sourceId===target.id)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const source=await db.query<{team_id:string;type:string}>(`SELECT r.team_id,r.type FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[sourceId]);
  if(source.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  const s=source.rows[0];
  if(target.kind==="goal"&&s.type!=="action"){await db.query("ROLLBACK");return {ok:false as const,error:"incompatible" as const};}
  const targetSql=target.kind==="record"?
   `SELECT r.id,r.type FROM public.smn_registry_item r WHERE r.id=$1 AND r.team_id=$2`:
   `SELECT g.id,g.evaluation FROM public.smn_sprint_goal g JOIN public.smn_sprint x ON x.id=g.sprint_id
     WHERE g.id=$1 AND x.team_id=$2 AND x.deleted_at IS NULL AND x.status<>'closed'`;
  const other=await db.query(targetSql,[target.id,s.team_id]);
  if(other.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureRelations(db);
  if(target.kind==="record"&&action==="linked"){
   const inverse=await db.query(`SELECT 1 FROM public.smn_registry_relation
    WHERE source_id=$1 AND target_kind='record' AND target_id=$2`,[target.id,sourceId]);
   if(inverse.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"cycle" as const};}
  }
  const existing=await db.query(`SELECT id FROM public.smn_registry_relation WHERE source_id=$1 AND target_kind=$2 AND target_id=$3`,[sourceId,target.kind,target.id]);
  if((action==="linked")===(existing.rows.length>0)){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(action==="linked")await db.query(`INSERT INTO public.smn_registry_relation(id,source_id,target_kind,target_id) VALUES($1,$2,$3,$4)`,
   [randomUUID(),sourceId,target.kind,target.id]);
  else await db.query(`DELETE FROM public.smn_registry_relation WHERE source_id=$1 AND target_kind=$2 AND target_id=$3`,[sourceId,target.kind,target.id]);
  await db.query(`INSERT INTO public.smn_registry_relation_audit(id,source_id,target_kind,target_id,action,actor_id) VALUES($1,$2,$3,$4,$5,$6)`,
   [randomUUID(),sourceId,target.kind,target.id,action,actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
