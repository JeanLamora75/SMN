import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {assessFreshComputerTransfer,type FreshComputerEvidence}
 from "../src/server/backup/fresh-computer-transfer-policy";
import type {BackupInventoryEntry} from "../src/server/backup/verification";

const archive:BackupInventoryEntry={
 id:"39b6262d-5f27-4bf8-a005-701dfd9cd9a2",
 createdAt:"2026-11-11T18:27:39.087Z",
 status:"verified",reason:null,checkedAt:"2026-11-11T19:00:00.000Z",
 installationSource:"singleton:2026-11-01T00:00:00.000Z",
 applicationVersion:"1.0.0",schemaVersion:33,postgresVersion:"18.6",
 components:[],documentCount:0,integrityVerified:true,scopeComplete:true,
 restoreTested:false
};
const good:FreshComputerEvidence={
 destinationPristine:true,destinationRuntimeCompatible:true,
 sourceMaintenanceFenced:true,sourceNoWriters:true,
 sourceCheckpointAfterArchive:true,
 sourceDatabaseFingerprint:"a".repeat(64),
 candidateDatabaseFingerprint:"a".repeat(64),
 sourceFileFingerprint:"b".repeat(64),
 candidateFileFingerprint:"b".repeat(64),
 sourceFileCount:2,candidateFileCount:2,
 externalLedgerSignatureValid:true,destinationLedgerSignatureValid:true,
 ledgerEndpointsIdentical:true,postArchiveErasureCount:0,
 outstandingErasureIntent:false,candidateConstraintsValidated:true,
 rollbackAndRecoveryPlanValidated:true,sessionResetPrepared:true
};
test("exact current-state match permits offline review, not an active restoration",()=>{
 const v=assessFreshComputerTransfer(archive,good);
 assert.equal(v.stateEquivalent,true);
 assert.equal(v.canProceedToOfflineReview,true);
 assert.equal(v.activeRestorationAuthorized,false);
 assert.equal(v.historicalDeletionHistoryRequiredForOldBackup,true);
});
test("tampered or stale evidence blocks migration without losing existing member names",()=>{
 for(const changed of [
  {sourceNoWriters:false},{sourceMaintenanceFenced:false},
  {sourceCheckpointAfterArchive:false},
  {sourceDatabaseFingerprint:"c".repeat(64)},
  {candidateFileFingerprint:"c".repeat(64)},
  {sourceFileCount:0},{ledgerEndpointsIdentical:false},
  {destinationLedgerSignatureValid:false},
  {postArchiveErasureCount:1},
  {postArchiveErasureCount:null},{outstandingErasureIntent:true},
  {destinationPristine:false},{sessionResetPrepared:false},
  {candidateConstraintsValidated:false},{rollbackAndRecoveryPlanValidated:false}
 ]){
  const v=assessFreshComputerTransfer(archive,{...good,...changed});
  assert.equal(v.canProceedToOfflineReview,false,JSON.stringify(changed));
  assert.equal(v.activeRestorationAuthorized,false);
 }
});
test("archive byte integrity alone never certifies a current-state transfer",()=>{
 const v=assessFreshComputerTransfer(archive,{...good,
  sourceDatabaseFingerprint:null,sourceFileFingerprint:null});
 assert.equal(v.stateEquivalent,false);
 assert.equal(v.canProceedToOfflineReview,false);
});
test("an old backup restore keeps the original historical erasure guard",()=>{
 const privacy=readFileSync(new URL("../src/server/backup/erasure-protection.ts",import.meta.url),"utf8");
 assert.match(privacy,/if\(evidence\.completeHistory!==true\)return deny/);
 assert.match(privacy,/completeHistory:false/);
});
