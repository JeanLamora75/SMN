import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {evaluateErasureProtection,type ErasureEvidence}
 from "../src/server/backup/erasure-protection";
import {assessResetRequest,RESET_CONFIRMATION}
 from "../src/server/installation/reset-policy";
import {validateCutoverDrill}
 from "../src/server/backup/restore-cutover-drill";
import {assembleArchiveReview,assessArchiveReview}
 from "../src/server/backup/erasure-archive-review";

test("Lot 8 / SMN-40 — une preuve membre ne vaut jamais historique global",()=>{
 const evidence:ErasureEvidence={
  state:"verified",source:"external-append-only",signatureVerified:true,
  coverageStart:"2026-11-08T00:00:00.000Z",
  checkedAt:"2026-11-09T18:00:00.000Z",latestErasureAt:null,
  entriesAfterBackup:0,memberScopeVerified:true,completeHistory:false
 };
 const result=evaluateErasureProtection("2026-11-09T10:00:00.000Z",evidence);
 assert.equal(result.permitted,false);
 assert.equal(result.code,"untrusted-erasure-history");
 assert.equal(evaluateErasureProtection("2026-11-07T00:00:00.000Z",evidence)
  .permitted,false);
 const afterErase=evaluateErasureProtection("2026-11-09T10:00:00.000Z",{
  ...evidence,entriesAfterBackup:1,latestErasureAt:"2026-11-09T12:00:00.000Z"
 });
 assert.equal(afterErase.permitted,false);
 assert.equal(afterErase.code,"previously-erased-data");
});
test("Lot 8 / SMN-38 — l'inventaire binaire ne suffit pas à certifier l'anonymat",()=>{
 const inventory=assembleArchiveReview([
  {kind:"pdf",sha256:"a".repeat(64),bytes:3200},
  {kind:"office-template",sha256:"b".repeat(64),bytes:4100}
 ],"2026-11-09T12:00:00.000Z");
 const decisions=inventory.candidates.map(c=>({
  fingerprint:c.fingerprint,originalSha256:c.sha256,
  action:"replace-with-redacted-version" as const,
  reviewedBy:"reviewer",reviewedAt:"2026-11-09T13:00:00.000Z",
  verifiedAccessRestriction:false,verifiedReplacement:true,
  riskOfReidentification:"excluded" as const
 }));
 assert.equal(assessArchiveReview(inventory,decisions,
  new Date("2026-11-09T14:00:00.000Z")).permitted,false);
 assert.equal(assessArchiveReview(inventory,decisions.map(d=>({
  ...d,verifiedAccessRestriction:true,verifiedReplacement:false
 })),new Date("2026-11-09T14:00:00.000Z")).permitted,false);
});
test("Lot 8 / SMN-34 — la répétition de bascule refuse des bases réelles",()=>{
 const base={maintenanceUri:"postgresql://ci:password@127.0.0.1:5432/postgres",
  original:"smn_restore_test_orig_123456",candidate:"smn_restore_test_cand_123456",
  rollback:"smn_restore_test_back_123456",
  journalDir:join(tmpdir(),"smn-restore-drill"),auditKeyHex:"c".repeat(64)};
 assert.equal(validateCutoverDrill(base),true);
 assert.equal(validateCutoverDrill({...base,original:"smn"}),false);
 assert.equal(validateCutoverDrill({...base,candidate:"smn_production"}),false);
 assert.equal(validateCutoverDrill({...base,
  maintenanceUri:"postgresql://ci:password@db.example.test:5432/postgres"}),false);
});
test("Lot 8 / SMN-37 — aucune phrase de confirmation ne réinitialise l'installation active",()=>{
 for(const admin of [false,true]){
  const response=assessResetRequest(RESET_CONFIRMATION,admin);
  assert.equal(response.canExecute,false);
  assert.ok(response.blockers.length>0);
 }
});
test("Lot 8 — les routes publiques restent fail-closed sans exécuteur actif",()=>{
 const preflight=readFileSync(
  "src/app/api/admin/backups/restore/preflight/route.ts","utf8")
  .replace(/\\/\\*[\\s\\S]*?\\*\\//g,"");
 assert.match(preflight,/assessRestoreGate/);
 assert.match(preflight,/\},409\)/);
 assert.doesNotMatch(preflight,/rehearseCoordinatedOfflineCutover|pg_restore/);
 const reset=readFileSync("src/server/installation/reset-policy.ts","utf8");
 assert.match(reset,/canExecute:false/);
 assert.doesNotMatch(reset,/canExecute:true/);
 const preview=readFileSync("src/server/backup/erasure-preview.ts","utf8");
 assert.match(preview,/complete:false;canExecute:false/);
});
