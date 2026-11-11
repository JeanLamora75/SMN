import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {assessNewComputerErasureWindow,validNewComputerSandbox}
 from "../scripts/smn-40-newpc-reconstruct";

const source="postgresql://smn_app:password@127.0.0.1:5432/smn";
const target="postgresql://smn_test:password@127.0.0.1:57187/smn_restore_test_newpc_ab12cd34";
describe("SMN-40 — new computer sandbox scope",()=>{
 it("permits a dedicated disposable PostgreSQL role and isolated cluster",()=>{
  assert.equal(validNewComputerSandbox(source,target),true);
 });
 it("refuses both REC-04 ports and REC-04 evidence bases",()=>{
  assert.equal(validNewComputerSandbox(source,target.replace(":57187",":57186")),false);
  assert.equal(validNewComputerSandbox(source,target.replace("newpc_ab12cd34","rec04_sandbox")),false);
 });
 it("refuses live destination, same cluster and shared role",()=>{
  assert.equal(validNewComputerSandbox(source,source),false);
  assert.equal(validNewComputerSandbox(source,target.replace("smn_test","smn_app")),false);
  assert.equal(validNewComputerSandbox(source,target.replace(":57187",":5432")),false);
 });
 it("denies post-backup erasures even for an otherwise valid archive",()=>{
  const report=assessNewComputerErasureWindow("2026-11-11T14:00:00.000Z",
   "2026-11-11T13:36:18.984Z",[{occurredAt:"2026-11-12T00:00:00.000Z"}]);
  assert.equal(report.candidateReconstructionAllowed,false);
  assert.equal(report.postArchiveErasureCount,1);
  assert.equal(report.restorationAuthorized,false);
 });
 it("allows isolated candidate checks but never certifies historical coverage",()=>{
  const report=assessNewComputerErasureWindow("2026-11-11T14:00:00.000Z",
   "2026-11-11T13:36:18.984Z",[]);
  assert.equal(report.candidateReconstructionAllowed,true);
  assert.equal(report.historicalCoverageCertified,false);
  assert.equal(report.restorationAuthorized,false);
  assert.equal(assessNewComputerErasureWindow("2026-11-11T12:00:00.000Z",
   "2026-11-11T13:36:18.984Z",[]).candidateReconstructionAllowed,false);
 });
});

describe("fresh PC reconstruction does not depend on a source installation",()=>{
 it("uses a disconnected validation sentinel and never opens the source database",()=>{
  const script=readFileSync(new URL("../scripts/smn-40-newpc-reconstruct.ts",import.meta.url),"utf8");
  assert.doesNotMatch(script,/installedDatabaseUri/);
  assert.match(script,/smn_migration_sentinel/);
  assert.match(script,/const target=process\.env\.SMN40_NEWPC_SANDBOX_URL/);
  assert.match(script,/validNewComputerSandbox\(source,target\)/);
  assert.match(script,/restorationAuthorized:false/);
 });
});
describe("portable reconstruction Windows entrypoint",()=>{
 it("requires archive id and prevents reuse of protected REC-04 cluster",()=>{
  const script=readFileSync(new URL("../scripts/windows/smn-40-newpc-one-shot.ps1",import.meta.url),"utf8");
  assert.match(script,/Parameter\(Mandatory=\$true\)/);
  assert.match(script,/ValidateRange\(57190,57250\)/);
  assert.match(script,/SMN40-NewPC-Isolated-Port-/);
  assert.match(script,/Get-ChildItem -LiteralPath \$root -Force/);
  assert.match(script,/RECONSTRUCT_EMPTY_NEWPC_SANDBOX_ONLY/);
  assert.doesNotMatch(script,/\bDROP DATABASE\b|\bRemove-Item -LiteralPath \$cluster\b/i);
 });
});
