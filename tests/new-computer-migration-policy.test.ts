import assert from "node:assert/strict";
import {test} from "node:test";
import {assessNewComputerMigration}
 from "../src/server/backup/new-computer-migration-policy";
import type {BackupInventoryEntry} from "../src/server/backup/verification";
const archive:BackupInventoryEntry={
 id:"a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d",
 status:"verified",createdAt:"2026-11-11T16:11:00.000Z",
 reason:null,checkedAt:"2026-11-11T18:00:00.000Z",
 installationSource:"singleton:2026-10-20T12:00:00.000Z",
 applicationVersion:"0.1.0",postgresVersion:"18.6",schemaVersion:33,
 components:[],documentCount:0,
 integrityVerified:true,scopeComplete:true,restoreTested:false
};
const empty={state:"uninitialized" as const,postgresMajor:18,
 publicUserTables:0,managedFiles:0,existingLedger:false};
const verified={integrityVerified:true,coverageReconciled:true};
test("new PC: verified archive and empty destination are distinct from same-install restore",()=>{
 const result=assessNewComputerMigration(archive,empty,verified);
 assert.equal(result.eligibleForIsolatedReconstruction,true);
 assert.equal(result.readyForProduction,false);
 assert.equal(result.restorationAuthorized,false);
 assert.equal(result.memberNames,"preserve");
 assert.equal(result.memberHistory,"preserve");
 assert.deepEqual(result.blockers,[]);
});
test("new PC: no fabricated zero-event ledger and no cross-install overwrite",()=>{
 for(const destination of [
  {...empty,state:"existing" as const,installationSource:"other"},
  {...empty,publicUserTables:1},
  {...empty,managedFiles:1},
  {...empty,existingLedger:true},
  {...empty,postgresMajor:17},
  {state:"unverifiable" as const}
 ]){
  const result=assessNewComputerMigration(archive,destination,verified);
  assert.equal(result.eligibleForIsolatedReconstruction,false);
  assert.equal(result.restorationAuthorized,false);
 }
 for(const ledger of [
  {integrityVerified:false,coverageReconciled:true},
  {integrityVerified:true,coverageReconciled:false}
 ]){
  const result=assessNewComputerMigration(archive,empty,ledger);
  assert.equal(result.eligibleForIsolatedReconstruction,false);
  assert.ok(result.blockers.includes("erasure-ledger-transfer-unqualified"));
 }
});
test("new PC: corrupted/partial packages cannot enter reconstruction",()=>{
 for(const modified of [
  {...archive,status:"invalid" as const},
  {...archive,integrityVerified:false},
  {...archive,scopeComplete:false},
  {...archive,installationSource:null}
 ]){
  assert.equal(assessNewComputerMigration(modified,empty,verified)
   .eligibleForIsolatedReconstruction,false);
 }
});
