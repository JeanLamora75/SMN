import assert from "node:assert/strict";
import {test} from "node:test";
import {assessOfflineRestoreActivation,type OfflineRestoreEvidence}
 from "../src/server/backup/restore-activation-policy";
import type {RestorePreview} from "../src/server/backup/preview";
import type {ErasureEvidence} from "../src/server/backup/erasure-protection";
const archiveId="734b7cb1-38ac-4261-87a8-f9393fdcc301";
const currentSource="singleton:2026-10-20T08:00:00.000Z";
const preview:RestorePreview={
 id:archiveId,checkedAt:"2026-11-09T12:00:00.000Z",
 archive:{
  id:archiveId,createdAt:"2026-11-09T11:00:00.000Z",status:"verified",
  reason:null,checkedAt:"2026-11-09T12:00:00.000Z",
  installationSource:currentSource,applicationVersion:"0.1.0",
  schemaVersion:33,postgresVersion:"18.6",components:[],
  documentCount:0,integrityVerified:true,scopeComplete:true,restoreTested:false
 },
 current:{installationSource:currentSource,schemaVersion:33,postgresVersion:"18.6",
  applicationVersion:"0.1.0",documentCount:0},
 issues:["privacy-not-cleared"],blocked:true,canRestore:false
};
const evidence:OfflineRestoreEvidence={
 sandboxRehearsed:true,sourceCheckpointVerified:true,
 allManagedFileVersionsStaged:true,restorationManifestVerified:true,
 appTrafficDrained:true,sessionStoreReplaced:true,
 databaseCutoverJournalVerified:true,rollbackDatabaseRetained:true
};
const privacy:ErasureEvidence={
 state:"verified",source:"external-append-only",
 coverageStart:"2026-11-08T00:00:00.000Z",
 checkedAt:"2026-11-09T12:00:00.000Z",
 latestErasureAt:null,entriesAfterBackup:0,
 signatureVerified:true,completeHistory:true
};
test("SMN-34 qualified offline activation requires every independent proof",()=>{
 assert.equal(assessOfflineRestoreActivation(preview,privacy,evidence).eligible,true);
 for(const key of Object.keys(evidence) as (keyof OfflineRestoreEvidence)[]){
  const result=assessOfflineRestoreActivation(preview,privacy,{...evidence,[key]:false});
  assert.equal(result.eligible,false,key);
  assert.ok(result.blockers.length,key);
 }
});
test("SMN-34 incomplete personal-data history cannot be overridden by cutover",()=>{
 const blocked=assessOfflineRestoreActivation(preview,{
  ...privacy,completeHistory:false,memberScopeVerified:true
 },evidence);
 assert.equal(blocked.eligible,false);
 assert.ok(blocked.blockers.includes("untrusted-erasure-history"));
 const past=assessOfflineRestoreActivation(preview,{
  ...privacy,latestErasureAt:"2026-11-09T11:30:00.000Z",entriesAfterBackup:1
 },evidence);
 assert.ok(past.blockers.includes("previously-erased-data"));
 assert.equal(assessOfflineRestoreActivation({...preview,archive:{
  ...preview.archive,scopeComplete:false
 }},privacy,evidence).eligible,false);
});
