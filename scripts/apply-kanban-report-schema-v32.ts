import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-kanban-report-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,51)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation initialisée v32 requise");
   const deps=await db.query<{ok:boolean}>("SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS ok");
   if(!deps.rows[0]?.ok)throw Error("Migration des périodes Kanban requise");
   await db.query(readFileSync(new URL("../prisma/migrations/20261029_kanban_reporting_ddl/migration.sql",import.meta.url),"utf8"));
   const names=["smn_kanban_render_reference","smn_kanban_report_analysis_choice"];
   const found=await db.query<{name:string}>("SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])",[names]);
   for(const n of names)if(!found.rows.some(r=>r.name===n))throw Error("Table manquante: "+n);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration Kanban reporting non destructive terminée");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-kanban-report-schema-v32.ts"))main().catch(e=>{console.error(e);process.exitCode=1});
