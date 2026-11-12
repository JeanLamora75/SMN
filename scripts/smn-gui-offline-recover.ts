/**
 * SMN-442 — recovery after process/Windows interruption.
 * Owned by the launcher, never called from an HTTP request. If and ONLY if
 * the original data are fingerprint-identical, safely remove the fence.
 * If a signed verified cutover is present, finish verification/release or
 * restore the parked original. Ambiguous partial renames stay fenced.
 */
import {readFile,lstat,readdir,rename} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {readFreshCutoverJournal} from "../src/server/backup/fresh-cutover-journal";
import {comparePortableCurrentState,type SignedCurrentStateReceipt} from "../src/server/backup/current-state-transfer-receipt";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {ERASURE_GENESIS_MAC} from "../src/server/backup/erasure-evidence-format";
import {inspectOfflineCutoverJournal} from "./smn-40-cutover-postcheck";
import {rollbackVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-rollback";
import {releaseVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-release";
import {parkGuiPrivacyEvidence} from "../src/server/backup/gui-privacy-install";
import {localRestoreMaintenanceLockPath}
 from "../src/server/backup/restore-maintenance";
import {signedJob,identity,fingerprintDestination,cancelSafeFence,
 archivePending,status,type Job} from "./smn-gui-offline-restore";

const root=process.cwd();
const updates=join(root,"updates");
const pending=join(updates,"migration-pending.json");
const exists=async(path:string)=>lstat(path).then(()=>true).catch(e=>{
 if((e as NodeJS.ErrnoException).code==="ENOENT")return false;
 throw e;
});
async function verifyOriginal(job:Job){
 try{
  if(await identity()!==job.destination)return false;
  const current=await fingerprintDestination();
  return current.database===job.destinationDigest&&
   current.files===job.destinationFilesDigest&&
   current.count===job.destinationFilesCount;
 }catch{return false;}
}
async function cancelPartialFence(job:Job){
 const local=localRestoreMaintenanceLockPath();
 const external=process.env.SMN_RESTORE_MAINTENANCE_MARKER!;
 if(!await exists(local))throw Error("gui-recovery-local-fence-missing");
 const st=await lstat(local);
 if(!st.isFile()||st.isSymbolicLink()||st.size<20||st.size>2048)
  throw Error("gui-recovery-local-fence-untrusted");
 const record=JSON.parse(await readFile(local,"utf8")) as {
  version?:number;operationId?:string;purpose?:string
 };
 if(record.version!==1||record.purpose!=="offline-restore"||
  !/^[a-f0-9-]{36}$/i.test(record.operationId??""))
  throw Error("gui-recovery-local-fence-invalid");
 if(await exists(external)){
  const remote=await lstat(external);
  if(!remote.isFile()||remote.isSymbolicLink()||
   remote.size<20||remote.size>2048)
   throw Error("gui-recovery-external-fence-untrusted");
  const mark=JSON.parse(await readFile(external,"utf8")) as {
   operationId?:string;purpose?:string
  };
  if(mark.operationId!==record.operationId||
   mark.purpose!=="offline-restore")
   throw Error("gui-recovery-fence-mismatch");
  await rename(external,external+".cancelled-"+job.token);
 }
 await rename(local,local+".cancelled-"+job.token);
}
async function lastVerifiedJournal(job:Job,key:Buffer){
 const folder=join(root,"data","migration-audit");
 const names=await readdir(folder).catch(e=>{
  if((e as NodeJS.ErrnoException).code==="ENOENT")return [] as string[];
  throw e;
 });
 const matching:string[]=[];
 for(const name of names){
  if(!/^migration-[a-f0-9]{12}\.jsonl$/.test(name))continue;
  const file=join(folder,name),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>128*1024)
   throw Error("gui-recovery-journal-untrusted");
  const first=(await readFile(file,"utf8")).split("\n",1)[0];
  let event:unknown;
  try{event=JSON.parse(first);}catch{throw Error("gui-recovery-journal-corrupt");}
  if((event as {archiveId?:string})?.archiveId!==job.archiveId)continue;
  const events=await readFreshCutoverJournal(file,key);
  if(events.at(-1)?.stage==="verified")matching.push(file);
 }
 if(matching.length>1)throw Error("gui-recovery-journal-ambiguous");
 return matching[0]??null;
}
/** Post-release recovery: both archived markers, signed journal and source
 * fingerprints must agree. A status file by itself is never proof of cutover.
 */
async function verifyAlreadyReleased(job:Job,key:Buffer){
 const archived=(await readdir(updates)).filter(name=>
  /^restore-maintenance\\.released-[a-f0-9-]{36}\\.json$/.test(name));
 const matching:string[]=[];
 for(const name of archived){
  const operation=name.slice("restore-maintenance.released-".length,-".json".length);
  const external=join(tmpdir(),"smn-gui-restore-"+job.token+
   ".marker.released-"+operation);
  if(await exists(external))matching.push(name);
 }
 if(matching.length!==1)return false;
 const localPath=join(updates,matching[0]),localStat=await lstat(localPath);
 if(!localStat.isFile()||localStat.isSymbolicLink()||
  localStat.size<20||localStat.size>2048)return false;
 const localRecord=JSON.parse(await readFile(localPath,"utf8")) as {
  version?:number;purpose?:string;operationId?:string
 };
 if(localRecord.version!==1||localRecord.purpose!=="offline-restore"||
  matching[0]!=="restore-maintenance.released-"+localRecord.operationId+".json")
  return false;
 const outside=join(tmpdir(),"smn-gui-restore-"+job.token+".marker.released-"+
  localRecord.operationId);
 const external=await lstat(outside).catch(()=>null);
 if(!external||!external.isFile()||external.isSymbolicLink()||
  external.size<20||external.size>2048)return false;
 const outsideRecord=JSON.parse(await readFile(outside,"utf8")) as {
  operationId?:string;purpose?:string
 };
 if(outsideRecord.operationId!==localRecord.operationId||
  outsideRecord.purpose!=="offline-restore")return false;
 const journal=await lastVerifiedJournal(job,key);
 if(!journal)return false;
 const receiptPath=join(root,"data","migration-inbox",
  job.token+".tar.gz.receipt.json");
 const stat=await lstat(receiptPath);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>8192)return false;
 const receipt=JSON.parse(await readFile(receiptPath,"utf8")) as SignedCurrentStateReceipt;
 const now=await fingerprintDestination();
 const ledger=await readErasureLedger();
 return comparePortableCurrentState(receipt,key,{
  archiveId:job.archiveId,databaseDigest:now.database,
  filesDigest:now.files,filesCount:now.count,
  ledgerCoverageStart:ledger.coverageStart,
  ledgerHeadMac:ledger.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,
  ledgerCount:ledger.markers.length
 }).currentStateMatched;
}
export async function recoverGuiOfflineRestore(){
 if(process.platform!=="win32"||process.env.SMN_DATABASE_URL||
  !await exists(pending))throw Error("gui-recovery-not-applicable");
 const job=await signedJob();
 process.env.SMN_BACKUP_DIR=join(root,"data","migration-work",job.token);
 process.env.SMN_RESTORE_MAINTENANCE_MARKER=join(tmpdir(),
  "smn-gui-restore-"+job.token+".marker");
 const local=localRestoreMaintenanceLockPath();
 const fenced=await exists(local);
 const key=await readFile(join(process.env.SMN_BACKUP_DIR,".backup-key"));
 try{
  if(key.length!==32)throw Error("gui-recovery-key-untrusted");
  if(!fenced){
   // The release may have succeeded immediately before the process crashed.
   // Never retry destructive work solely because a pending file remains.
   const state=JSON.parse(await readFile(join(updates,"migration-status.json"),
    "utf8")) as {stage?:string};
   if(["complete","promoted"].includes(state.stage??"")&&
    await verifyAlreadyReleased(job,key)){
    await status(job.token,"complete");
    await archivePending(job,"complete");
    return {state:"complete" as const,cutoverRetried:false as const};
   }
   // A queued job may have been interrupted before the offline fence was
   // installed: only cancel if the destination remains fingerprint-identical.
   if(state.stage==="queued"&&await verifyOriginal(job)){
    await status(job.token,"failed");
    await archivePending(job,"failed");
    return {state:"failed" as const,originalPreserved:true as const};
   }
   throw Error("gui-recovery-unfenced-pending-ambiguous");
  }
  if(await verifyOriginal(job)){
   await parkGuiPrivacyEvidence(job.token);
   await cancelPartialFence(job);
   await status(job.token,"rolled-back");
   await archivePending(job,"failed");
   return {state:"rolled-back" as const,originalPreserved:true as const};
  }
  const journal=await lastVerifiedJournal(job,key);
  if(!journal)throw Error("gui-recovery-cutover-ambiguous");
  const receipt=join(root,"data","migration-inbox",
   job.token+".tar.gz.receipt.json");
  try{
   await inspectOfflineCutoverJournal(journal,receipt);
   process.env.SMN40_RELEASE_OFFLINE_CONFIRM=
    "INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED";
   await releaseVerifiedNewComputerCutover(journal,receipt);
   await status(job.token,"complete");
   await archivePending(job,"complete");
   return {state:"complete" as const,cutoverRetried:false as const};
  }catch{
   process.env.SMN40_ROLLBACK_OFFLINE_CONFIRM=
    "ROLLBACK_VERIFIED_NEWPC_CUTOVER";
   await rollbackVerifiedNewComputerCutover(journal,receipt);
   if(!await verifyOriginal(job))
    throw Error("gui-recovery-rollback-digest-mismatch");
   await parkGuiPrivacyEvidence(job.token);
   await cancelSafeFence(job.token);
   await status(job.token,"rolled-back");
   await archivePending(job,"failed");
   return {state:"rolled-back" as const,originalPreserved:true as const};
  }
 }finally{
  key.fill(0);
  for(const variable of ["SMN_BACKUP_DIR","SMN_RESTORE_MAINTENANCE_MARKER",
   "SMN40_RELEASE_OFFLINE_CONFIRM","SMN40_ROLLBACK_OFFLINE_CONFIRM"])
   delete process.env[variable];
 }
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-gui-offline-recover\.(?:ts|mjs)$/))
 recoverGuiOfflineRestore().then(v=>{
  process.stdout.write(JSON.stringify(v)+"\n");
 }).catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",state:"incident",
   reason:"gui-recovery-remains-fenced"})+"\n");
  process.exitCode=2;
 });
