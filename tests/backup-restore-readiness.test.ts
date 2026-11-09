import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {assessRestoreGate} from "../src/server/backup/restore-readiness";
import type {RestorePreview} from "../src/server/backup/preview";
const baseline:RestorePreview={
 id:"734b7cb1-38ac-4261-87a8-f9393fdcc301",checkedAt:"2026-11-09T09:00:00.000Z",
 archive:{id:"734b7cb1-38ac-4261-87a8-f9393fdcc301",
  createdAt:"2026-11-09T08:30:00.000Z",status:"verified",reason:null,
  checkedAt:"2026-11-09T09:00:00.000Z",installationSource:"singleton:2026-10-20T08:00:00.000Z",
  applicationVersion:"0.1.0",schemaVersion:33,postgresVersion:"18.6",
  components:[],documentCount:0,integrityVerified:true,restoreTested:false},
 current:{installationSource:"singleton:2026-10-20T08:00:00.000Z",schemaVersion:33,
  applicationVersion:"0.1.0",postgresVersion:"18.6",documentCount:0},
 issues:["snapshot-older","privacy-not-cleared"],blocked:true,canRestore:false
};
describe("SMN-34 — preflight refuse toute restauration non qualifiée",()=>{
 it("un paquet sain ne suffit jamais à autoriser une restauration",()=>{
  const decision=assessRestoreGate(baseline);
  assert.equal(decision.decision,"blocked");
  assert.equal(decision.canExecute,false);
  assert.ok(decision.blockers.includes("privacy-erasures-unverified"));
  assert.ok(decision.blockers.includes("isolated-restore-unverified"));
  assert.ok(decision.blockers.includes("rollback-checkpoint-unverified"));
  assert.ok(decision.blockers.includes("atomic-cutover-unverified"));
  assert.ok(decision.blockers.includes("session-reset-unverified"));
  assert.deepEqual(decision.warnings,["potential-data-loss"]);
 });
 it("un paquet corrompu ou une origine étrangère reste bloquant",()=>{
  const decision=assessRestoreGate({...baseline,archive:{...baseline.archive,
   status:"invalid",integrityVerified:false,installationSource:"other"}});
  assert.ok(decision.blockers.includes("archive-not-verified"));
  assert.ok(decision.blockers.includes("different-installation"));
 });
 it("les versions et les documents courants sont vérifiés",()=>{
  const decision=assessRestoreGate({...baseline,
   archive:{...baseline.archive,schemaVersion:32,postgresVersion:"17.9",
    applicationVersion:"0.0.9",createdAt:null},
   current:{...baseline.current,documentCount:null}});
  for(const key of ["schema-incompatible","postgres-incompatible","application-incompatible",
   "current-documents-unavailable","archive-date-unavailable"]){
   assert.ok(decision.blockers.includes(key),key);
  }
 });
});
