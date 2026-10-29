import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {briefArchiveIdValid,readPrivateBriefArchive} from "./library";

export type ManualAiResponse={id:string;archive_id:string;team_id:string;response_text:string;provider:string|null;model:string|null;created_at:string;updated_at:string;author_id:string;human_edited:boolean};
export function validManualAiResponse(raw:unknown):raw is {text:string;provider?:string|null;model?:string|null}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 return typeof x.text==="string"&&x.text.trim().length>0&&Buffer.byteLength(x.text,"utf8")<=250000&&
  (x.provider===undefined||x.provider===null||typeof x.provider==="string"&&x.provider.length<=120)&&
  (x.model===undefined||x.model===null||typeof x.model==="string"&&x.model.length<=120);
}
const optional=(x:string|null|undefined)=>x?.trim()||null;
async function ensureResponseSchema(db:Client){
 await assertAiBriefSchema(db,"responses");
 await assertAiBriefSchema(db,"responses");
 await assertAiBriefSchema(db,"responses");
 await assertAiBriefSchema(db,"responses");
 await assertAiBriefSchema(db,"responses");
}
export async function listManualAiResponses(db:Client,archiveId:string,teamId:string):Promise<ManualAiResponse[]>{
 if(!briefArchiveIdValid(archiveId))return [];
 const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_response') IS NOT NULL AS present`);
 if(!table.rows[0]?.present)return [];
 await ensureResponseSchema(db);
 const r=await db.query<ManualAiResponse>(`SELECT r.id::text,r.archive_id::text,r.team_id,r.response_text,r.provider,r.model,
  r.created_at::text,r.updated_at::text,r.author_id,r.human_edited FROM public.smn_ai_brief_response r
  INNER JOIN public.smn_ai_brief_archive a ON a.id=r.archive_id
  WHERE r.archive_id=$1 AND r.team_id=$2 AND a.team_id=$2 AND r.deleted_at IS NULL
  ORDER BY r.created_at DESC,r.id DESC`,[archiveId,teamId]);
 return r.rows;
}
export async function saveManualAiResponse(db:Client,archiveId:string,teamId:string,actorId:string,raw:unknown){
 if(!briefArchiveIdValid(archiveId)||!validManualAiResponse(raw))return {ok:false as const,error:"invalid-input"};
 const x=raw as {text:string;provider?:string|null;model?:string|null};
 await db.query("BEGIN");
 try{
  const archive=await readPrivateBriefArchive(db,archiveId,teamId);
  if(archive.state!=="ok"){await db.query("ROLLBACK");return {ok:false as const,error:archive.state};}
  await ensureResponseSchema(db);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_ai_brief_response
   (id,archive_id,team_id,author_id,response_text,provider,model) VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [id,archiveId,teamId,actorId,x.text,optional(x.provider),optional(x.model)]);
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);
  if((e as {code?:string}).code==="23505")return {ok:false as const,error:"already-active"};
  throw e;}
}
export async function changeManualAiResponse(db:Client,archiveId:string,teamId:string,responseId:string,action:"update"|"delete",raw:unknown){
 if(!briefArchiveIdValid(archiveId)||!briefArchiveIdValid(responseId))return {ok:false as const,error:"invalid-input"};
 if(action==="update"&&!validManualAiResponse(raw))return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  await ensureResponseSchema(db);
  const x=raw as {text:string;provider?:string|null;model?:string|null};
  const result=action==="delete"?
   await db.query(`UPDATE public.smn_ai_brief_response SET deleted_at=now(),updated_at=now()
    WHERE id=$1 AND archive_id=$2 AND team_id=$3 AND deleted_at IS NULL RETURNING id`,[responseId,archiveId,teamId]):
   await db.query(`UPDATE public.smn_ai_brief_response SET response_text=$4,provider=$5,model=$6,updated_at=now(),human_edited=true
    WHERE id=$1 AND archive_id=$2 AND team_id=$3 AND deleted_at IS NULL RETURNING id`,
    [responseId,archiveId,teamId,x.text,optional(x.provider),optional(x.model)]);
  if(!result.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("COMMIT");return {ok:true as const,id:responseId};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
