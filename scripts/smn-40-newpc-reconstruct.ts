/**
 * SMN-40 — offline reconstruction on a freshly PRE-CREATED isolated PG18 sandbox.
 * Never creates/drops a database; refuses REC-04 and every active SMN target.
 * Only an operator-supplied empty target can receive the verified archive.
 */
import {readFile} from "node:fs/promises";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {backupRootPath} from "../src/server/backup/runner";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {fingerprintPublicTables} from "../src/server/backup/restore-row-fingerprint";
import {join} from "node:path";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TARGET=/^smn_restore_test_newpc_[a-f0-9]{8,16}$/;
const CONFIRM="--confirm=RECONSTRUCT_EMPTY_NEWPC_SANDBOX_ONLY";
export function validNewComputerSandbox(source:string,target:string):boolean{
 try{
  const a=new URL(source),b=new URL(target);
  const name=decodeURIComponent(b.pathname.slice(1));
  return TARGET.test(name)&&validateSandboxTarget(source,target)&&
   b.hostname==="127.0.0.1"&&a.hostname==="127.0.0.1"&&
   b.port!=="57186"&&a.port!==b.port&&a.username!==b.username&&
   name!=="smn"&&!name.includes("rec04")&&
   !/rec04/i.test(decodeURIComponent(a.pathname));
 }catch{return false;}
}
export function assessNewComputerErasureWindow(archiveCreatedAt:string,
 coverageStart:string,events:readonly {occurredAt:string}[]){
 const valid=(s:string)=>typeof s==="string"&&Number.isFinite(Date.parse(s))&&
  new Date(s).toISOString()===s;
 const blocking=!valid(archiveCreatedAt)||!valid(coverageStart)||
  coverageStart>archiveCreatedAt||events.some(e=>
   !valid(e.occurredAt)||e.occurredAt>archiveCreatedAt);
 return {candidateReconstructionAllowed:!blocking,
  postArchiveErasureCount:events.filter(e=>valid(e.occurredAt)&&
   e.occurredAt>archiveCreatedAt).length,
  historicalCoverageCertified:false as const,
  restorationAuthorized:false as const};
}
async function main(){
 const args=process.argv.slice(2);
 const mode=args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&
  args[2]==="--check"?"check":
  args.length===4&&args[0]==="--archive"&&UUID.test(args[1])&&
  args[2]==="--reconstruct"&&args[3]===CONFIRM?"reconstruct":null;
 if(!mode)throw Error("newpc-arguments-invalid");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* Optional local configuration. */}
 }
 const source=await installedDatabaseUri();
 const target=process.env.SMN40_NEWPC_SANDBOX_URL;
 if(!target||!validNewComputerSandbox(source,target))
  throw Error("newpc-target-invalid");
 const root=backupRootPath();
 const index=JSON.parse(await readFile(join(root,"packages",args[1],"index.json"),"utf8")) as
  {id:string;createdAt:string};
 if(index.id!==args[1])throw Error("newpc-archive-identity-mismatch");
 // The restore engine authenticates the same index and encrypted manifest
 // before applying pg_restore. This precheck never grants active cutover.
 const ledger=await readErasureLedger();
 if(await hasUnresolvedErasureIntent())throw Error("newpc-erasure-pending");
 const privacy=assessNewComputerErasureWindow(index.createdAt,
  ledger.coverageStart,ledger.markers);
 if(!privacy.candidateReconstructionAllowed)
  throw Error("newpc-erasure-reconciliation-required");
 const db=new Client({connectionString:target,connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-newpc-sandbox-only"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const state=await db.query<{name:string;version:string;tables:string}>(`
   SELECT current_database() AS name,current_setting('server_version') AS version,
    (SELECT count(*)::text FROM pg_catalog.pg_tables
     WHERE schemaname='public') AS tables`);
  await db.query("ROLLBACK");
  if(state.rows[0]?.name!==decodeURIComponent(new URL(target).pathname.slice(1))||
   !state.rows[0]?.version.startsWith("18.")||state.rows[0]?.tables!=="0")
   throw Error("newpc-target-not-empty-or-incompatible");
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
 if(mode==="check"){
  process.stdout.write(JSON.stringify({mode,archiveId:args[1],
   isolatedTargetEmpty:true,ledgerMarkers:ledger.markers.length,
   ...privacy,activeInstallationModified:false,rec04Modified:false})+"\n");
  return;
 }
 // Only the pre-created disposable target is written; all active paths stay untouched.
 const stage=process.env.SMN40_NEWPC_STAGING_DIR;
 if(!stage)throw Error("newpc-stage-unconfigured");
 const result=await rehearseBackupRestore({sourceUri:source,sandboxUri:target,
  backupRoot:root,archiveId:args[1],stagingFilesOutput:stage});
 if(result.status!=="reconstructed-in-sandbox"||
  !result.databaseAndDocumentsConsistent||result.missingDocumentReferences!==0||
  !result.fileStagingRetained||!result.fileSnapshotSha256)
  throw Error("newpc-reconstruction-incomplete");
 const verify=new Client({connectionString:target,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-newpc-row-fingerprint"});
 try{
  await verify.connect();
  await verify.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const digest=await fingerprintPublicTables(verify);
  await verify.query("ROLLBACK");
  process.stdout.write(JSON.stringify({mode:"isolated-reconstruction",
   restoredTables:result.restoredTables,verifiedDocuments:result.verifiedDocuments,
   verifiedReportPdfs:result.verifiedReportPdfs,
   verifiedOfficeReports:result.verifiedOfficeReports,
   verifiedOfficeTemplates:result.verifiedOfficeTemplates,
   fingerprintedTables:digest.tables.length,
   rowFingerprintDigest:digest.digest,documentsConsistent:true,
   stagedFileSnapshotSha256:result.fileSnapshotSha256,
   verifiedAgainstIndependentCandidate:false,
   historicalErasureCoverageCertified:false,restorationAuthorized:false,
   activeInstallationModified:false,rec04Modified:false},null,2)+"\n");
 }finally{
  await verify.query("ROLLBACK").catch(()=>undefined);
  await verify.end().catch(()=>undefined);
 }
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-newpc-reconstruct.ts"))
 main().catch((error:unknown)=>{
  // Deliberately permit only static operational codes, never SQL output,
  // PostgreSQL URIs, Windows paths, archive contents or secret material.
  const allowed=new Set(["newpc-arguments-invalid","newpc-target-invalid",
   "newpc-archive-identity-mismatch","newpc-erasure-pending",
   "newpc-erasure-reconciliation-required","newpc-target-not-empty-or-incompatible",
   "newpc-stage-unconfigured","newpc-reconstruction-incomplete",
   "restore-sandbox-denied","restore-file-staging-disposable-only",
   "restore-file-staging-already-exists","sandbox-not-empty",
   "restore-key-invalid","restore-key-or-recovery-phrase-required",
   "restore-archive-unverified","restore-manifest-inconsistent",
   "restore-document-name-invalid","restore-document-inventory-mismatch",
   "restore-postgres-incompatible","pg-restore-unavailable",
   "pg-restore-failed","restore-rehearsal-failed",
   "restore-database-hash-mismatch","restore-schema-mismatch",
   "restore-constraints-unvalidated","restore-pdf-references-missing",
   "restore-stage-incomplete","restore-staged-files-missing",
   "restore-file-root-untrusted","restore-file-folder-unexpected",
   "restore-file-folder-untrusted","restore-file-name-invalid",
   "restore-file-untrusted","restore-file-changed",
   "restore-file-scope-limit","manifest-invalid",
   "ciphertext-invalid","plaintext-invalid","document-too-large",
   "restore-extra-archive-invalid"]);
  const reason=error instanceof Error&&allowed.has(error.message)?
   error.message:"newpc-unclassified";
  process.stderr.write(JSON.stringify({status:"blocked",reason,
   activeRestoration:false,rec04Modified:false})+"\n");
  process.exitCode=2;
 });
