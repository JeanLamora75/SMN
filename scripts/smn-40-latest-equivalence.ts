/**
 * SMN-40 — deuxième restauration indépendante de la même archive v4 et
 * comparaison exhaustive des lignes des tables public, sans données en sortie.
 * Cluster REC-04 dédié seulement, ne supprime et ne modifie aucune base existante.
 */
import {Client} from "pg";
import {resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";
import {backupRootPath} from "../src/server/backup/runner";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";
import {fingerprintPublicTables,compareFingerprints} from "../src/server/backup/restore-row-fingerprint";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIRST="smn_restore_test_latest_backup_20261111";
const SECOND="smn_restore_test_latest_compare_20261111";
const CONFIRM="--confirm=CREATE_SECOND_DISPOSABLE_ONLY";
const norm=(x:string)=>resolve(x).replaceAll("\\","/").replace(/\/$/,"").toLowerCase();

export function parseEquivalenceArgs(args:readonly string[]){
 if(args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&args[2]==="--check")
  return {archiveId:args[1],mode:"check" as const};
 if(args.length===4&&args[0]==="--archive"&&UUID.test(args[1])&&
  args[2]==="--compare"&&args[3]===CONFIRM)
  return {archiveId:args[1],mode:"compare" as const};
 throw Error("equivalence-arguments-invalid");
}
export function validateEquivalenceScope(rec04:string,live:string,clusterDir:string){
 try{
  const a=new URL(rec04),b=new URL(live),target=new URL(rec04);
  target.pathname="/"+SECOND;
  return !!clusterDir&&resolve(clusterDir)===clusterDir&&
   ["postgres:","postgresql:"].includes(a.protocol)&&
   a.hostname==="127.0.0.1"&&a.port==="57186"&&
   decodeURIComponent(a.pathname)==="/smn_restore_test_rec04_sandbox"&&
   !!a.username&&!!a.password&&!a.search&&!a.hash&&
   ["postgres:","postgresql:"].includes(b.protocol)&&
   b.hostname==="127.0.0.1"&&b.port!=="57186"&&
   decodeURIComponent(b.pathname)==="/smn"&&
   !!b.username&&!!b.password&&b.username!==a.username&&
   !b.username.startsWith("smn_restore_test_")&&!b.search&&!b.hash&&
   validateSandboxTarget(live,target.toString());
 }catch{return false;}
}
async function digest(uri:string,expectedDir:string){
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-isolated-fingerprint"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const id=await db.query<{version:string;directory:string;schema:number}>(`
   SELECT current_setting('server_version') AS version,
    current_setting('data_directory') AS directory,
    (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema`);
  if(id.rows[0]?.schema!==33||!id.rows[0]?.version.startsWith("18.")||
   norm(id.rows[0].directory)!==norm(expectedDir))
   throw Error("snapshot-identity-unverified");
  const fingerprint=await fingerprintPublicTables(db);
  await db.query("ROLLBACK");
  return fingerprint;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 const {archiveId,mode}=parseEquivalenceArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const rec04=process.env.SMN40_REC04_DATABASE_URL;
 const directory=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!rec04||!directory)throw Error("isolated-cluster-not-configured");
 const live=await installedDatabaseUri();
 if(!validateEquivalenceScope(rec04,live,directory))
  throw Error("isolated-scope-denied");
 const preview=await previewBackupReadOnly(archiveId);
 if(preview.archive.status!=="verified"||!preview.archive.integrityVerified||
  !preview.archive.scopeComplete||preview.archive.schemaVersion!==33||
  preview.archive.postgresVersion?.split(".")[0]!=="18"||
  preview.archive.installationSource!==preview.current.installationSource)
  throw Error("archive-not-qualified");
 const maintenance=new URL(rec04);maintenance.pathname="/postgres";
 const first=new URL(rec04);first.pathname="/"+FIRST;
 const second=new URL(rec04);second.pathname="/"+SECOND;
 const db=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-rehearsal-equivalence"});
 try{
  await db.connect();
  const meta=await db.query<{directory:string;version:string;name:string}>(`
   SELECT current_setting('data_directory') AS directory,
    current_setting('server_version') AS version,current_database() AS name`);
  if(norm(meta.rows[0]?.directory??"")!==norm(directory)||
   !meta.rows[0]?.version.startsWith("18.")||meta.rows[0]?.name!=="postgres")
   throw Error("physical-cluster-mismatch");
  const entries=await db.query<{datname:string}>(`
   SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])`,
   [[FIRST,SECOND,"smn_restore_test_rec04_sandbox"]]);
  const names=new Set(entries.rows.map(x=>x.datname));
  if(!names.has(FIRST)||!names.has("smn_restore_test_rec04_sandbox"))
   throw Error("first-reconstruction-not-found");
  if(names.has(SECOND))throw Error("comparison-target-already-exists");
  // Fingerprint of the existing isolated restored copy, before creating another.
  const primary=await digest(first.toString(),directory);
  if(mode==="check"){
   process.stdout.write(JSON.stringify({mode:"read-only",archiveId,
    originalTables:primary.tables.length,secondTarget:SECOND,
    safeToCreate:true,created:false,activeInstallationModified:false,
    restorationAuthorized:false})+"\n");
   return;
  }
  await db.query('CREATE DATABASE "'+SECOND+'"');
  try{
   const outcome=await rehearseBackupRestore({
    sourceUri:live,sandboxUri:second.toString(),
    backupRoot:backupRootPath(),archiveId
   });
   if(outcome.status!=="reconstructed-in-sandbox"||
    !outcome.databaseAndDocumentsConsistent||outcome.activeInstallationModified)
    throw Error("second-reconstruction-unverified");
  }catch{throw Error("second-reconstruction-failed-retained");}
  const comparison=compareFingerprints(primary,await digest(second.toString(),directory));
  process.stdout.write(JSON.stringify({mode:"isolated-independent-equivalence",
   archiveId,firstDatabase:FIRST,secondDatabase:SECOND,
   checkedTables:comparison.tableCountA,
   secondTables:comparison.tableCountB,
   equivalentRowsAndTables:comparison.equivalent,
   differingTableNames:comparison.differences,
   sourceLiveAtCaptureEquivalenceProven:false,
   archivePrivacyQualified:false,productionCutoverQualified:false,
   activeInstallationModified:false,restorationAuthorized:false},null,2)+"\n");
  if(!comparison.equivalent)process.exitCode=2;
 }finally{await db.end().catch(()=>undefined);}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-latest-equivalence.ts"))
 main().catch((error:unknown)=>{
  const known=new Set(["equivalence-arguments-invalid","isolated-cluster-not-configured",
   "isolated-scope-denied","archive-not-qualified","physical-cluster-mismatch",
   "first-reconstruction-not-found","comparison-target-already-exists",
   "snapshot-identity-unverified","second-reconstruction-failed-retained",
   "fingerprint-table-too-large"]);
  const reason=error instanceof Error&&known.has(error.message)?error.message:"unverified";
  process.stderr.write(JSON.stringify({mode:"isolated-equivalence",status:"blocked",
   reason,noDatabaseDropped:true,activeInstallationModified:false})+"\n");
  process.exitCode=2;
 });
