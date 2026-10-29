import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const migration=new URL("../prisma/migrations/20261029_sprint_capacity_kpi_runtime_ddl/migration.sql",import.meta.url);
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-sprint-capacity-kpi-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,50)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
   await db.query(readFileSync(migration,"utf8"));
   const names=["smn_sprint_capacity_kpi","smn_sprint_capacity_kpi_audit"];
   const result=await db.query<{name:string}>("SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])",[names]);
   for(const name of names)if(!result.rows.some(r=>r.name===name))throw Error("Table KPI Sprint manquante: "+name);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Migration KPI capacité Sprint terminée sans suppression");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-sprint-capacity-kpi-schema-v32.ts"))main().catch(e=>{console.error(e);process.exitCode=1});
