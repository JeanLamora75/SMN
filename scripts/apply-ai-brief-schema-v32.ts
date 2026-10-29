import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const file=new URL("../prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql",import.meta.url);
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-ai-brief-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,48)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation initialisée v32 requise");
   await db.query(readFileSync(file,"utf8"));
   const tables=["smn_ai_brief_archive","smn_ai_brief_draft","smn_human_analysis","smn_ai_brief_response","smn_ai_brief_template"];
   const found=await db.query<{name:string}>("SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])",[tables]);
   for(const name of tables)if(!found.rows.some(x=>x.name===name))throw Error("Table Historique IA absente: "+name);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration Historique IA terminée (aucune ligne supprimée)");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-ai-brief-schema-v32.ts"))main().catch(e=>{console.error(e);process.exitCode=1;});
