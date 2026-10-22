/**
 * Explicit, additive database upgrade. Run only after taking a backup.
 * Example: pnpm exec tsx scripts/migrate-member-identity-v27.ts --apply
 */
import {createHash,randomUUID} from "node:crypto";
import {Client} from "pg";
import {parseConnectionSettings} from "../src/server/db/config";
import {loadExistingUri} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {MEMBER_IDENTITY_MIGRATION,MEMBER_IDENTITY_MIGRATION_SQL} from "../src/server/members/identity-migration";

async function main(){
 const connection=parseConnectionSettings(process.env.SMN_DATABASE_URL);
 if(!connection.ok&&connection.status!=="configuration-missing")
  throw Error("Configuration PostgreSQL invalide.");
 const uri=connection.ok?connection.uri:(await loadExistingUri()??await existingManagedUri());
 if(!uri)throw Error("Connexion PostgreSQL SMN introuvable.");
 const prior=await probePostgres(uri);
 const version=prior.installations?.[0]?.schema_version;
 const state=classifySnapshot(prior).status;
 console.log("État du schéma :",state,"; version :",version??"inconnue");
 if(version===27&&state==="initialized"){console.log("Migration déjà appliquée.");return;}
 if(version!==26||state!=="initialized")
  throw Error("Migration refusée : une installation valide en version 26 est nécessaire.");
 if(!process.argv.includes("--apply")){
  console.log("Prévalidation terminée. Exécuter avec --apply pour appliquer la migration v27.");
  return;
 }
 const db=new Client({connectionString:uri,connectionTimeoutMillis:5000,
  query_timeout:10000,statement_timeout:10000,application_name:"smn-v27-migration"});
 await db.connect();
 try{
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(20261022,27)");
  const current=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(current.rows.length!==1||current.rows[0].schema_version!==26)
   throw Error("Version concurrente inattendue.");
  await db.query(MEMBER_IDENTITY_MIGRATION_SQL);
  const verified=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
  if(verified.rows[0]?.schema_version!==27)throw Error("Le marqueur v27 n'a pas été mis à jour.");
  const checksum=createHash("sha256").update(MEMBER_IDENTITY_MIGRATION_SQL).digest("hex");
  await db.query(`INSERT INTO public._prisma_migrations
   (id,checksum,migration_name,finished_at,applied_steps_count)
   VALUES ($1,$2,$3,now(),1)`,[randomUUID(),checksum,MEMBER_IDENTITY_MIGRATION]);
  await db.query("COMMIT");
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 finally{await db.end();}
 const after=await probePostgres(uri);
 if(classifySnapshot(after).status!=="initialized"||after.installations?.[0]?.schema_version!==27)
  throw Error("La migration est appliquée, mais le diagnostic n'est pas valide. Ne pas poursuivre la recette.");
 console.log("Migration v27 appliquée. Diagnostic: initialized.");
}
main().catch(error=>{console.error("Migration interrompue :",error instanceof Error?error.message:"erreur");process.exitCode=1;});
