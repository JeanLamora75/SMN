import {randomBytes} from "node:crypto";
import {open,appendFile,lstat,readdir,mkdir,cp,rename,readFile} from "node:fs/promises";
import {join,dirname,resolve} from "node:path";
import {Client} from "pg";
import {existingManagedUri} from "../bootstrap/portable";
import {managedStorageRoot} from "../bootstrap/managed-paths";
import {backupRootPath} from "./runner";
import {inspectBackup} from "./verification";
import {readErasureLedger} from "./erasure-ledger";
import {ERASURE_GENESIS_MAC} from "./erasure-evidence-format";
import {hasUnresolvedErasureIntent} from "./erasure-intent";
import {fingerprintPublicTables} from "./restore-row-fingerprint";
import {inspectRestoreFileTree} from "./restore-file-cutover-drill";
import {comparePortableCurrentState,type SignedCurrentStateReceipt}
 from "./current-state-transfer-receipt";
import {installedPrivateDocumentsDirectory} from "../documents/storage-path";
import {pdfArchiveDirectory} from "./extra-archives";
import {officeReportsDirectory} from "../reports/office-storage";
import {officeTemplatesDirectory} from "../reports/office-catalog";
import {inspectOfflineRestoreMaintenance} from "./restore-maintenance";

/**
 * External-operator ONLY. Promotes a VERIFIED candidate already restored into
 * the app-owned PostgreSQL 18 cluster. A fresh installation must have an EMPTY
 * "smn" database, empty managed file folders, and a current-state signed
 * receipt matching the candidate + transferred ledger.
 *
 * No endpoint exposes this function; the maintenance marker is NEVER removed.
 * It must remain until an independent operator checks the final state and
 * restarts the owned server with new in-memory sessions.
 */
const CANDIDATE=/^smn_restore_test_newpc_[a-f0-9]{8,16}$/;
const HEX=/^[a-f0-9]{64}$/;
type Stage="intent"|"files-promoted"|"source-parked"|"candidate-promoted"|
 "verified"|"rollback-started"|"rolled-back"|"incident";
