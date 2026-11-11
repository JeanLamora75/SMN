import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateErasureProtection} from "../src/server/backup/erasure-protection";

const route=readFileSync(new URL("../src/app/api/admin/backups/restore/plan/route.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/app/app/admin/backups/backups-admin.tsx",import.meta.url),"utf8");

test("SMN-40 restore plan verifies server authorization and accepts only archive id",()=>{
 assert.match(route,/authorizeApi\(request,"write"/);
 assert.match(route,/Object\.keys\(body\)\.length!==1/);
 assert.match(route,/uuid\.test\(body\.id\)/);
 assert.match(route,/currentErasureEvidence\(/);
 assert.match(route,/assessRestoreGate\(preview,evidence\)/);
 assert.match(route,/canExecute:false/);
 assert.doesNotMatch(route,/pg_restore|rehearseBackupRestore|rename\(|rm\(|DROP DATABASE|CREATE DATABASE/);
});

test("SMN-40 restore plan is one click and never exposes an activation action",()=>{
 assert.match(ui,/onClick=\{\(\)=>prepareRestore\(item\.id\)\}/);
 assert.match(ui,/\/api\/admin\/backups\/restore\/plan/);
 assert.match(ui,/data\.gate\.canExecute!==false/);
 assert.match(ui,/restorePlanLocked/);
 assert.doesNotMatch(ui,/\/api\/admin\/backups\/restore\/activate/);
});

test("SMN-40 historical incompleteness remains a mandatory blocker",()=>{
 const evidence={state:"verified" as const,source:"external-append-only" as const,
  coverageStart:"2026-11-11T13:36:18.984Z",checkedAt:"2026-11-11T20:00:00.000Z",
  latestErasureAt:null,entriesAfterBackup:0,signatureVerified:true as const,
  completeHistory:false};
 const verdict=evaluateErasureProtection("2026-11-11T18:27:39.087Z",evidence);
 assert.equal(verdict.permitted,false);
 assert.equal(verdict.code,"untrusted-erasure-history");
});
