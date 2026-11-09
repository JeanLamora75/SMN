import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {evaluateErasureProtection,type ErasureEvidence} from "../src/server/backup/erasure-protection";
import {assessRestoreGate} from "../src/server/backup/restore-readiness";
import type {RestorePreview} from "../src/server/backup/preview";

const backupDate="2026-10-20T10:00:00.000Z";
const evidence:ErasureEvidence={
 state:"verified",source:"external-append-only",
 coverageStart:"2026-10-01T00:00:00.000Z",checkedAt:"2026-11-09T09:00:00.000Z",
 latestErasureAt:null,entriesAfterBackup:0,
 signatureVerified:true,completeHistory:true
};

const preview:RestorePreview={
 id:"734b7cb1-38ac-4261-87a8-f9393fdcc301",
 checkedAt:"2026-11-09T09:00:00.000Z",
 archive:{
  id:"734b7cb1-38ac-4261-87a8-f9393fdcc301",createdAt:backupDate,
  status:"verified",reason:null,checkedAt:"2026-11-09T09:00:00.000Z",
  installationSource:"singleton:2026-10-01T00:00:00.000Z",
  applicationVersion:"0.1.0",schemaVersion:33,postgresVersion:"18.6",
  components:[],documentCount:0,integrityVerified:true,restoreTested:false
 },
 current:{installationSource:"singleton:2026-10-01T00:00:00.000Z",
  applicationVersion:"0.1.0",schemaVersion:33,postgresVersion:"18.6",documentCount:0},
 issues:[],blocked:true,canRestore:false
};

describe("SMN-40 — empêcher la réintroduction silencieuse de données effacées",()=>{
 it("bloque sans registre d'effacement fiable, même avec sauvegarde intègre",()=>{
  const missing:ErasureEvidence={state:"unavailable",reason:"ledger-not-implemented"};
  assert.equal(evaluateErasureProtection(backupDate,missing).code,"untrusted-erasure-history");
  const gate=assessRestoreGate(preview,missing);
  assert.equal(gate.canExecute,false);
  assert.ok(gate.blockers.includes("privacy-erasures-unverified"));
 });
 it("refuse un registre dont l'historique ne couvre pas la sauvegarde",()=>{
  const newer:ErasureEvidence={...evidence,coverageStart:"2026-11-01T00:00:00.000Z"};
  assert.equal(evaluateErasureProtection(backupDate,newer).code,"coverage-gap");
  assert.ok(assessRestoreGate(preview,newer).blockers.includes("privacy-coverage-gap"));
 });
 it("refuse une restauration lorsqu'un effacement est attesté après sa création",()=>{
  const erased:ErasureEvidence={...evidence,entriesAfterBackup:1,
   latestErasureAt:"2026-11-02T10:00:00.000Z"};
  assert.equal(evaluateErasureProtection(backupDate,erased).code,"previously-erased-data");
  assert.ok(assessRestoreGate(preview,erased).blockers.includes("privacy-erased-data"));
 });
 it("refuse date absente, preuve contrefaite ou incohérence chronologique",()=>{
  assert.equal(evaluateErasureProtection(null,evidence).code,"missing-backup-date");
  assert.equal(evaluateErasureProtection(backupDate,{...evidence,signatureVerified:false} as unknown as ErasureEvidence).permitted,false);
  assert.equal(evaluateErasureProtection(backupDate,{...evidence,checkedAt:"2026-10-15T00:00:00.000Z"}).code,"coverage-gap");
 });
 it("un registre correctement couvert permet un avis confidentialité, jamais une restauration à lui seul",()=>{
  const result=evaluateErasureProtection(backupDate,evidence);
  assert.equal(result.permitted,true);
  assert.equal(result.note,"external-copies-not-controlled");
  assert.equal(assessRestoreGate(preview,evidence).canExecute,false);
  assert.ok(assessRestoreGate(preview,evidence).blockers.includes("isolated-restore-unverified"));
 });
});
