/** Migration Pays v29 -> v30, jamais automatique. Sauvegarde recommandée, sans contrôle du fichier. */
import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {COUNTRY_CONSOLIDATION_MIGRATION,COUNTRY_CONSOLIDATION_MIGRATION_SQL}
 from "../src/server/countries/consolidation-migration";

async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")
  throw Error("Usage: pnpm exec tsx scripts/apply-country-consolidation-migration.ts --apply");
 const sql=readFileSync(new URL("../prisma/migrations/20261028_smn270_281_country_consolidation/migration.sql",import.meta.url),"utf8");
 if(sql.replace(/\r\n/g,"\n")!==COUNTRY_CONSOLIDATION_MIGRATION_SQL.replace(/\r\n/g,"\n"))
  throw Error("Source SQL v30 divergente : migration refusée");
 const uri=await installedDatabaseUri();
 const before=await probePostgres(uri);
 if(classifySnapshot(before).status!=="initialized"||
  before.installations?.[0]?.schema_version!==29)
  throw Error("Base saine v29 requise");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn-v30-manual-migration"});
 let begun=false;
 try{
  await db.connect();
  await db.query("BEGIN");begun=true;
  await db.query("SELECT pg_advisory_xact_lock(20261020,15)");
  const state=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(state.rows.length!==1||state.rows[0].schema_version!==29||state.rows[0].state!=="initialized")
   throw Error("Version concurrente ou installation non initialisée");
  const history=await db.query<{n:string}>(`SELECT count(*)::text AS n
   FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`);
  if(history.rows[0]?.n!=="29")throw Error("Journal des 29 migrations non conforme");
  for(const table of ["smn_country_name_audit","smn_country_lifecycle_audit",
   "smn_national_holiday_manual_audit","smn_national_calendar_validation_audit"]){
   const check=await db.query<{exists:boolean}>(
    "SELECT to_regclass($1) IS NOT NULL AS exists",["public."+table]);
   if(check.rows[0]?.exists)throw Error("Table v30 déjà existante : "+table);
  }
  await db.query(COUNTRY_CONSOLIDATION_MIGRATION_SQL);
  const next=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
  if(next.rows[0]?.schema_version!==30)throw Error("Version 30 non confirmée");
  await db.query(`INSERT INTO public._prisma_migrations
   (id,checksum,finished_at,migration_name,applied_steps_count)
   VALUES($1,$2,now(),$3,1)`,[
    randomUUID(),createHash("sha256").update(COUNTRY_CONSOLIDATION_MIGRATION_SQL).digest("hex"),COUNTRY_CONSOLIDATION_MIGRATION
   ]);
  await db.query("COMMIT");begun=false;
 }catch(error){
  if(begun)await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }finally{await db.end().catch(()=>undefined);}
 const after=await probePostgres(uri);
 if(classifySnapshot(after).status!=="initialized"||
  after.installations?.[0]?.schema_version!==30)
  throw Error("Migration enregistrée mais diagnostic v30 incomplet : vérifier avant toute reprise");
 console.log("Migration Pays v30 appliquée ; diagnostic SMN validé.");
}
main().catch(error=>{
 console.error(error instanceof Error?error.message:"Migration interrompue");
 process.exitCode=1;
});
