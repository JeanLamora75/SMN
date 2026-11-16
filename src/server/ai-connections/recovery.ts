import "server-only";
import {lstat,readdir,rm} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {assertConnectionSchema} from "./registry";

/** Explicit administrative recovery, never automatic and never exposed as GET. */
export async function resetAiVault(db:Client,confirmation:unknown){
 if(confirmation!=="RESET_AI_VAULT")return {ok:false as const,error:"confirmation-required"};
 await db.query("BEGIN");
 try{
  await assertConnectionSchema(db);
  await db.query("LOCK TABLE public.smn_ai_connection IN EXCLUSIVE MODE");
  const root=resolve(process.cwd(),"data","ai-secrets");
  const folder=await lstat(root).catch(()=>null);
  if(folder){
   if(!folder.isDirectory()||folder.isSymbolicLink())throw Error("ai-vault-unavailable");
   const items=await readdir(root);
   if(items.some(name=>name!==".vault-master-v1"&&!/^[a-f0-9-]{36}\.\d+\.enc$/i.test(name)))
    throw Error("ai-vault-untrusted-entry");
   for(const name of items){
    const path=join(root,name),stat=await lstat(path);
    if(!stat.isFile()||stat.isSymbolicLink())throw Error("ai-vault-untrusted-entry");
   }
   // Invalidate all credentials in the current transaction before deleting disk secrets.
   await db.query(`UPDATE public.smn_ai_connection
    SET enabled=false,credential_state='missing',last_test_status='never',
    last_test_at=NULL,revision=revision+1,updated_at=now()
    WHERE installation_id='singleton'`);
   // Delete encrypted data first and the master last; interrupted reset is fail closed.
   for(const name of items.filter(n=>n!==".vault-master-v1"))await rm(join(root,name));
   if(items.includes(".vault-master-v1"))await rm(join(root,".vault-master-v1"));
  }else{
   await db.query(`UPDATE public.smn_ai_connection
    SET enabled=false,credential_state='missing',last_test_status='never',
    last_test_at=NULL,revision=revision+1,updated_at=now()
    WHERE installation_id='singleton'`);
  }
  await db.query("COMMIT");
  return {ok:true as const,reset:true};
 }catch{
  await db.query("ROLLBACK").catch(()=>undefined);
  return {ok:false as const,error:"vault-reset-failed"};
 }
}
