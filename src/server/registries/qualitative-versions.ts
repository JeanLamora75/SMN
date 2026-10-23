import type {Client} from "pg";
import {qualitativeClosureSnapshot} from "@/server/registries/closure-snapshot";
export async function readQualitativeVersion(db:Client,teamId:string,sprintId:string,version:number|null){
 const scope=await db.query<{status:string}>(`SELECT s.status FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL AND
 i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[sprintId,teamId]);
 if(scope.rows.length!==1)return null;
 const status=scope.rows[0].status;
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS exists`);
 const versions=present.rows[0]?.exists?await db.query<{version:number;closedAt:string}>(`SELECT version,closed_at::text AS "closedAt"
 FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC`,[sprintId]):{rows:[]};
 if(version!==null||status==="closed"){
  const chosen=version??versions.rows[0]?.version;
  if(!chosen)return {status,state:"history-missing",versions:versions.rows,version:null,qualitative:null};
  const row=await db.query<{snapshot:unknown;version:number;closedAt:string}>(`
   SELECT snapshot,version,closed_at::text AS "closedAt" FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 AND version=$2`,[sprintId,chosen]);
  if(!row.rows.length)return {status,state:"version-not-found",versions:versions.rows,version:chosen,qualitative:null};
  const snap=row.rows[0].snapshot;
  const value=snap&&typeof snap==="object"&&!Array.isArray(snap)?
   (snap as {qualitative?:unknown}).qualitative:undefined;
  return {status,state:value?"snapshot":"qualitative-missing",versions:versions.rows,version:chosen,qualitative:value??null,closedAt:row.rows[0].closedAt};
 }
 const qualitative=await qualitativeClosureSnapshot(db,sprintId,teamId);
 return {status,state:"current",versions:versions.rows,version:null,qualitative};
}
