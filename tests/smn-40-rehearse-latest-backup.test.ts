import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {test} from "node:test";
import {parseLatestRehearsalArgs,validLatestRehearsalScope}
 from "../scripts/smn-40-rehearse-latest-backup";

const id="a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d";
const live="postgresql://smn_active:secret@127.0.0.1:5432/smn";
const rec04="postgresql://smn_rec04_admin:other-secret@127.0.0.1:57186/smn_restore_test_rec04_sandbox";
const directory=resolve("isolated-pg18");

test("latest v4 rehearsal: exact read-only check or explicit disposable restore",()=>{
 assert.deepEqual(parseLatestRehearsalArgs(["--archive",id,"--check"]),{
  archiveId:id,mode:"check"
 });
 assert.deepEqual(parseLatestRehearsalArgs(["--archive",id,"--restore",
  "--confirm=RESTORE_DISPOSABLE_ARCHIVE_ONLY"]),{
  archiveId:id,mode:"restore"
 });
 for(const args of [[],["--archive",id,"--restore"],
  ["--archive",id,"--restore","--confirm=RESTORE_ACTIVE"],
  ["--archive","bad","--check"]])
  assert.throws(()=>parseLatestRehearsalArgs(args),/latest-rehearsal-arguments-invalid/);
});
test("latest v4 rehearsal: scope only on physically distinct REC-04 cluster and role",()=>{
 assert.equal(validLatestRehearsalScope(rec04,live,directory),true);
 for(const [a,b,c] of [
  [rec04.replace(":57186",":5432"),live,directory],
  [rec04.replace("smn_restore_test_rec04_sandbox","smn"),live,directory],
  [rec04,live.replace(":5432",":57186"),directory],
  [rec04,live.replace(/\/smn$/, "/postgres"),directory],
  [rec04,live.replace("smn_active","smn_rec04_admin"),directory],
  [rec04,live.replace("smn_active","smn_restore_test_fake"),directory],
  [rec04.replace("127.0.0.1","remote.example"),live,directory],
  [rec04,live,""]
 ] as const)assert.equal(validLatestRehearsalScope(a,b,c),false);
});
test("latest v4 rehearsal: does not drop or modify existing PostgreSQL databases",()=>{
 const code=readFileSync(new URL("../scripts/smn-40-rehearse-latest-backup.ts",import.meta.url),"utf8");
 assert.match(code,/previewBackupReadOnly/);
 assert.match(code,/rehearseBackupRestore/);
 assert.match(code,/CREATE DATABASE/);
 assert.match(code,/isolated-cluster-identity-mismatch/);
 assert.match(code,/disposable-target-already-exists/);
 assert.match(code,/archive\.scopeComplete!==true/);
 assert.match(code,/sourceUri:live,sandboxUri:target\.toString\(\)/);
 assert.match(code,/restorationAuthorized:false/);
 assert.doesNotMatch(code,/\bDROP DATABASE\b|\bALTER DATABASE\b/);
 assert.doesNotMatch(code,/initializeErasureLedger\s*\(/);
});
