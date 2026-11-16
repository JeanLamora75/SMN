/** Explicit, metadata-only SMN-480 migration. No implicit writes on application reads. */
import {Client} from "pg";
import {readFileSync} from "node:fs";
import {installedDatabaseUri} from "../src/server/auth/database";
export async function migrateAiConnectionRegistry(db:Client,apply:boolean){
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261116,480)");
  const check=await db.query<{ready:boolean}>(`SELECT to_regclass('public.smn_ai_connection') IS NOT NULL AS ready`);
  if(!apply){await db.query("ROLLBACK");return {ready:check.rows[0]?.ready===true,applied:false};}
  const sql=readFileSync(new URL("../prisma/migrations/20261116_smn480_ai_connections/migration.sql",import.meta.url),"utf8");
  await db.query(sql);
  await db.query("COMMIT");
  return {ready:true,applied:true};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const arg=process.argv.slice(2);
 if(arg.length!==1||!["--check","--apply"].includes(arg[0]))throw Error("usage: --check|--apply");
 if(arg[0]==="--apply"&&process.env.SMN_AI_CONNECTION_BACKUP_VERIFIED!=="YES")
  throw Error("smn-480: verified backup required before upgrade");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{console.log(JSON.stringify(await migrateAiConnectionRegistry(db,arg[0]==="--apply"),null,2));}
 finally{await db.end();}
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-smn-480-ai-connections.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
