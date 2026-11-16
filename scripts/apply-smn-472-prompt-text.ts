/** Explicit transactional schema upgrade; never run implicitly during a user session. */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {convertLegacyPrompt,isValidPromptText} from "../src/lib/ai-brief-prompt";

export async function applySmn472(db:Client,apply:boolean){
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(472)");
  const found=await db.query<{exists:boolean}>(
   "SELECT to_regclass('public.smn_ai_brief_template') IS NOT NULL AS exists");
  if(!found.rows[0]?.exists)throw Error("smn-472: table des modèles absente — initialiser SMN avant la migration");
  if(apply)await db.query("ALTER TABLE public.smn_ai_brief_template ADD COLUMN IF NOT EXISTS prompt_text TEXT");
  const column=await db.query<{exists:boolean}>(`SELECT EXISTS(
   SELECT 1 FROM information_schema.columns WHERE table_schema='public'
   AND table_name='smn_ai_brief_template' AND column_name='prompt_text') AS exists`);
  if(!column.rows[0]?.exists){
   await db.query("ROLLBACK");
   return {ready:false,reason:"migration-required",pending:null};
  }
  const legacyColumns=await db.query<{column_name:string}>(`
   SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='smn_ai_brief_template'
   AND column_name=ANY($1::text[])`,[["sections","questions","instructions","data","depth"]]);
  if(legacyColumns.rows.length===0){
   const missing=await db.query<{n:string}>(`SELECT count(*)::text AS n
    FROM public.smn_ai_brief_template
    WHERE prompt_text IS NULL OR btrim(prompt_text)=''`);
   if(Number(missing.rows[0].n)!==0)throw Error("smn-472: prompt_text incomplet dans le schéma nettoyé");
   await db.query("ROLLBACK");
   return {ready:true,pending:0,applied:false,alreadyClean:true};
  }
  if(legacyColumns.rows.length!==5)throw Error("smn-472: schéma partiellement migré ou corrompu");
  const rows=await db.query<{id:string;title:string;prompt_text:string|null;sections:string[];questions:string[];instructions:string[];data:string[];depth:number}>(`
   SELECT id::text,title,prompt_text,sections,questions,instructions,data,depth
   FROM public.smn_ai_brief_template ORDER BY id FOR UPDATE`);
  let pending=0;
  for(const row of rows.rows){
   if(isValidPromptText(row.prompt_text))continue;
   if(row.prompt_text!==null && row.prompt_text.trim().length)throw Error("smn-472: prompt_text invalide: "+row.id);
   const converted=convertLegacyPrompt(row);
   if(!isValidPromptText(converted))throw Error("smn-472: conversion invalide: "+row.id);
   pending++;
   if(apply)await db.query(`UPDATE public.smn_ai_brief_template SET prompt_text=$2
    WHERE id=$1 AND (prompt_text IS NULL OR btrim(prompt_text)='')`,[row.id,converted]);
  }
  if(apply){
   const missing=await db.query<{count:string}>(`SELECT count(*)::text AS count FROM public.smn_ai_brief_template
    WHERE prompt_text IS NULL OR btrim(prompt_text)=''`);
   if(Number(missing.rows[0].count)>0)throw Error("smn-472: backfill incomplet");
   await db.query("COMMIT");
  }else await db.query("ROLLBACK");
  return {ready:true,pending,applied:apply};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--apply","--check"].includes(args[0]))
  throw Error("Usage: pnpm exec tsx scripts/apply-smn-472-prompt-text.ts --check|--apply");
 if(args[0]==="--apply"&&process.env.SMN_AI_BRIEF_BACKUP_VERIFIED!=="YES")
  throw Error("smn-472: sauvegarde vérifiée obligatoire (SMN_AI_BRIEF_BACKUP_VERIFIED=YES)");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500});
 await db.connect();
 try{console.log(JSON.stringify(await applySmn472(db,args[0]==="--apply"),null,2))}
 finally{await db.end();}
}
if(process.argv[1]?.includes("apply-smn-472-prompt-text"))main().catch(e=>{
 console.error(e instanceof Error?e.message:String(e));process.exitCode=1;
});
