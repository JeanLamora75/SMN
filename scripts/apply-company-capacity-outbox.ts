import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const migration=new URL("../prisma/migrations/20261029_company_capacity_outbox/migration.sql",import.meta.url);
export async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-company-capacity-outbox.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,45)");
   const installation=await db.query<{schema_version:number;state:string}>(
    "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(installation.rows.length!==1||installation.rows[0].schema_version<31||installation.rows[0].state!=="initialized")
    throw Error("Installation initialisée v31 ou ultérieure requise");
   const prerequisites=await db.query<{ready:boolean}>(`SELECT
    to_regclass('public.smn_company') IS NOT NULL
    AND to_regclass('public.smn_company_closure') IS NOT NULL AS ready`);
   if(!prerequisites.rows[0]?.ready)throw Error("Schéma Entreprises incomplet");
   await db.query(readFileSync(migration,"utf8"));
   const validation=await db.query<{ready:boolean}>(`SELECT
    to_regclass('public.smn_company_capacity_recalc') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
     AND tablename='smn_company_capacity_recalc'
     AND indexname='smn_company_capacity_recalc_due_idx')
    AND (SELECT count(DISTINCT column_name) FROM information_schema.columns
     WHERE table_schema='public' AND table_name='smn_company_capacity_recalc'
     AND column_name IN ('id','company_id','closure_id','closure_revision','start_on',
      'end_on','status','attempts','last_error','result','next_attempt_at','created_at','updated_at'))=13
    AS ready`);
   if(!validation.rows[0]?.ready)throw Error("Migration de la file entreprise incomplète");
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("File de recalcul Entreprises prête : migration non destructive");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-company-capacity-outbox.ts"))
 main().catch(e=>{console.error(e);process.exitCode=1;});
