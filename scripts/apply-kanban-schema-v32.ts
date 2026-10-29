import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const file=new URL("../prisma/migrations/20261029_kanban_runtime_ddl/migration.sql",import.meta.url);
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-kanban-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,46)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version<31||state.rows[0].state!=="initialized")throw Error("Installation initialisée v31+ requise");
   const deps=await db.query<{ready:boolean}>("SELECT to_regclass('public.smn_team') IS NOT NULL AND to_regclass('public.smn_account') IS NOT NULL AND to_regclass('public.smn_registry_item') IS NOT NULL AS ready");
   if(!deps.rows[0]?.ready)throw Error("Dépendances Kanban non installées");
   await db.query(readFileSync(file,"utf8"));
   const tables=["smn_kanban_cadence","smn_kanban_cadence_audit","smn_kanban_period","smn_kanban_period_audit","smn_kanban_meeting","smn_kanban_goal","smn_kanban_goal_audit","smn_kanban_batch_audit","smn_kanban_closure","smn_kanban_flow_counts","smn_kanban_flow_audit","smn_kanban_registry_link","smn_kanban_registry_link_audit","smn_kanban_period_transition","smn_kanban_capacity_opening","smn_kanban_timing","smn_kanban_timing_audit"];
   const verified=await db.query<{name:string}>("SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname=ANY($1::text[])",[tables]);
   const actual=new Set(verified.rows.map(x=>x.name));
   for(const table of tables)if(!actual.has(table))throw Error("Table Kanban absente: "+table);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration Kanban appliquée sans suppression de données");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-kanban-schema-v32.ts"))main().catch(e=>{console.error(e);process.exitCode=1;});
