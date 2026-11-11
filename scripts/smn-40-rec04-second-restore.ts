/**
 * Isolated, explicit second reconstruction of the verified v4 backup.
 * Never targets the live installation or modifies REC-04.
 * A successful rehearsal is not a production restoration authorization.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {backupRootPath} from "../src/server/backup/runner";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";
import {compareFingerprints,fingerprintPublicTables}
 from "../src/server/backup/restore-row-fingerprint";

const ARCHIVE="1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5";
const ORIGINAL="smn_restore_test_rec04_sandbox";
const SECOND="smn_restore_test_rec04_second";
const REQUIRED="--confirm=RESTORE_SECOND_DISPOSABLE_ONLY";
const norm=(s:string)=>s.replaceAll(String.fromCharCode(92),"/")
 .replace(/\/$/,"").toLowerCase();

export function validateSecondRestoreScope(
 adminUri:string,originalUri:string,expectedCluster:string,
 activeUri:string
):boolean{
 try{
  const admin=new URL(adminUri),original=new URL(originalUri),active=new URL(activeUri);
  const safe=(u:URL,name:string)=>["postgres:","postgresql:"].includes(u.protocol)&&
   u.hostname==="127.0.0.1"&&u.port==="57186"&&
   decodeURIComponent(u.pathname)==="/"+name&&
   !!u.username&&!!u.password&&!u.search&&!u.hash;
  const second=new URL(admin);second.pathname="/"+SECOND;
  return !!expectedCluster&&
   safe(admin,"postgres")&&safe(original,ORIGINAL)&&
   admin.username===original.username&&admin.password===original.password&&
   !["smn_restore_test_rec04_second","smn_restore_test_rec04_sandbox"].includes(
    decodeURIComponent(active.pathname.slice(1)))&&
   validateSandboxTarget(activeUri,second.toString())&&
   active.port!=="57186"&&
   active.username!==admin.username&&active.hostname==="127.0.0.1";
 }catch{return false;}
}

async function readFingerprint(uri:string,expected:string){
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-second-restore-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const identity=await db.query<{db:string;directory:string;version:string;schema:number}>(`
   SELECT current_database() AS db,current_setting('data_directory') AS directory,
    current_setting('server_version') AS version,
    (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema`);
  const v=identity.rows[0];
  if(!v||norm(v.directory)!==norm(expected)||!v.version.startsWith("18.")||
   v.schema!==33)throw Error("isolated-database-identity-unverified");
  const result=await fingerprintPublicTables(db);
  await db.query("ROLLBACK");
  return result;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}

async function main(){
 const args=process.argv.slice(2);
 const mode=args.length===1&&args[0]==="--check"?"check":
  args.length===2&&args[0]==="--restore"&&args[1]===REQUIRED?"restore":null;
 if(!mode)throw Error("invalid-arguments");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const original=process.env.SMN40_REC04_DATABASE_URL;
 const expected=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!original||!expected)throw Error("isolated-connection-unconfigured");
 const active=await installedDatabaseUri();
 const admin=new URL(original);
 admin.pathname="/postgres";
 if(!validateSecondRestoreScope(admin.toString(),original,expected,active))
  throw Error("isolated-scope-denied");
 const second=new URL(admin);second.pathname="/"+SECOND;
 const maintenance=new Client({connectionString:admin.toString(),
  connectionTimeoutMillis:3500,statement_timeout:15000,
  application_name:"smn40-disposable-second-restore"});
 try{
  await maintenance.connect();
  const probe=await maintenance.query<{version:string;directory:string}>(`
   SELECT current_setting('server_version') AS version,
    current_setting('data_directory') AS directory`);
  if(!probe.rows[0]?.version.startsWith("18.")||
   norm(probe.rows[0].directory)!==norm(expected))
   throw Error("physical-cluster-mismatch");
  const existing=await maintenance.query<{datname:string}>(`
   SELECT datname FROM pg_catalog.pg_database
   WHERE datname=ANY($1::text[])`,[[ORIGINAL,SECOND]]);
  const names=new Set(existing.rows.map(x=>x.datname));
  if(!names.has(ORIGINAL))throw Error("original-rec04-missing");
  if(names.has(SECOND))throw Error("second-target-already-exists");
  // Check REC-04 is in fact a usable restored installation before creating.
  const originalDigest=await readFingerprint(original,expected);
  const preview=await previewBackupReadOnly(ARCHIVE);
  if(preview.archive.status!=="verified"||
   !preview.archive.integrityVerified||preview.archive.schemaVersion!==33||
   preview.archive.scopeComplete!==true)
   throw Error("source-archive-unverified");
  if(mode==="check"){
   process.stdout.write(JSON.stringify({mode:"check",safeToCreateSecond:true,
    archiveId:ARCHIVE,firstTableCount:originalDigest.tables.length,
    secondDatabase:SECOND,created:false,activeInstallationModified:false,
    deploymentAuthorized:false})+"\n");
   return;
  }
  // CREATE DATABASE deliberately outside transaction, only after the physical
  // cluster and exact target name have been independently checked.
  await maintenance.query('CREATE DATABASE "'+SECOND+'"');
  let restored=false;
  try{
   const outcome=await rehearseBackupRestore({
    sourceUri:active,sandboxUri:second.toString(),
    backupRoot:backupRootPath(),archiveId:ARCHIVE
   });
   if(outcome.status!=="reconstructed-in-sandbox"||
    !outcome.databaseAndDocumentsConsistent||outcome.activeInstallationModified)
    throw Error("independent-reconstruction-incomplete");
   restored=true;
  }catch{
   // Deliberately preserve the disposable database for forensic review; never
   // issue DROP DATABASE or touch REC-04 after uncertain pg_restore outcomes.
   throw Error("second-restore-failed-target-retained");
  }
  if(!restored)throw Error("second-restore-unverified");
  const fresh=await readFingerprint(second.toString(),expected);
  const compared=compareFingerprints(originalDigest,fresh);
  process.stdout.write(JSON.stringify({
   mode:"isolated-second-restoration",archiveId:ARCHIVE,
   secondDatabase:SECOND,restored:true,
   firstTables:originalDigest.tables.length,secondTables:fresh.tables.length,
   equivalentRowsAndTables:compared.equivalent,
   differingTableNames:compared.differences,
   activeInstallationModified:false,originalRec04Modified:false,
   sourceArchiveRowEquivalenceProven:false,
   historicalErasureCoverageQualified:false,
   productionRollbackQualified:false,deploymentAuthorized:false
  },null,2)+"\n");
  if(!compared.equivalent)process.exitCode=2;
 }finally{await maintenance.end().catch(()=>undefined);}
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-rec04-second-restore.ts"))
 main().catch((err:unknown)=>{
  const known=new Set(["invalid-arguments","isolated-connection-unconfigured",
   "isolated-scope-denied","physical-cluster-mismatch","original-rec04-missing",
   "second-target-already-exists","isolated-database-identity-unverified",
   "source-archive-unverified","second-restore-failed-target-retained",
   "independent-reconstruction-incomplete","fingerprint-table-too-large"]);
  const reason=err instanceof Error&&known.has(err.message)?err.message:"unverified";
  process.stderr.write(JSON.stringify({status:"blocked",reason,
   activeInstallationModified:false,noDatabaseDropped:true})+"\n");
  process.exitCode=2;
 });
