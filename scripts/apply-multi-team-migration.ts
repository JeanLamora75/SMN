/**
 * Application explicite de la migration PostgreSQL v28.
 * Aucun lancement automatique depuis l'authentification, l'installation ou Next.js.
 * Sauvegarde recommandée, mais non vérifiée par ce script.
 */
import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {MULTI_TEAM_MIGRATION,MULTI_TEAM_SCHEMA_SQL} from "../src/server/teams/migration";

async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")
  throw Error("Usage: pnpm exec tsx scripts/apply-multi-team-migration.ts --apply");

 const source=readFileSync(new URL("../prisma/migrations/20261026_smn282_multi_teams/migration.sql",
  import.meta.url),"utf8");
 if(source.replace(/\r\n/g,"\n")!==MULTI_TEAM_SCHEMA_SQL.replace(/\r\n/g,"\n"))
  throw Error("Source SQL et migration versionnée divergentes");

 const uri=await installedDatabaseUri();
 const before=classifySnapshot(await probePostgres(uri));
 if(before.status!=="initialized")throw Error("Diagnostic préalable incorrect : migration refusée");

 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn-v28-manual-migration"});
 let begun=false;
 try{
  await db.connect();
  await db.query("BEGIN");begun=true;
  await db.query("SELECT pg_advisory_xact_lock(20261020,15)");
  const row=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(row.rows.length!==1||row.rows[0].state!=="initialized"||
     row.rows[0].schema_version!==27)throw Error("Schéma attendu v27 absent");

  const history=await db.query<{count:string}>(
   "SELECT count(*)::text AS count FROM public._prisma_migrations "+
   "WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL");
  if(history.rows[0]?.count!=="27")throw Error("Journal de migrations incorrect");

  await db.query(MULTI_TEAM_SCHEMA_SQL);
  const next=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
  if(next.rows[0]?.schema_version!==28)throw Error("Passage à v28 non confirmé");
  await db.query("INSERT INTO public._prisma_migrations "+
   "(id,checksum,finished_at,migration_name,applied_steps_count) "+
   "VALUES($1,$2,now(),$3,1)",[
    randomUUID(),createHash("sha256").update(MULTI_TEAM_SCHEMA_SQL).digest("hex"),MULTI_TEAM_MIGRATION
   ]);
  await db.query("COMMIT");begun=false;
 }catch(e){
  if(begun)await db.query("ROLLBACK").catch(()=>undefined);
  throw e;
 }finally{await db.end().catch(()=>undefined)}

 const verified=classifySnapshot(await probePostgres(uri));
 if(verified.status!=="initialized")
  throw Error("Migration enregistrée mais diagnostic final non validé : restaurer la sauvegarde après analyse");
 process.stdout.write("Migration v28 appliquée et reconnue par le diagnostic SMN.\n");
}

main().catch(e=>{
 console.error(e instanceof Error?e.message:"Migration interrompue");
 process.exitCode=1;
});
