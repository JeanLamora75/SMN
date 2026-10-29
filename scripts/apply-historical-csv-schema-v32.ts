import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const source=new URL("../prisma/migrations/20261029_historical_csv_runtime_ddl/migration.sql",import.meta.url);
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-historical-csv-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,49)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
   const prerequisite=await db.query<{ready:boolean}>("SELECT to_regclass('public.smn_account') IS NOT NULL AS ready");
   if(!prerequisite.rows[0]?.ready)throw Error("Compte SQL non installé");
   await db.query(readFileSync(source,"utf8"));
   const tables=["smn_historical_csv_attempt","smn_historical_csv_batch","smn_historical_csv_change"];
   const columns=await db.query<{table_name:string;column_name:string}>(`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'
    AND table_name=ANY($1::text[])`,[tables]);
   const required:Record<string,string[]>={smn_historical_csv_attempt:["id","status","mode","scope","batch_id","errors"],smn_historical_csv_batch:["id","mode","actor_id"],smn_historical_csv_change:["id","batch_id","cycle_id","metric_code","source_line","previous_quality"]};
   for(const [table,fields] of Object.entries(required))for(const field of fields)if(!columns.rows.some(c=>c.table_name===table&&c.column_name===field))throw Error("Colonne manquante: "+table+"."+field);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration Imports historiques CSV terminée, sans suppression");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-historical-csv-schema-v32.ts"))main().catch(e=>{console.error(e);process.exitCode=1;});
