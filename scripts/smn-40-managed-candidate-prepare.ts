/**
 * Stage an imported v4 archive directly inside the brand-new SMN-managed PG18
 * cluster. No active data is overwritten. The destination "smn" database
 * must exist and have ZERO public tables.
 *
 * This is a separate offline step, never called by the web application.
 */
import {randomBytes} from "node:crypto";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {Client} from "pg";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {backupRootPath} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {fingerprintPublicTables} from "../src/server/backup/restore-row-fingerprint";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {ERASURE_GENESIS_MAC} from "../src/server/backup/erasure-evidence-format";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {inspectOfflineRestoreMaintenance} from "../src/server/backup/restore-maintenance";
import {comparePortableCurrentState,type SignedCurrentStateReceipt}
 from "../src/server/backup/current-state-transfer-receipt";

const VALID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function prepareFreshManagedCandidate(archiveId:string,receiptPath:string){
 if(process.platform!=="win32"||!VALID.test(archiveId)||
  process.env.SMN_DATABASE_URL)throw Error("migration-prepare-not-available");
 const marker=await inspectOfflineRestoreMaintenance();
 if(!marker||marker.purpose!=="offline-restore")
  throw Error("migration-maintenance-required");
 const uri=await existingManagedUri();
 if(!uri)throw Error("migration-managed-cluster-unavailable");
 const parsed=new URL(uri);
 if(parsed.hostname!=="127.0.0.1"||
  decodeURIComponent(parsed.pathname)!=="/smn")throw Error("migration-managed-db-invalid");
 const root=backupRootPath(),keyPath=join(root,".backup-key");
 const stat=await lstat(keyPath);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==32)
  throw Error("migration-recovery-key-untrusted");
 const key=await readFile(keyPath);
 const receiptStat=await lstat(receiptPath);
 if(!receiptStat.isFile()||receiptStat.isSymbolicLink()||
  receiptStat.size<50||receiptStat.size>8192)
  throw Error("migration-receipt-untrusted");
 const receipt=JSON.parse(await readFile(receiptPath,"utf8")) as SignedCurrentStateReceipt;
 const id=randomBytes(6).toString("hex");
 const name="smn_restore_test_newpc_"+id;
 const files=join(tmpdir(),"smn_restore_test_files_"+id);
 const adminUri=new URL(uri);adminUri.pathname="/postgres";
 const candidateUri=new URL(uri);candidateUri.pathname="/"+name;
 const live=new Client({connectionString:uri,connectionTimeoutMillis:3500});
 const admin=new Client({connectionString:adminUri.toString(),
  connectionTimeoutMillis:3500});
 let liveConnected=false,adminConnected=false;
 try{
  const backup=await inspectBackup(root,archiveId,key);
  if(backup.status!=="verified"||!backup.integrityVerified||
   !backup.scopeComplete||backup.schemaVersion!==33||
   !backup.createdAt||backup.createdAt!==receipt.payload?.archiveCreatedAt)
   throw Error("migration-imported-backup-unverified");
  const ledger=await readErasureLedger();
  if(await hasUnresolvedErasureIntent()||
   ledger.coverageStart>backup.createdAt||
   ledger.markers.some(m=>m.occurredAt>backup.createdAt!))
   throw Error("migration-ledger-not-reconciled");
  await live.connect();liveConnected=true;
  const tables=await live.query<{n:string}>(
   "SELECT count(*)::text AS n FROM pg_catalog.pg_tables WHERE schemaname='public'");
  if(tables.rows[0]?.n!=="0")throw Error("migration-live-destination-not-empty");
  await live.end();liveConnected=false;
  await admin.connect();adminConnected=true;
  const busy=await admin.query<{n:string}>(
   "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
   "WHERE datname='smn' AND pid<>pg_backend_pid()");
  if(busy.rows[0]?.n!=="0")throw Error("migration-live-destination-busy");
  const check=await admin.query<{n:string}>(
   "SELECT count(*)::text AS n FROM pg_catalog.pg_database "+
   "WHERE datname=ANY($1::text[])",[[name]]);
  if(check.rows[0]?.n!=="0")throw Error("migration-candidate-already-exists");
  // This creates only an empty disposable candidate. The installed "smn"
  // database is not replaced, dropped or written.
  await admin.query('CREATE DATABASE "'+name+'" OWNER "smn_owner"');
  const result=await rehearseBackupRestore({sourceUri:uri,
   sandboxUri:candidateUri.toString(),backupRoot:root,archiveId,
   stagingFilesOutput:files});
  if(result.status!=="reconstructed-in-sandbox"||
   result.missingDocumentReferences!==0||
   !result.databaseAndDocumentsConsistent||
   !result.fileSnapshotSha256)
   throw Error("migration-candidate-incomplete");
  const candidate=new Client({connectionString:candidateUri.toString(),
   connectionTimeoutMillis:3500,statement_timeout:120000});
  try{
   await candidate.connect();
   await candidate.query("BEGIN TRANSACTION READ ONLY");
   const fingerprint=await fingerprintPublicTables(candidate);
   await candidate.query("ROLLBACK");
   const staged=await inspectRestoreFileTree(files);
   const match=comparePortableCurrentState(receipt,key,{
    archiveId,databaseDigest:fingerprint.digest,
    filesDigest:staged.sha256,filesCount:staged.count,
    ledgerCoverageStart:ledger.coverageStart,
    ledgerHeadMac:ledger.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,
    ledgerCount:ledger.markers.length
   });
   if(!match.currentStateMatched)
    throw Error("migration-current-state-mismatch");
  }finally{
   await candidate.query("ROLLBACK").catch(()=>undefined);
   await candidate.end().catch(()=>undefined);
  }
  return {mode:"managed-candidate-prepared" as const,archiveId,
   candidateDb:name,stagedFiles:files,
   readyForOfflineCutoverReview:true as const,
   restorationAuthorized:false as const,activeDataModified:false as const,
   managedClusterCandidateCreated:true as const};
 }finally{
  key.fill(0);
  if(liveConnected)await live.end().catch(()=>undefined);
  if(adminConnected)await admin.end().catch(()=>undefined);
 }
}
async function main(){
 if(!process.env.SMN_BACKUP_DIR){
  try{process.loadEnvFile(".env.local");}catch{/* Default Windows root. */}
 }
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=="--prepare"||
  args[1]!=="--archive"||!VALID.test(args[2]))
  throw Error("migration-prepare-arguments-invalid");
 const result=await prepareFreshManagedCandidate(args[2],args[3]);
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\\/smn-40-managed-candidate-prepare\\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-candidate-unqualified",
   activeInstallationModified:false,restorationAuthorized:false})+"\n");
  process.exitCode=2;
 });
