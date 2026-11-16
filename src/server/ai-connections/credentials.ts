import "server-only";
import type {Client} from "pg";
import {assertConnectionSchema} from "./registry";
import {storeAiCredential,purgeAiCredentialVersions} from "./vault";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
type Input={action:"replace"|"remove";id:string;revision:number;key?:string};
export function validateCredentialAction(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!["replace","remove"].includes(String(v.action))||typeof v.id!=="string"||!UUID.test(v.id)||
 !Number.isSafeInteger(v.revision)||Number(v.revision)<1)return null;
 if(v.action==="replace"&&(typeof v.key!=="string"||v.key.length<8||v.key.length>8192||
  v.key.trim()!==v.key||/[\r\n\0]/.test(v.key)))return null;
 if(v.action==="remove"&&v.key!==undefined)return null;
 return v as Input;
}
/** Only authenticated admin routes can invoke this; never return a secret. */
export async function mutateCredential(db:Client,raw:unknown){
 const v=validateCredentialAction(raw);
 if(!v)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 let created=false;
 try{
  await assertConnectionSchema(db);
  const selected=await db.query<{provider_id:string;revision:number}>(`
   SELECT provider_id,revision FROM public.smn_ai_connection
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[v.id]);
  const row=selected.rows[0];
  if(!row||row.revision!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict-or-not-found"};
  }
  const next=v.revision+1;
  if(v.action==="replace"){
   await storeAiCredential(v.id,row.provider_id,next,v.key!);
   created=true;
  }
  const updated=await db.query(`
   UPDATE public.smn_ai_connection SET credential_state=$2,
    enabled=false,last_test_status='never',last_test_at=NULL,
    revision=revision+1,updated_at=now()
   WHERE id=$1 AND revision=$3 AND installation_id='singleton' RETURNING id`,
   [v.id,v.action==="replace"?"configured":"missing",v.revision]);
  if(updated.rowCount!==1)throw Error("ai-secret-conflict");
  await db.query("COMMIT");
  // Cleanup failure is not a false success: the new revision remains authoritative,
  // and stale revisions are never read by the API.
  try{await purgeAiCredentialVersions(v.id,v.action==="replace"?next:undefined);}
  catch{return {ok:true as const,id:v.id,revision:next,cleanupPending:true};}
  return {ok:true as const,id:v.id,revision:next,cleanupPending:false};
 }catch{
  await db.query("ROLLBACK").catch(()=>undefined);
  if(created)await purgeAiCredentialVersions(v.id,v.revision).catch(()=>undefined);
  return {ok:false as const,error:"credential-unavailable"};
 }
}
