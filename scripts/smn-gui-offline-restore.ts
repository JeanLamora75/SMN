/**
 * SMN-442 — Launcher-owned, OFFLINE GUI restoration.
 * No PowerShell, pnpm, IDE, CLI or password argument on the user's computer.
 * The HTTP server must already have stopped. A signed job is consumed once.
 * Original destination PostgreSQL and private files remain parked for rollback.
 */
import {Client} from "pg";
import {readFile,lstat,rename,writeFile,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {decryptSetting} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {backupRootPath} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {fingerprintPublicTables} from "../src/server/backup/restore-row-fingerprint";
import {fingerprintCurrentManagedFiles} from "../src/server/backup/current-managed-file-fingerprint";
import {inspectGuiLedgerEvidence} from "../src/server/backup/gui-transfer-evidence";
import {comparePortableCurrentState,type SignedCurrentStateReceipt}
 from "../src/server/backup/current-state-transfer-receipt";
import {installGuiPrivacyEvidence,parkGuiPrivacyEvidence}
 from "../src/server/backup/gui-privacy-install";
import {beginOfflineRestoreMaintenance,inspectOfflineRestoreMaintenance,
 localRestoreMaintenanceLockPath,restoreMaintenanceMarkerPath}
 from "../src/server/backup/restore-maintenance";
import {prepareFreshManagedCandidate}
 from "./smn-40-managed-candidate-prepare";
import {activateFreshManagedInstallation}
 from "../src/server/backup/fresh-install-cutover";
import {inspectOfflineCutoverJournal}
 from "./smn-40-cutover-postcheck";
import {rollbackVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-rollback";
import {releaseVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-release";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type Job={version:1;token:string;archiveId:string;destination:string;
 destinationDigest:string;destinationFilesDigest:string;
 destinationFilesCount:number;
 requestedAt:string;operation:"gui-portable-restore"};
type Stage="queued"|"fenced"|"privacy-installed"|"candidate-prepared"|
 "activating"|"promoted"|"complete"|"rolled-back"|"incident"|"failed";
const root=process.cwd();
const updates=join(root,"updates"),pending=join(updates,"migration-pending.json");
const statusFile=join(updates,"migration-status.json");
const statFile=async(path:string,max:number)=>{
 const st=await lstat(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size<20||st.size>max)
  throw Error("gui-migration-operator-file-untrusted");
};
export const status=async(token:string,stage:Stage)=>{
 const tmp=join(updates,"migration-status-"+token+".tmp");
 await writeFile(tmp,JSON.stringify({version:1,token,stage,
  recordedAt:new Date().toISOString()})+"\n",{flag:"wx",mode:0o600});
 await rename(tmp,statusFile);
};
export async function identity(){
 const uri=await existingManagedUri();
 if(!uri)throw Error("gui-migration-owned-db-required");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:12000});
 try{
  await db.connect();
  const rows=await db.query<{state:string;schema_version:number;created_at:Date}>(
   "SELECT state,schema_version,created_at FROM public.smn_installation "+
   "WHERE id='singleton'");
  const row=rows.rows[0];
  if(rows.rowCount!==1||row?.state!=="initialized"||
   row.schema_version!==33||!row.created_at)
   throw Error("gui-migration-destination-unverified");
  return "singleton:"+new Date(row.created_at).toISOString();
 }finally{await db.end().catch(()=>undefined);}
}
export async function fingerprintDestination(){
 const uri=await existingManagedUri();
 if(!uri)throw Error("gui-migration-target-unavailable");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,query_timeout:120000});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const database=await fingerprintPublicTables(db);
  const files=await fingerprintCurrentManagedFiles(db);
  await db.query("ROLLBACK");
  return {database:database.digest,files:files.sha256,count:files.count};
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
export async function signedJob():Promise<Job>{
 await statFile(pending,4096);
 const serialized=JSON.parse(await readFile(pending,"utf8")) as {
  version?:number;sealed?:string
 };
 if(serialized.version!==1||typeof serialized.sealed!=="string"||
  serialized.sealed.length>3000)
  throw Error("gui-migration-pending-invalid");
 const job=JSON.parse(await decryptSetting(serialized.sealed)) as Job;
 if(job.version!==1||job.operation!=="gui-portable-restore"||
  !UUID.test(job.token)||!UUID.test(job.archiveId)||
  !/^singleton:\d{4}-\d\d-\d\dT/.test(job.destination)||
  !Number.isFinite(Date.parse(job.requestedAt))||
  !/^[a-f0-9]{64}$/.test(job.destinationDigest)||
  !/^[a-f0-9]{64}$/.test(job.destinationFilesDigest)||
  !Number.isSafeInteger(job.destinationFilesCount)||
  job.destinationFilesCount<0)
  throw Error("gui-migration-job-invalid");
 return job;
}
/** Archive both fences on a known-safe pre-cutover failure or a verified
 * rollback. Do not call this when the database state is ambiguous.
 */
