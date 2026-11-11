/**
 * Test d'une archive v4 réelle dans le cluster PostgreSQL REC-04 isolé.
 * Préserve la base active et les autres bases REC-04. Ne DROP jamais rien.
 * Arguments: --archive UUID --check
 *        ou --archive UUID --restore --confirm=RESTORE_DISPOSABLE_ARCHIVE_ONLY
 */
import {Client} from "pg";
import {resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";
import {backupRootPath} from "../src/server/backup/runner";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAME="smn_restore_test_latest_backup_20261111";
const CONFIRM="--confirm=RESTORE_DISPOSABLE_ARCHIVE_ONLY";
const normalize=(s:string)=>resolve(s).replaceAll("\\","/").replace(/\/$/,"").toLowerCase();

export function parseLatestRehearsalArgs(args:readonly string[]){
 if(args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&args[2]==="--check")
  return {archiveId:args[1],mode:"check" as const};
 if(args.length===4&&args[0]==="--archive"&&UUID.test(args[1])&&
  args[2]==="--restore"&&args[3]===CONFIRM)
  return {archiveId:args[1],mode:"restore" as const};
 throw Error("latest-rehearsal-arguments-invalid");
}
export function validLatestRehearsalScope(
 original:string,live:string,expectedDirectory:string):boolean{
 try{
  const a=new URL(original),b=new URL(live);
  if(!expectedDirectory||resolve(expectedDirectory)!==expectedDirectory||
   !["postgres:","postgresql:"].includes(a.protocol)||
   a.hostname!=="127.0.0.1"||a.port!=="57186"||
   decodeURIComponent(a.pathname)!=="/smn_restore_test_rec04_sandbox"||
   !a.username||!a.password||a.search||a.hash||
   !["postgres:","postgresql:"].includes(b.protocol)||
   b.hostname!=="127.0.0.1"||b.port==="57186"||
   decodeURIComponent(b.pathname)!=="/smn"||
   !b.username||b.username===a.username||
   b.username.startsWith("smn_restore_test_")||!b.password||b.search||b.hash)
   return false;
  const target=new URL(a);target.pathname="/"+NAME;
  return validateSandboxTarget(live,target.toString());
 }catch{return false;}
}
async function main(){
 const {archiveId,mode}=parseLatestRehearsalArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* no local env file */}
 }
 const original=process.env.SMN40_REC04_DATABASE_URL;
 const expected=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!original||!expected)throw Error("isolated-cluster-not-configured");
 const live=await installedDatabaseUri();
 if(!validLatestRehearsalScope(original,live,expected))
  throw Error("isolated-scope-denied");
 const preview=await previewBackupReadOnly(archiveId);
 if(preview.archive.status!=="verified"||!preview.archive.integrityVerified||
  preview.archive.scopeComplete!==true||preview.archive.schemaVersion!==33||
  preview.archive.postgresVersion?.split(".")[0]!=="18"||
  preview.archive.installationSource!==preview.current.installationSource)
  throw Error("archive-not-qualified-for-rehearsal");
 const maintenance=new URL(original);maintenance.pathname="/postgres";
 const target=new URL(original);target.pathname="/"+NAME;
 const db=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500,
  statement_timeout:10000,application_name:"smn40-latest-archive-rehearsal"});
 try{
  await db.connect();
  const observed=await db.query<{version:string;directory:string;database:string}>(`
   SELECT current_setting('server_version') AS version,
    current_setting('data_directory') AS directory,
    current_database() AS database`);
  const state=observed.rows[0];
  if(!state||!state.version.startsWith("18.")||
   normalize(state.directory)!==normalize(expected)||state.database!=="postgres")
   throw Error("isolated-cluster-identity-mismatch");
  const existing=await db.query<{name:string}>(`
   SELECT datname AS name FROM pg_catalog.pg_database
   WHERE datname=$1 OR datname='smn_restore_test_rec04_sandbox'`,[NAME]);
  const names=new Set(existing.rows.map(r=>r.name));
  if(!names.has("smn_restore_test_rec04_sandbox"))
   throw Error("rec04-original-not-present");
  if(names.has(NAME))throw Error("disposable-target-already-exists");
  if(mode==="check"){
   process.stdout.write(JSON.stringify({mode:"check",archiveId,safeToCreate:true,
    target:NAME,created:false,activeInstallationModified:false,
    restorationAuthorized:false})+"\n");
   return;
  }
  // CREATE dans le cluster physiquement isolé, après contrôle strict.
  // Aucune suppression automatique même en cas d'échec.
  await db.query('CREATE DATABASE "'+NAME+'"');
  let result;
  try{
   result=await rehearseBackupRestore({
    sourceUri:live,sandboxUri:target.toString(),
    backupRoot:backupRootPath(),archiveId
   });
  }catch{throw Error("isolated-rehearsal-failed-target-retained");}
  process.stdout.write(JSON.stringify({
   mode:"isolated-archive-rehearsal",archiveId,target:NAME,
   restored:result.status==="reconstructed-in-sandbox",
   databaseAndDocumentsConsistent:result.databaseAndDocumentsConsistent,
   restoredTables:result.restoredTables,
   verifiedDocuments:result.verifiedDocuments,
   verifiedReportPdfs:result.verifiedReportPdfs,
   verifiedOfficeReports:result.verifiedOfficeReports,
   verifiedOfficeTemplates:result.verifiedOfficeTemplates,
   activeInstallationModified:false,
   sourceArchiveRowEquivalenceProven:false,
   privacyHistoryQualified:false,windowsProductionCutoverQualified:false,
   restorationAuthorized:false
  },null,2)+"\n");
  if(!result.databaseAndDocumentsConsistent)process.exitCode=2;
 }finally{await db.end().catch(()=>undefined);}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-rehearse-latest-backup.ts"))
 main().catch((error:unknown)=>{
  const permitted=new Set([
   "latest-rehearsal-arguments-invalid","isolated-cluster-not-configured",
   "isolated-scope-denied","archive-not-qualified-for-rehearsal",
   "isolated-cluster-identity-mismatch","rec04-original-not-present",
   "disposable-target-already-exists","isolated-rehearsal-failed-target-retained"
  ]);
  const reason=error instanceof Error&&permitted.has(error.message)?error.message:"unverified";
  process.stderr.write(JSON.stringify({status:"blocked",reason,
   noDatabaseDropped:true,activeInstallationModified:false})+"\n");
  process.exitCode=2;
 });
