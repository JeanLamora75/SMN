import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {briefArchiveIdValid,readPrivateBriefArchive} from "./library";

export type ManualAiResponse={id:string;archive_id:string;team_id:string;response_text:string;provider:string|null;model:string|null;created_at:string;author_id:string};
export function validManualAiResponse(raw:unknown):raw is {text:string;provider?:string|null;model?:string|null}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 return typeof x.text==="string"&&x.text.trim().length>0&&Buffer.byteLength(x.text,"utf8")<=250000&&
  (x.provider===undefined||x.provider===null||typeof x.provider==="string"&&x.provider.length<=120)&&
  (x.model===undefined||x.model===null||typeof x.model==="string"&&x.model.length<=120);
}
const optional=(x:string|null|undefined)=>x?.trim()||null;
export async function listManualAiResponses(db:Client,archiveId:string,teamId:string):Promise<ManualAiResponse[]>{
 if(!briefArchiveIdValid(archiveId))return [];
 const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_response') IS NOT NULL AS present`);
 if(!table.rows[0]?.present)return [];
 const r=await db.query<ManualAiResponse>(`SELECT r.id::text,r.archive_id::text,r.team_id,r.response_text,r.provider,r.model,
  r.created_at::text,r.author_id FROM public.smn_ai_brief_response r
  INNER JOIN public.smn_ai_brief_archive a ON a.id=r.archive_id
  WHERE r.archive_id=$1 AND r.team_id=$2 AND a.team_id=$2
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
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_ai_brief_response(
   id uuid PRIMARY KEY,archive_id uuid NOT NULL REFERENCES public.smn_ai_brief_archive(id) ON DELETE RESTRICT,
   team_id text NOT NULL,author_id text NOT NULL,response_text text NOT NULL,
   provider text,model text,created_at timestamptz NOT NULL DEFAULT now(),
   CHECK(length(btrim(response_text))>0)
  )`);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_ai_brief_response
   (id,archive_id,team_id,author_id,response_text,provider,model) VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [id,archiveId,teamId,actorId,x.text,optional(x.provider),optional(x.model)]);
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