export async function cancelSafeFence(token:string){
 const marker=await inspectOfflineRestoreMaintenance();
 const external=restoreMaintenanceMarkerPath();
 if(!marker||marker.purpose!=="offline-restore"||!external)
  throw Error("gui-migration-cancel-fence-unverified");
 const local=localRestoreMaintenanceLockPath();
 await statFile(local,2048);
 const v=JSON.parse(await readFile(local,"utf8")) as {operationId?:string};
 if(v.operationId!==marker.operationId)
  throw Error("gui-migration-cancel-fence-mismatch");
 await rename(external,external+".cancelled-"+token);
 await rename(local,local+".cancelled-"+token);
}
export async function archivePending(job:Job,outcome:"complete"|"failed"){
 await rename(pending,join(updates,
  "migration-pending."+outcome+"-"+job.token+".json"));
}
/** Entry point is called ONLY by the owning launcher, after its web child
 * has exited. Never use an arbitrary file path from browser-supplied data.
 */
export async function runGuiOfflineRestore(){
 if(process.platform!=="win32"||process.env.SMN_DATABASE_URL)
  throw Error("gui-migration-not-portable");
 const job=await signedJob();
 const token=job.token,archiveId=job.archiveId;
 const inbox=join(root,"data","migration-inbox");
 const work=join(root,"data","migration-work",token);
 const receiptPath=join(inbox,token+".tar.gz.receipt.json");
 const ledgerPath=join(inbox,token+".tar.gz.privacy.enc");
 const keyPath=join(work,".backup-key");
 let phase:Stage="queued",journal:string|null=null,privacyInstalled=false;
 let fence=false;
 let beforeActivation:Awaited<ReturnType<typeof fingerprintDestination>>|null=null;
 await status(token,"queued");
 try{
  const state=await identity();
  if(state!==job.destination)throw Error("gui-migration-destination-changed");
  const present=await fingerprintDestination();
  if(present.database!==job.destinationDigest||
   present.files!==job.destinationFilesDigest||
   present.count!==job.destinationFilesCount)
   throw Error("gui-migration-destination-drift");
  for(const filename of [receiptPath,ledgerPath,keyPath,
   join(inbox,token+".verified.json")])
   await statFile(filename,filename===ledgerPath?24*1024*1024:8192);
  const key=await readFile(keyPath);
  try{
   if(key.length!==32)throw Error("gui-migration-backup-key-invalid");
   const backup=await inspectBackup(work,archiveId,key);
   if(backup.status!=="verified"||!backup.integrityVerified||
    !backup.scopeComplete||backup.schemaVersion!==33||
    !backup.createdAt||backup.installationSource===job.destination)
    throw Error("gui-migration-backup-unverified");
   const receipt=JSON.parse(await readFile(receiptPath,"utf8")) as SignedCurrentStateReceipt;
   const encrypted=JSON.parse(await readFile(ledgerPath,"utf8")) as unknown;
   const ledger=inspectGuiLedgerEvidence(encrypted,key);
   try{
    if(receipt.payload?.archiveId!==archiveId||
     receipt.payload.archiveCreatedAt!==backup.createdAt||
     ledger.coverageStart>backup.createdAt||
     ledger.latestEventAt&&ledger.latestEventAt>backup.createdAt)
     throw Error("gui-migration-source-window-invalid");
    const match=comparePortableCurrentState(receipt,key,{
     archiveId,databaseDigest:receipt.payload.databaseDigest,
     filesDigest:receipt.payload.filesDigest,filesCount:receipt.payload.filesCount,
     ledgerCoverageStart:ledger.coverageStart,
     ledgerHeadMac:ledger.headMac,ledgerCount:ledger.markers
    });
    if(!match.currentStateMatched)
     throw Error("gui-migration-source-receipt-invalid");
   }finally{ledger.ledgerKey.fill(0);}
  }finally{key.fill(0);}
  process.env.SMN_RESTORE_MAINTENANCE_MARKER=join(tmpdir(),
   "smn-gui-restore-"+token+".marker");
  await beginOfflineRestoreMaintenance();
  fence=true;phase="fenced";
  await status(token,phase);
  const privacyKey=await readFile(keyPath);
  try{
   const encrypted=JSON.parse(await readFile(ledgerPath,"utf8")) as unknown;
   privacyInstalled=true;
   await installGuiPrivacyEvidence(encrypted,privacyKey,token);
  }finally{privacyKey.fill(0);}
  phase="privacy-installed";await status(token,phase);
  process.env.SMN_BACKUP_DIR=work;
  process.env.SMN40_MANAGED_PREPARE_CONFIRM=
   "PREPARE_REPLACEMENT_WITH_ROLLBACK";
  const candidate=await prepareFreshManagedCandidate(archiveId,receiptPath,true);
  phase="candidate-prepared";await status(token,phase);
  // The source receipt is cryptographically verified against the isolated
  // candidate by prepareFreshManagedCandidate above.
  beforeActivation=await fingerprintDestination();
  if(beforeActivation.database!==job.destinationDigest||
   beforeActivation.files!==job.destinationFilesDigest||
   beforeActivation.count!==job.destinationFilesCount)
   throw Error("gui-migration-destination-drift-before-activation");
  process.env.SMN40_FRESH_INSTALL_OFFLINE_CONFIRM=
   "REPLACE_VERIFIED_INITIALIZED_DESTINATION_WITH_ROLLBACK";
  phase="activating";await status(token,phase);
  const active=await activateFreshManagedInstallation({
   archiveId,candidateDb:candidate.candidateDb,
   stagedRoot:candidate.stagedFiles,receiptPath,
   operatorJournalDir:join(root,"data","migration-audit"),
   replaceInitializedDestination:true
  });
  journal=active.journalPath;
  phase="promoted";await status(token,phase);
  await inspectOfflineCutoverJournal(journal,receiptPath);
  process.env.SMN40_RELEASE_OFFLINE_CONFIRM=
   "INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED";
  await releaseVerifiedNewComputerCutover(journal,receiptPath);
  fence=false;
  phase="complete";
  await status(token,phase).catch(()=>undefined);
  await archivePending(job,"complete").catch(()=>undefined);
  return {state:phase,archiveId,rollbackRetained:true,
   allUsersMustLogInAgain:true};
 }catch{
  if(phase==="activating"&&fence&&beforeActivation){
   try{
    const after=await fingerprintDestination();
    phase=after.database===beforeActivation.database&&
     after.files===beforeActivation.files&&after.count===beforeActivation.count?
      "rolled-back":"incident";
   }catch{phase="incident";}
  }
  if(phase==="promoted"&&journal&&fence){
   try{
    process.env.SMN40_ROLLBACK_OFFLINE_CONFIRM=
     "ROLLBACK_VERIFIED_NEWPC_CUTOVER";
    await rollbackVerifiedNewComputerCutover(journal,receiptPath);
    const returned=await fingerprintDestination();
    if(!beforeActivation||returned.database!==beforeActivation.database||
     returned.files!==beforeActivation.files||
     returned.count!==beforeActivation.count)
     throw Error("gui-migration-rollback-fingerprint-mismatch");
    phase="rolled-back";
   }catch{phase="incident";}
  }
  // Before activation, or after a VERIFIED rollback, the original database
  // was not replaced or has been restored; release can be done safely.
  if(fence&&(["fenced","privacy-installed","candidate-prepared","rolled-back"] as Stage[]).includes(phase)){
   try{
    if(privacyInstalled)await parkGuiPrivacyEvidence(token);
    await cancelSafeFence(token);
    fence=false;
   }catch{phase="incident";}
  }
  if(phase!=="incident"&&phase!=="rolled-back")phase="failed";
  await status(token,phase).catch(()=>undefined);
  if(phase!=="incident")await archivePending(job,"failed").catch(()=>undefined);
  throw Error(phase==="incident"?"gui-migration-manual-recovery-required":
   "gui-migration-rolled-back-or-not-started");
 }finally{
  for(const env of [
   "SMN40_MANAGED_PREPARE_CONFIRM",
   "SMN40_FRESH_INSTALL_OFFLINE_CONFIRM",
   "SMN40_ROLLBACK_OFFLINE_CONFIRM",
   "SMN40_RELEASE_OFFLINE_CONFIRM",
   "SMN_RESTORE_MAINTENANCE_MARKER","SMN_BACKUP_DIR"
  ])delete process.env[env];
 }
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-gui-offline-restore\.(?:ts|mjs)$/))
 runGuiOfflineRestore().then(result=>{
  process.stdout.write(JSON.stringify(result)+"\n");
 }).catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"gui-offline-restore-failed",
   manualReviewMayBeRequired:true})+"\n");
  process.exitCode=2;
 });
