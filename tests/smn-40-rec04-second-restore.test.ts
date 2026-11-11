import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {validateSecondRestoreScope} from "../scripts/smn-40-rec04-second-restore";

const source="postgresql://smn_active:active-secret@127.0.0.1:5432/smn";
const isolated="postgresql://smn_rec04_admin:isolated-secret@127.0.0.1:57186";
const first=isolated+"/smn_restore_test_rec04_sandbox";
const admin=isolated+"/postgres";
const expected="C:\\isolated-pg18";

test("second reconstruction accepts only the expected dedicated local cluster",()=>{
 assert.equal(validateSecondRestoreScope(admin,first,expected,source),true);
});
test("a live database, wrong PG server, wrong role or REC-04 alias is never writable",()=>{
 for(const [a,b,s] of [
  [admin.replace(":57186",":5432"),first,source],
  [admin,first.replace(":57186",":5432"),source],
  [admin.replace("/postgres","/smn"),first,source],
  [admin,first.replace("smn_restore_test_rec04_sandbox","smn"),source],
  [admin,first,source.replace(":5432",":57186")],
  [admin,first,source.replace("/smn","/smn_restore_test_rec04_second")],
  [admin.replace("127.0.0.1","other-host.invalid"),first,source],
  [admin,first.replace("smn_rec04_admin","other-admin"),source],
  [admin,first,source.replace("smn_active","smn_rec04_admin")]
 ] as const){
  assert.equal(validateSecondRestoreScope(a,b,expected,s),false);
 }
 assert.equal(validateSecondRestoreScope(admin,first,"",source),false);
});
test("operator gate and exact single disposable CREATE prevent implicit restoration",()=>{
 const body=readFileSync(new URL("../scripts/smn-40-rec04-second-restore.ts",import.meta.url),"utf8");
 assert.match(body,/--confirm=RESTORE_SECOND_DISPOSABLE_ONLY/);
 assert.match(body,/mode==="check"/);
 assert.match(body,/CREATE DATABASE/);
 assert.match(body,/physical-cluster-mismatch/);
 assert.match(body,/second-target-already-exists/);
 assert.match(body,/previewBackupReadOnly/);
 assert.match(body,/rehearseBackupRestore/);
 assert.match(body,/compareFingerprints/);
 assert.doesNotMatch(body,/await\s+(?:maintenance|db|admin)\.query\([^\n]*(?:DROP DATABASE|ALTER DATABASE)/);
 assert.doesNotMatch(body,/initializeErasureLedger\s*\(/);
});
