/**
 * Independent new-PC migration receipt.
 * SOURCE --capture: the original SMN PostgreSQL database must be stopped for
 * writes and a maintenance marker installed by an external operator.
 * DESTINATION --verify: compares the signed source receipt against the
 * restored candidate and the independently imported erasure ledger.
 *
 * Source and destination do not connect to each other. No active promotion.
 * Secrets and personal records never appear in output.
 */
import {Client} from "pg";
import {readFile,lstat,writeFile} from "node:fs/promises";
import {isAbsolute,resolve,join} from "node:path";
import {backupRootPath} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {fingerprintPublicTables} from "../src/server/backup/restore-row-fingerprint";
import {fingerprintCurrentManagedFiles} from "../src/server/backup/current-managed-file-fingerprint";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {ERASURE_GENESIS_MAC} from "../src/server/backup/erasure-evidence-format";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {inspectOfflineRestoreMaintenance}
 from "../src/server/backup/restore-maintenance";
import {signCurrentStateReceipt,comparePortableCurrentState,
 type SignedCurrentStateReceipt}
 from "../src/server/backup/current-state-transfer-receipt";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TEST=/^smn_restore_test_newpc_[a-f0-9]{8,16}$/;
function databaseUrl(value:string|undefined,mode:"source"|"candidate"):string{
 if(!value)throw Error("migration-db-uri-missing");
 const u=new URL(value);
 const db=decodeURIComponent(u.pathname.slice(1));
 if(!["postgres:","postgresql:"].includes(u.protocol)||
  u.hostname!=="127.0.0.1"||!u.username||!u.password||
  u.search||u.hash||!u.port||
  (mode==="source"&&db!=="smn")||
  (mode==="candidate"&&(!TEST.test(db)||Number(u.port)<57190||
    Number(u.port)>57250)))
  throw Error("migration-db-uri-invalid");
 return value;
}
async function backupKey():Promise<Buffer>{
 const path=join(backupRootPath(),".backup-key");
 const st=await lstat(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size!==32)
  throw Error("migration-key-untrusted");
 return readFile(path);
}
async function snapshot(db:Client){
 await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 const v=await db.query<{version:string}>(
  "SELECT current_setting('server_version') AS version");
 if(!v.rows[0]?.version.startsWith("18."))throw Error("migration-pg18-required");
 return fingerprintPublicTables(db);
}
async function checkNoWriters(db:Client):Promise<string>{
 const connections=await db.query<{n:string}>(
  "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
  "WHERE datname=current_database() AND pid<>pg_backend_pid()");
 if(connections.rows[0]?.n!=="0")throw Error("migration-live-connections");
 const q=await db.query<{lsn:string}>("SELECT pg_current_wal_lsn()::text AS lsn");
 if(!q.rows[0]?.lsn)throw Error("migration-wal-unavailable");
 return q.rows[0].lsn;
}
async function verifiedLedger(archiveCreatedAt:string){
 const ledger=await readErasureLedger();
 if(await hasUnresolvedErasureIntent()||ledger.coverageStart>archiveCreatedAt||
  ledger.markers.some(m=>m.occurredAt>archiveCreatedAt))
  throw Error("migration-erasure-window-unqualified");
 return {coverageStart:ledger.coverageStart,
  headMac:ledger.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,
  count:ledger.markers.length};
}
async function capture(archiveId:string,output:string){
 if(!isAbsolute(output)||resolve(output)!==output||!output.endsWith(".json"))
  throw Error("migration-receipt-output-invalid");
 // External maintenance marker is only a fence; the PG session and WAL
 // checks below remain mandatory and do not independently prove all writers
 // stopped forever.
 const maintenance=await inspectOfflineRestoreMaintenance();
 if(!maintenance||maintenance.purpose!=="offline-restore")
  throw Error("migration-maintenance-required");
 const uri=databaseUrl(process.env.SMN40_CURRENT_SOURCE_URL,"source");
 const key=await backupKey();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-crosspc-current-source"});
 try{
  const item=await inspectBackup(backupRootPath(),archiveId,key);
  if(item.status!=="verified"||!item.integrityVerified||!item.scopeComplete||
   item.schemaVersion!==33||!item.createdAt)throw Error("migration-backup-unverified");
  const firstLedger=await verifiedLedger(item.createdAt);
  await db.connect();
  const before=await checkNoWriters(db);
  const tables=await snapshot(db);
  const files=await fingerprintCurrentManagedFiles(db);
  const after=await checkNoWriters(db);
  const lastLedger=await verifiedLedger(item.createdAt);
  if(before!==after||JSON.stringify(firstLedger)!==JSON.stringify(lastLedger))
   throw Error("migration-source-changed-during-snapshot");
  const proof=signCurrentStateReceipt({
   version:1,purpose:"frozen-current-state-migration",archiveId,
   archiveCreatedAt:item.createdAt,measuredAt:new Date().toISOString(),
   schemaVersion:33,databaseDigest:tables.digest,filesDigest:files.sha256,
   filesCount:files.count,ledgerCoverageStart:lastLedger.coverageStart,
   ledgerHeadMac:lastLedger.headMac,ledgerCount:lastLedger.count
  },key);
  await writeFile(output,JSON.stringify(proof)+"\n",{flag:"wx",mode:0o600});
  return {mode:"source-receipt-captured",archiveId,
   tableCount:tables.tables.length,managedFiles:files.count,
   sourceMaintenanceMarkerSeen:true,
   sourceFreezeIndependentlyAttested:false,
   restorationAuthorized:false};
 }finally{
  key.fill(0);
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function verify(archiveId:string,input:string){
 if(!isAbsolute(input)||resolve(input)!==input||!input.endsWith(".json"))
  throw Error("migration-receipt-input-invalid");
 const stat=await lstat(input);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<50||stat.size>8192)
  throw Error("migration-receipt-untrusted");
 const proof=JSON.parse(await readFile(input,"utf8")) as SignedCurrentStateReceipt;
 const uri=databaseUrl(process.env.SMN40_NEWPC_SANDBOX_URL,"candidate");
 const staged=process.env.SMN40_NEWPC_STAGING_DIR;
 if(!staged||!isAbsolute(staged)||resolve(staged)!==staged||
  !/[/\\]smn_restore_test_files_[a-z0-9]{6,40}$/.test(staged))
  throw Error("migration-staging-invalid");
 const key=await backupKey();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-crosspc-candidate"});
 try{
  const item=await inspectBackup(backupRootPath(),archiveId,key);
  if(item.status!=="verified"||!item.integrityVerified||!item.scopeComplete)
   throw Error("migration-backup-unverified");
  const ledger=await verifiedLedger(item.createdAt!);
  await db.connect();
  const tables=await snapshot(db);
  const files=await inspectRestoreFileTree(staged);
  const verdict=comparePortableCurrentState(proof,key,{
   archiveId,databaseDigest:tables.digest,
   filesDigest:files.sha256,filesCount:files.count,
   ledgerCoverageStart:ledger.coverageStart,ledgerHeadMac:ledger.headMac,
   ledgerCount:ledger.count
  });
  return {mode:"candidate-receipt-checked",...verdict,
   sourceFreezeIndependentlyAttested:false,
   activeInstallationModified:false};
 }finally{
  key.fill(0);
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 if(!process.env.SMN_BACKUP_DIR){
  try{process.loadEnvFile(".env.local");}catch{/* Default Windows backup root. */}
 }
 const args=process.argv.slice(2);
 if(args.length!==4||!["--capture","--verify"].includes(args[0])||
  args[1]!=="--archive"||!UUID.test(args[2]))
  throw Error("migration-receipt-arguments-invalid");
 const result=args[0]==="--capture"?
  await capture(args[2],args[3]):await verify(args[2],args[3]);
 process.stdout.write(JSON.stringify(result)+"\n");
 if("currentStateMatched" in result&&!result.currentStateMatched)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\\/smn-40-cross-pc-receipt\\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-receipt-unverifiable",
   restorationAuthorized:false,activeInstallationModified:false})+"\n");
  process.exitCode=2;
 });
