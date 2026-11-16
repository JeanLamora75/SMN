import "server-only";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {purgeAiCredentialVersions} from "./vault";

export const AI_PROVIDERS = ["gemini","groq","openrouter"] as const;
export type AiProvider=typeof AI_PROVIDERS[number];
export type AiConnection={
 id:string;label:string;providerId:AiProvider;modelId:string|null;enabled:boolean;
 credentialState:"missing"|"configured"|"invalid";
 lastTestStatus:"never"|"passed"|"failed"|"quota"|"unavailable";
 lastTestAt:string|null;revision:number;createdAt:string;updatedAt:string;
};
type Action="create"|"update"|"disable"|"delete";
type Input={action:Action;id?:string;revision?:number;label?:string;providerId?:AiProvider;modelId?:string|null};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validLabel=(x:unknown):x is string=>typeof x==="string"&&x.trim().length>0&&x.length<=120;
const validModel=(x:unknown)=>x===null||typeof x==="string"&&x.length<=160;
export function validateAiConnectionAction(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!["create","update","disable","delete"].includes(String(v.action)))return null;
 if(v.action==="create"||v.action==="update"){
  if(!validLabel(v.label)||!AI_PROVIDERS.includes(v.providerId as AiProvider)||!validModel(v.modelId??null))return null;
 }
 if(v.action!=="create"&&(!UUID.test(String(v.id??""))||!Number.isSafeInteger(v.revision)||Number(v.revision)<1))return null;
 return v as Input;
}
export async function assertConnectionSchema(db:Client){
 const result=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_connection') IS NOT NULL AS present`);
 if(!result.rows[0]?.present)throw Error("smn-480-migration-required");
}
const select=`SELECT id::text,label,provider_id AS "providerId",model_id AS "modelId",
 enabled,credential_state AS "credentialState",last_test_status AS "lastTestStatus",
 last_test_at::text AS "lastTestAt",revision,created_at::text AS "createdAt",
 updated_at::text AS "updatedAt" FROM public.smn_ai_connection`;
export async function listAiConnections(db:Client):Promise<AiConnection[]>{
 await assertConnectionSchema(db);
 const rows=await db.query<AiConnection>(select+` WHERE installation_id='singleton' ORDER BY created_at,id`);
 return rows.rows;
}
/** Metadata management only. SMN-481 will own credential writes and activation. */
export async function mutateAiConnection(db:Client,raw:unknown){
 const v=validateAiConnectionAction(raw);
 if(!v)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  await assertConnectionSchema(db);
  const install=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
  if(install.rowCount!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(v.action==="create"){
   const id=randomUUID();
   await db.query(`INSERT INTO public.smn_ai_connection(id,installation_id,label,provider_id,model_id)
    VALUES($1,'singleton',$2,$3,$4)`,[id,v.label!.trim(),v.providerId,v.modelId||null]);
   await db.query("COMMIT");return {ok:true as const,id,revision:1};
  }
  const updated=v.action==="update"
   ?await db.query(`UPDATE public.smn_ai_connection SET label=$2,provider_id=$3,model_id=$4,
    enabled=false,credential_state='missing',last_test_status='never',last_test_at=NULL,
    revision=revision+1,updated_at=now()
    WHERE id=$1 AND installation_id='singleton' AND revision=$5 RETURNING id,revision`,
    [v.id,v.label!.trim(),v.providerId,v.modelId||null,v.revision])
   :v.action==="disable"
   ?await db.query(`UPDATE public.smn_ai_connection SET enabled=false,revision=revision+1,updated_at=now()
    WHERE id=$1 AND installation_id='singleton' AND revision=$2 RETURNING id,revision`,[v.id,v.revision])
   :await db.query(`DELETE FROM public.smn_ai_connection WHERE id=$1
    AND installation_id='singleton' AND revision=$2 RETURNING id,revision`,[v.id,v.revision]);
  if(!updated.rowCount){await db.query("ROLLBACK");return {ok:false as const,error:"conflict-or-not-found"};}
  await db.query("COMMIT");
  // Updating a connection deliberately requires re-entering its key.
  // Removing/deleting cannot leave an old credential in the active vault.
  if(v.action!=="disable"){
   try{await purgeAiCredentialVersions(v.id!);}
   catch{return {ok:true as const,id:v.id!,revision:v.action==="delete"?null:v.revision!+1,cleanupPending:true};}
  }
  return {ok:true as const,id:v.id!,revision:v.action==="delete"?null:v.revision!+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
