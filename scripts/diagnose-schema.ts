import {existsSync} from "node:fs";
import {Client} from "pg";
import {parseConnectionSettings} from "../src/server/db/config";
import {loadExistingUri} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {probePostgres} from "../src/server/db/probe";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";
import {classifySnapshot} from "../src/server/installation/diagnostic";

async function main(){
 // Next.js charge .env.local / .env ; ce script CLI doit faire de même.
 for(const file of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(file))process.loadEnvFile(file);
 }
 const settings=parseConnectionSettings(process.env.SMN_DATABASE_URL);
 if(!settings.ok&&settings.status!=="configuration-missing"){
  console.error("Configuration PostgreSQL invalide");process.exitCode=1;return;
 }
 const uri=settings.ok?settings.uri:(await loadExistingUri()??await existingManagedUri());
 if(!uri){console.error("Configuration PostgreSQL SMN introuvable");process.exitCode=1;return;}
 const snapshot=await probePostgres(uri);
 const known=new Set<string>(INSTALLATION_RELATIONS);
 const unexpected=[...new Set(snapshot.tables.filter(name=>!known.has(name)))].sort();
 console.log("Diagnostic:",classifySnapshot(snapshot).status);
 console.log("Version de schéma:",snapshot.installations?.[0]?.schema_version??"non lue");
 console.log("Nombre d'objets inconnus:",unexpected.length);
 for(const name of unexpected)console.log("Objet inconnu:",name);
 if(snapshot.installations?.[0]?.schema_version===undefined)
  console.log("Version non lue : le contrôle s'arrête avant la lecture du marqueur en présence d'objets inconnus.");
 // Même si un objet inconnu interrompt le probe, lire le nombre de migrations
 // en transaction lecture seule pour distinguer liste blanche et drift Prisma.
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:5000,application_name:"smn-diagnostic-readonly"});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const exists=await db.query<{installation:boolean;history:boolean}>(`SELECT
   to_regclass('public.smn_installation') IS NOT NULL AS installation,
   to_regclass('public._prisma_migrations') IS NOT NULL AS history`);
  if(exists.rows[0]?.installation){
   const version=await db.query<{schema_version:number;state:string}>(`SELECT schema_version,state
    FROM public.smn_installation WHERE id='singleton'`);
   console.log("Version enregistrée :",version.rows[0]?.schema_version??"absente");
   console.log("État de l'installation :",version.rows[0]?.state??"absent");
  }
  if(exists.rows[0]?.history){
   const migrations=await db.query<{total:string;finished:string}>(`SELECT count(*)::text AS total,
    count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text AS finished
    FROM public._prisma_migrations`);
   console.log("Migrations enregistrées :",migrations.rows[0]?.total??"?");
   console.log("Migrations terminées :",migrations.rows[0]?.finished??"?");
  }
  await db.query("ROLLBACK");
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 finally{await db.end().catch(()=>undefined);}

}
main().catch(error=>{
 console.error("Diagnostic impossible:",error instanceof Error?error.name:"erreur inconnue");
 process.exitCode=1;
});
