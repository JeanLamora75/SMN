import type {BackupInventoryEntry} from "./verification";

/**
 * Migration of a current, frozen installation to a truly pristine computer.
 * Unlike rolling back to an older backup, this can avoid reintroducing past
 * deletions ONLY if the reconstructed snapshot independently matches the
 * still-current source, including every managed file. A valid erasure ledger
 * alone never establishes that equivalence.
 *
 * This pure decision is not authorization to write production data. All
 * evidence must be measured by trusted offline operators, never accepted
 * from a browser or unchecked JSON.
 */
export type FreshComputerEvidence=Readonly<{
 destinationPristine:boolean;
 destinationRuntimeCompatible:boolean;
 sourceMaintenanceFenced:boolean;
 sourceNoWriters:boolean;
 sourceCheckpointAfterArchive:boolean;
 sourceDatabaseFingerprint:string|null;
 candidateDatabaseFingerprint:string|null;
 sourceFileFingerprint:string|null;
 candidateFileFingerprint:string|null;
 sourceFileCount:number|null;
 candidateFileCount:number|null;
 externalLedgerSignatureValid:boolean;
 destinationLedgerSignatureValid:boolean;
 ledgerEndpointsIdentical:boolean;
 postArchiveErasureCount:number|null;
 outstandingErasureIntent:boolean;
 candidateConstraintsValidated:boolean;
 rollbackAndRecoveryPlanValidated:boolean;
 sessionResetPrepared:boolean;
}>;
export type FreshComputerVerdict=Readonly<{
 purpose:"current-state-transfer";
 stateEquivalent:boolean;
 canProceedToOfflineReview:boolean;
 activeRestorationAuthorized:false;
 blockers:readonly string[];
 historicalDeletionHistoryRequiredForOldBackup:true;
}>;
const HASH=/^[a-f0-9]{64}$/;
export function assessFreshComputerTransfer(
 archive:BackupInventoryEntry,e:FreshComputerEvidence
):FreshComputerVerdict{
 const blockers:string[]=[];
 if(archive.status!=="verified"||!archive.integrityVerified||
  archive.scopeComplete!==true||archive.schemaVersion!==33||
  !archive.postgresVersion?.startsWith("18.")||
  !archive.installationSource||!archive.createdAt)
  blockers.push("archive-not-qualified");
 if(!e.destinationPristine)blockers.push("destination-not-pristine");
 if(!e.destinationRuntimeCompatible)blockers.push("runtime-incompatible");
 if(!e.sourceMaintenanceFenced||!e.sourceNoWriters||
  !e.sourceCheckpointAfterArchive)
  blockers.push("current-source-not-frozen");
 const databaseMatches=!!e.sourceDatabaseFingerprint&&
  HASH.test(e.sourceDatabaseFingerprint)&&
  e.sourceDatabaseFingerprint===e.candidateDatabaseFingerprint;
 if(!databaseMatches)blockers.push("source-candidate-database-differ");
 const filesMatch=!!e.sourceFileFingerprint&&
  HASH.test(e.sourceFileFingerprint)&&
  e.sourceFileFingerprint===e.candidateFileFingerprint&&
  Number.isSafeInteger(e.sourceFileCount)&&
  e.sourceFileCount!==null&&e.sourceFileCount>=0&&
  e.sourceFileCount===e.candidateFileCount;
 if(!filesMatch)blockers.push("source-candidate-files-differ");
 if(!e.externalLedgerSignatureValid||!e.destinationLedgerSignatureValid||
  !e.ledgerEndpointsIdentical)
  blockers.push("ledger-transfer-not-reconciled");
 if(!Number.isSafeInteger(e.postArchiveErasureCount)||
  e.postArchiveErasureCount!==0||e.outstandingErasureIntent)
  blockers.push("erasures-after-snapshot-or-unverified");
 if(!e.candidateConstraintsValidated)blockers.push("candidate-not-qualified");
 if(!e.rollbackAndRecoveryPlanValidated)blockers.push("rollback-not-qualified");
 if(!e.sessionResetPrepared)blockers.push("session-reset-not-qualified");
 const stateEquivalent=databaseMatches&&filesMatch&&
  e.sourceMaintenanceFenced&&e.sourceNoWriters&&
  e.sourceCheckpointAfterArchive&&
  e.externalLedgerSignatureValid&&e.destinationLedgerSignatureValid&&
  e.ledgerEndpointsIdentical&&e.postArchiveErasureCount===0&&
  !e.outstandingErasureIntent;
 return {purpose:"current-state-transfer",stateEquivalent,
  canProceedToOfflineReview:blockers.length===0,
  activeRestorationAuthorized:false,blockers,
  historicalDeletionHistoryRequiredForOldBackup:true};
}
