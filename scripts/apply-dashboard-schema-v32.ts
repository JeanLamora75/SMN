import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const migration=new URL("../prisma/migrations/20261029_dashboard_runtime_ddl/migration.sql",import.meta.url);
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-dashboard-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,47)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation initialisée v32 requise");
   const dependencies=await db.query<{ok:boolean}>("SELECT to_regclass('public.smn_sprint') IS NOT NULL AND to_regclass('public.smn_team') IS NOT NULL AND to_regclass('public.smn_account') IS NOT NULL AS ok");
   if(!dependencies.rows[0]?.ok)throw Error("Dépendances Tableau de bord absentes");
   await db.query(readFileSync(migration,"utf8"));
   const tables=["smn_dashboard_note","smn_dashboard_note_audit","smn_dashboard_note_edit_audit","smn_dashboard_event_edit_audit"];
   const result=await db.query<{name:string}>("SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])",[tables]);
   for(const t of tables)if(!result.rows.some(r=>r.name===t))throw Error("Table manquante: "+t);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration Tableau de bord prête, sans suppression des données");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-dashboard-schema-v32.ts"))
 main().catch(e=>{console.error(e);process.exitCode=1;});
