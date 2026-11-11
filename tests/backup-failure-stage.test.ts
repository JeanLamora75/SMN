import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {BACKUP_FAILURE_STAGES,safeBackupFailureStage}
 from "../src/server/backup/failure-stage";

test("backup diagnostics: stages connus et uniques",()=>{
 assert.equal(new Set(BACKUP_FAILURE_STAGES).size,BACKUP_FAILURE_STAGES.length);
 for(const stage of BACKUP_FAILURE_STAGES)
  assert.equal(safeBackupFailureStage(stage),stage);
});
test("backup diagnostics: ne révèle jamais un message d'exception arbitraire",()=>{
 for(const value of [
  undefined,null,42,{},new Error("password=secret"),
  "postgresql://admin:secret@127.0.0.1/db",
  "C:\\Users\\private\\documents","backup-failed:password=secret",
  "connection\ncredentials"
 ])assert.equal(safeBackupFailureStage(value),"unknown");
});

test("backup diagnostics: failure stage is rendered without exception internals",()=>{
 const view=readFileSync(new URL("../src/app/app/admin/backups/backups-admin.tsx",import.meta.url),"utf8");
 const fr=JSON.parse(readFileSync(new URL("../src/i18n/fr.json",import.meta.url),"utf8"));
 const en=JSON.parse(readFileSync(new URL("../src/i18n/en.json",import.meta.url),"utf8"));
 assert.match(view,/state\.last\.failureStage/);
 assert.match(view,/t\("backups\.failureStage"\)/);
 assert.match(view,/try\{await refresh\(\);\}/);
 assert.ok(fr.backups.failureStage&&en.backups.failureStage);
});