type FileOperation={active:string;prepared:string;rollback:string;state:"ready"|"parked"|"promoted"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILES=["documents","report-pdfs","office-reports","office-templates"] as const;
function safeDbIdent(s:string){return '"'+s+'"';}
async function exists(path:string){
 try{return await lstat(path);}catch(e){
  if((e as NodeJS.ErrnoException).code==="ENOENT")return null;
  throw e;
 }
}
async function emptyFolder(path:string){
 const info=await exists(path);
 if(!info||!info.isDirectory()||info.isSymbolicLink()||
  (await readdir(path)).length!==0)throw Error("migration-destination-not-empty");
}
async function listDatabases(c:Client,names:string[]){
 const q=await c.query<{datname:string}>(
  "SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])",[names]);
 return new Set(q.rows.map(x=>x.datname));
}
async function noDbConnections(c:Client,names:string[]){
 const q=await c.query<{n:string}>(
  "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
  "WHERE datname=ANY($1::text[]) AND pid<>pg_backend_pid()",[names]);
 if(q.rows[0]?.n!=="0")throw Error("migration-database-busy");
}
function same(a:string,b:string){return resolve(a).toLowerCase()===resolve(b).toLowerCase();}
export type FreshInstallCutoverArgs=Readonly<{
 archiveId:string;candidateDb:string;stagedRoot:string;
 receiptPath:string;operatorJournalDir:string;
}>;
export function validateFreshInstallPaths(
 cwd:string,a:FreshInstallCutoverArgs
):boolean{
 if(!UUID.test(a.archiveId)||!CANDIDATE.test(a.candidateDb)||
  !a.stagedRoot.startsWith(resolve(cwd))&&
   !a.stagedRoot.startsWith(resolve(process.env.TEMP??"__never__"))){
  // Staging may be in the system temporary directory; physical file
  // verification below is still mandatory.
  return false;
 }
 return resolve(a.stagedRoot)===a.stagedRoot&&
  resolve(a.receiptPath)===a.receiptPath&&
  resolve(a.operatorJournalDir)===a.operatorJournalDir;
}
/**
 * No injected boolean can override the signed proof or the observed pristine
 * destination. On failure, the coordinator attempts reverse renames and
 * retains the maintenance marker; ambiguous states require manual recovery.
 */
export async function activateFreshManagedInstallation(a:FreshInstallCutoverArgs){
 if(process.platform!=="win32"||
  process.env.SMN_DATABASE_URL||
  !process.env.SMN40_FRESH_INSTALL_OFFLINE_CONFIRM||
  process.env.SMN40_FRESH_INSTALL_OFFLINE_CONFIRM!=="ACTIVATE_VERIFIED_PRISTINE_DESTINATION"||
  !validateFreshInstallPaths(process.cwd(),a))
  throw Error("migration-activation-not-enabled");
 const marker=await inspectOfflineRestoreMaintenance();
 if(!marker||marker.purpose!=="offline-restore")
  throw Error("migration-maintenance-required");
 const installed=await existingManagedUri();
 if(!installed)throw Error("migration-owned-runtime-unavailable");
 const url=new URL(installed);
 if(url.hostname!=="127.0.0.1"||
  decodeURIComponent(url.pathname)!=="/smn"||!url.port||!url.username)
  throw Error("migration-owned-runtime-invalid");
 const candidate=new URL(installed);candidate.pathname="/"+a.candidateDb;
 const adminUri=new URL(installed);adminUri.pathname="/postgres";
 const admin=new Client({connectionString:adminUri.toString(),
  connectionTimeoutMillis:3500,statement_timeout:12000});
 const source=new Client({connectionString:installed,connectionTimeoutMillis:3500,
  statement_timeout:12000});
 const target=new Client({connectionString:candidate.toString(),
  connectionTimeoutMillis:3500,statement_timeout:120000});
 const keyPath=join(backupRootPath(),".backup-key");
 const keyInfo=await lstat(keyPath);
 if(!keyInfo.isFile()||keyInfo.isSymbolicLink()||keyInfo.size!==32)
  throw Error("migration-backup-key-invalid");
 const key=await readFile(keyPath);
 const session=randomBytes(6).toString("hex");
 const rollbackDb="smn_restore_test_back_"+session;
 const managed=managedStorageRoot();
 const root=process.cwd();
 const actual=[
  installedPrivateDocumentsDirectory(),pdfArchiveDirectory(),
  officeReportsDirectory(),officeTemplatesDirectory()
 ];
 const defaults=[
  join(root,"data","documents"),
  join(root,".smn-private","report-archives"),
  join(root,"data","office","reports"),
  join(root,"data","office","templates")
 ];
 if(actual.some((dir,i)=>!same(dir,defaults[i]))||
  !same(join(managed,"data"),join(root,"data","postgres","data")))
  throw Error("migration-custom-or-unowned-storage");
 const operations:FileOperation[]=actual.map(active=>({
  active,prepared:active+".smn-newpc-prepared-"+session,
  rollback:active+".smn-newpc-rollback-"+session,state:"ready"
 }));
 let locked=false,adminReady=false,sourceReady=false,targetReady=false;
 let parkedDb=false,promotedDb=false,writing=false;
 let journal:string|null=null;
 const record=async(stage:Stage)=>{
  if(!journal)throw Error("migration-journal-missing");
  const handle=await open(journal,"a",0o600);
  try{
   await handle.writeFile(JSON.stringify({
    version:1,archiveId:a.archiveId,stage,at:new Date().toISOString()
   })+"\n");
   await handle.sync();
  }finally{await handle.close();}
 };
 const rollbackFiles=async()=>{
  for(const op of operations.slice().reverse()){
   if(op.state==="promoted"){
    if(await exists(op.prepared))throw Error("migration-rollback-files-ambiguous");
    await rename(op.active,op.prepared);
    op.state="parked";
   }
   if(op.state==="parked"){
    if(await exists(op.active))throw Error("migration-rollback-files-ambiguous");
    await rename(op.rollback,op.active);
    op.state="ready";
   }
  }
 };
 try{
  if(key.length!==32)throw Error("migration-backup-key-invalid");
  const proofStat=await lstat(a.receiptPath);
  if(!proofStat.isFile()||proofStat.isSymbolicLink()||
   proofStat.size<50||proofStat.size>8192)throw Error("migration-receipt-invalid");
  const proof=JSON.parse(await readFile(a.receiptPath,"utf8")) as SignedCurrentStateReceipt;
  const packageInfo=await inspectBackup(backupRootPath(),a.archiveId,key);
  if(packageInfo.status!=="verified"||!packageInfo.integrityVerified||
   !packageInfo.scopeComplete||packageInfo.schemaVersion!==33)
   throw Error("migration-archive-unverified");
  const ledger=await readErasureLedger();
  if(await hasUnresolvedErasureIntent()||
   !packageInfo.createdAt||
   ledger.coverageStart>packageInfo.createdAt||
   ledger.markers.some(m=>m.occurredAt>packageInfo.createdAt!))
   throw Error("migration-erasure-window-unqualified");
  await source.connect();sourceReady=true;
  await target.connect();targetReady=true;
  await source.query("BEGIN TRANSACTION READ ONLY");
  const tables=await source.query<{n:string}>(
   "SELECT count(*)::text AS n FROM pg_catalog.pg_tables WHERE schemaname='public'");
  await source.query("ROLLBACK");
  if(tables.rows[0]?.n!=="0")throw Error("migration-destination-database-not-empty");
  await target.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const version=await target.query<{v:string}>(
   "SELECT current_setting('server_version') AS v");
  if(!version.rows[0]?.v.startsWith("18."))
   throw Error("migration-pg18-required");
  const database=await fingerprintPublicTables(target);
  await target.query("ROLLBACK");
  const staged=await inspectRestoreFileTree(a.stagedRoot);
  const verdict=comparePortableCurrentState(proof,key,{
   archiveId:a.archiveId,databaseDigest:database.digest,
   filesDigest:staged.sha256,filesCount:staged.count,
   ledgerCoverageStart:ledger.coverageStart,
   ledgerHeadMac:ledger.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,
   ledgerCount:ledger.markers.length
  });
  if(!verdict.currentStateMatched||
   packageInfo.createdAt!==proof.payload?.archiveCreatedAt)
   throw Error("migration-source-candidate-differ");
  for(const op of operations){
   await emptyFolder(op.active);
   if(await exists(op.prepared)||await exists(op.rollback))
    throw Error("migration-cutover-path-occupied");
  }
  await admin.connect();adminReady=true;
  const initial=await listDatabases(admin,["smn",a.candidateDb,rollbackDb]);
  if(!initial.has("smn")||!initial.has(a.candidateDb)||initial.has(rollbackDb))
   throw Error("migration-database-state-invalid");
  // Existing target connections (including this preflight) are closed before
  // mutating DB names, and never reopened until the cutover finishes.
  await target.end();targetReady=false;
  await source.end();sourceReady=false;
  await noDbConnections(admin,["smn",a.candidateDb]);
  await mkdir(a.operatorJournalDir,{recursive:false,mode:0o700}).catch(e=>{
   if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;
  });
  const js=await lstat(a.operatorJournalDir);
  if(!js.isDirectory()||js.isSymbolicLink()||
   !resolve(a.operatorJournalDir).startsWith(resolve(process.cwd())))
   throw Error("migration-journal-dir-invalid");
  journal=join(a.operatorJournalDir,"migration-"+session+".jsonl");
  await (await open(journal,"wx",0o600)).close();
  await record("intent");
  // Stage files beside their target directories: the eventual rename is on
  // the same filesystem even when the OS TEMP volume is different.
  for(let i=0;i<operations.length;i++){
   const op=operations[i],sourceFolder=join(a.stagedRoot,FILES[i]);
   const old=await exists(sourceFolder);
   if(old){
    if(!old.isDirectory()||old.isSymbolicLink())
     throw Error("migration-staged-files-untrusted");
    await cp(sourceFolder,op.prepared,{recursive:true,force:false,errorOnExist:true});
   }else await mkdir(op.prepared,{mode:0o700});
  }
  // Database lock prevents another SMN offline cutover in the managed cluster.
  const l=await admin.query<{ok:boolean}>(
   "SELECT pg_try_advisory_lock(20261111,40) AS ok");
  if(l.rows[0]?.ok!==true)throw Error("migration-cutover-busy");
  locked=true;
  await noDbConnections(admin,["smn",a.candidateDb]);
  writing=true;
  for(const op of operations){
   await rename(op.active,op.rollback);op.state="parked";
   await rename(op.prepared,op.active);op.state="promoted";
  }
  await record("files-promoted");
  await admin.query("ALTER DATABASE "+safeDbIdent("smn")+
   " RENAME TO "+safeDbIdent(rollbackDb));
  parkedDb=true;await record("source-parked");
  await admin.query("ALTER DATABASE "+safeDbIdent(a.candidateDb)+
   " RENAME TO "+safeDbIdent("smn"));
  promotedDb=true;await record("candidate-promoted");
  const final=await listDatabases(admin,["smn",a.candidateDb,rollbackDb]);
  if(!final.has("smn")||final.has(a.candidateDb)||!final.has(rollbackDb))
   throw Error("migration-cutover-verification-failed");
  await record("verified");
  // Leave the externally-owned maintenance marker in place. All old SMN
  // sessions were in the now-stopped web process, never transferred.
  return {mode:"fresh-install-offline-cutover" as const,archiveId:a.archiveId,
   state:"verified" as const,rollbackDatabasePreserved:true as const,
   rollbackFilesPreserved:true as const,maintenanceMustRemain:true as const,
   externalOperatorReviewRequired:true as const};
 }catch{
  if(writing){
   try{
    await record("rollback-started");
    if(promotedDb){
     await noDbConnections(admin,["smn",rollbackDb]);
     await admin.query("ALTER DATABASE "+safeDbIdent("smn")+
      " RENAME TO "+safeDbIdent(a.candidateDb));
     promotedDb=false;
    }
    if(parkedDb){
     await noDbConnections(admin,[rollbackDb,"smn"]);
     await admin.query("ALTER DATABASE "+safeDbIdent(rollbackDb)+
      " RENAME TO "+safeDbIdent("smn"));
     parkedDb=false;
    }
    await rollbackFiles();
    await record("rolled-back");
   }catch{
    await record("incident").catch(()=>undefined);
    throw Error("migration-manual-recovery-required");
   }
  }
  throw Error("migration-activation-denied");
 }finally{
  key.fill(0);
  if(locked&&adminReady)await admin.query(
   "SELECT pg_advisory_unlock(20261111,40)").catch(()=>undefined);
  if(sourceReady)await source.end().catch(()=>undefined);
  if(targetReady)await target.end().catch(()=>undefined);
  if(adminReady)await admin.end().catch(()=>undefined);
 }
}
