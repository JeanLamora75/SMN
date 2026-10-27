/**
 * Migration manuelle SMN Liens v28 -> v29.
 * Refuse toute application sans sauvegarde explicitement désignée.
 */
import {createHash,randomUUID} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";

async function main(){
 const args=process.argv.slice(2);
 const backupFile=args.find(a=>a.startsWith("--backup-file="))?.slice(14);
 if(args.length!==2||!args.includes("--apply")||!backupFile)
  throw Error("Usage: pnpm exec tsx scripts/apply-links-migration.ts --apply --backup-file=<backup>");
 const backup=resolve(backupFile);
 if(!existsSync(backup)||!statSync(backup).isFile()||statSync(backup).size===0)
  throw Error("Sauvegarde absente ou vide : migration refusée");
 for(const file of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(file))process.loadEnvFile(file);
 }
 const uri=await installedDatabaseUri();
 const snapshot=await probePostgres(uri);
 if(classifySnapshot(snapshot).status!=="initialized"||
    snapshot.installations?.[0]?.schema_version!==28)
  throw Error("Base saine v28 requise");
 const sql=readFileSync(new URL("../prisma/migrations/20261027_smn306_links/migration.sql",import.meta.url),"utf8");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn-links-manual-migration"});
 let began=false;
 try{
  await db.connect();
  await db.query("BEGIN");began=true;
  await db.query("SELECT pg_advisory_xact_lock(20261020,15)");
  const state=await db.query<{schema_version:number;state:string}>(`
   SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE`);
  if(state.rows.length!==1||state.rows[0].schema_version!==28||state.rows[0].state!=="initialized")
   throw Error("Version concurrente : migration refusée");
  const count=await db.query<{n:string}>(`SELECT count(*)::text AS n
   FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`);
  if(count.rows[0]?.n!=="28")throw Error("Journal de migrations non conforme");
  const check=await db.query<{n:number}>(`SELECT count(*)::int AS n FROM pg_class
   WHERE relnamespace='public'::regnamespace
   AND relname IN ('smn_link','smn_link_category','smn_link_audit')`);
  if(check.rows[0]?.n!==0)throw Error("Tables Liens déjà présentes");
  await db.query(sql);
  const stateAfter=await db.query<{schema_version:number}>(`
   SELECT schema_version FROM public.smn_installation WHERE id='singleton'`);
  if(stateAfter.rows[0]?.schema_version!==29)throw Error("Version v29 non confirmée");
  await db.query(`INSERT INTO public._prisma_migrations
   (id,checksum,finished_at,migration_name,applied_steps_count)
   VALUES($1,$2,now(),$3,1)`,[
    randomUUID(),createHash("sha256").update(sql).digest("hex"),"20261027_smn306_links"
  ]);
  await db.query("COMMIT");began=false;
 }catch(e){
  if(began)await db.query("ROLLBACK").catch(()=>undefined);
  throw e;
 }finally{await db.end().catch(()=>undefined);}
 const verified=await probePostgres(uri);
 if(classifySnapshot(verified).status!=="initialized"||
    verified.installations?.[0]?.schema_version!==29)
  throw Error("La migration est enregistrée, mais le diagnostic final n'est pas validé");
 process.stdout.write("Migration Liens v29 appliquée et diagnostic validé.\n");
}
main().catch(e=>{console.error(e instanceof Error?e.message:"Migration interrompue");process.exitCode=1;});
