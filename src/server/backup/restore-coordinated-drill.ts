import {rehearseOfflineDatabaseCutover,type CutoverDrillInput,
 readCutoverDrillJournal} from "./restore-cutover-drill";
import {rehearseOfflineFileCutover,inspectRestoreFileTree,
 type FileCutoverInput} from "./restore-file-cutover-drill";

/**
 * Coordinated offline rehearsal on disposable PostgreSQL/file namespaces.
 * File swap precedes DB rename; on a clean DB refusal or tested rollback
 * it reverses the file swap. An ambiguous state is never auto-recovered.
 *
 * No production endpoint and no bypass for SMN-40 privacy clearance exist.
 */
export type CoordinatedCutoverInput=Readonly<{
 database:CutoverDrillInput;files:FileCutoverInput;
 recoveredFilesRoot:string;
}>;
export type CoordinatedCutoverResult=Readonly<{
 state:"verified"|"rolled-back";
 databaseRollbackPreserved:boolean;
 filesRollbackPreserved:boolean;
 databaseJournal:string;
}>;
export async function rehearseCoordinatedOfflineCutover(
 input:CoordinatedCutoverInput
):Promise<CoordinatedCutoverResult>{
 const prepared=await inspectRestoreFileTree(input.files.candidateRoot);
 if(prepared.count<1&&!input.files.allowVerifiedEmptyCandidate)
  throw Error("coordinated-restore-files-unavailable");
 const files=await rehearseOfflineFileCutover(input.files);
 if(files.status!=="verified")throw Error("coordinated-file-restore-rolled-back");
 const rollbackFiles=async()=>{
  try{
   const rollback=await rehearseOfflineFileCutover({
    originalRoot:input.files.originalRoot,
    candidateRoot:input.files.rollbackRoot,
    rollbackRoot:input.recoveredFilesRoot
   });
   if(rollback.status!=="verified")throw Error("file-reversal-rejected");
   const [original,parkedCandidate]=await Promise.all([
    inspectRestoreFileTree(input.files.originalRoot),
    inspectRestoreFileTree(input.recoveredFilesRoot)
   ]);
   if(original.sha256!==files.source.sha256||
    original.count!==files.source.count||
    original.bytes!==files.source.bytes||
    parkedCandidate.sha256!==files.candidate.sha256||
    parkedCandidate.count!==files.candidate.count||
    parkedCandidate.bytes!==files.candidate.bytes)
    throw Error("file-rollback-fingerprint-mismatch");
  }catch{throw Error("coordinated-manual-recovery-required");}
 };
 try{
  const db=await rehearseOfflineDatabaseCutover(input.database);
  if(db.stage==="verified"){
   // Both original DB and original files are retained in separate rollback
   // names. The test must independently verify their content before use.
   const journal=await readCutoverDrillJournal(db.journal,input.database.auditKeyHex);
   if(journal.at(-1)?.stage!=="verified")
    throw Error("database-journal-incomplete");
   return {state:"verified",databaseRollbackPreserved:true,
    filesRollbackPreserved:true,databaseJournal:db.journal};
  }
  if(db.stage==="rolled-back"){
   await rollbackFiles();
   return {state:"rolled-back",databaseRollbackPreserved:false,
    filesRollbackPreserved:false,databaseJournal:db.journal};
  }
  throw Error("database-outcome-unknown");
 }catch(error){
  // A DB cutover incident (after promotion) is not necessarily reversible
  // without an operator verifying PostgreSQL state. Do not further mutate
  // the files on an ambiguous outcome.
  if(error instanceof Error&&
   /manual-recovery|journal-incomplete|database-outcome-unknown/.test(error.message))
   throw Error("coordinated-manual-recovery-required");
  await rollbackFiles();
  throw Error("coordinated-database-cutover-denied-files-restored");
 }
}
