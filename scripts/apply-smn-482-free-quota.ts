import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {Client as PgClient} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
export async function applySmn482(db:Client,apply:boolean){
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261116,482)");
  const found=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_ai_connection') IS NOT NULL AS exists`);
  if(!found.rows[0]?.exists)throw Error("smn-482:smn-480-required");
  const installed=await db.query<{ready:boolean}>(`SELECT to_regclass('public.smn_ai_free_request_quota') IS NOT NULL AS ready`);
  if(!apply){await db.query("ROLLBACK");return {ready:installed.rows[0]?.ready===true};}
  await db.query(readFileSync(new URL("../prisma/migrations/20261116_smn482_free_quota/migration.sql",import.meta.url),"utf8"));
  await db.query("COMMIT");
  return {ready:true,applied:true};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--check","--apply"].includes(args[0]))throw Error("usage: --check|--apply");
 if(args[0]==="--apply"&&process.env.SMN_AI_FREE_QUOTA_BACKUP_VERIFIED!=="YES")
  throw Error("smn-482:verified-backup-required");
 const db=new PgClient({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500});
 await db.connect();
 try{console.log(JSON.stringify(await applySmn482(db,args[0]==="--apply"),null,2));}
 finally{await db.end();}
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-smn-482-free-quota.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
