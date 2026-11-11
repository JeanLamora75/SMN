import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {parseRestoreDiagnosticArgs,restoreDiagnosticGuidance}
 from "../scripts/smn-40-restore-diagnostic";

const archive="1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5";
test("SMN-40 diagnostic: requires an archive UUID and explicit read-only check",()=>{
 assert.equal(parseRestoreDiagnosticArgs(["--archive",archive,"--check"]),archive);
 for(const args of [[],["--archive",archive],["--archive",archive,"--apply"],
  ["--archive","bad","--check"]])
  assert.throws(()=>parseRestoreDiagnosticArgs(args),/diagnostic-arguments-invalid/);
});
test("SMN-40 diagnostic: a backup older than ledger enrollment requires independent review",()=>{
 const result=restoreDiagnosticGuidance({
  archiveCreatedAt:"2026-11-10T12:00:00.000Z",
  coverageStart:"2026-11-11T13:36:18.984Z",
  blockers:["privacy-erasures-unverified","atomic-cutover-unverified"],
  integrityReason:"archive-review-required"
 });
 assert.equal(result.historicalCoverage,"outside-ledger");
 assert.ok(result.nextActions.includes("qualify-pre-enrollment-erasures-independently"));
 assert.ok(result.nextActions.includes("qualify-real-offline-windows-cutover-and-rollback"));
});
test("SMN-40 diagnostic: only identifies next actions, cannot restore or authorize",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-restore-diagnostic.ts",import.meta.url),"utf8");
 assert.match(script,/previewBackupReadOnly/);
 assert.match(script,/currentErasureEvidence/);
 assert.match(script,/assessRestoreGate/);
 assert.match(script,/withSessionReadDb/);
 assert.doesNotMatch(script,/export async function (?:POST|PUT|PATCH|DELETE)/);
 assert.doesNotMatch(script,/\b(?:pg_restore|DROP DATABASE|ALTER DATABASE|initializeErasureLedger)\s*\(/);
 assert.match(script,/canExecute:false/);
});
