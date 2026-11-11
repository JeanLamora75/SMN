import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {parseEquivalenceArgs,validateEquivalenceScope}
 from "../scripts/smn-40-latest-equivalence";

const id="a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d";
const rec04="postgresql://smn_rec04_admin:secret@127.0.0.1:57186/smn_restore_test_rec04_sandbox";
const live="postgresql://smn_active:active-secret@127.0.0.1:5432/smn";
const folder="C:\\isolation\\cluster";

test("SMN-40 equivalence: no implicit CREATE and exact confirm token",()=>{
 assert.deepEqual(parseEquivalenceArgs(["--archive",id,"--check"]),
  {archiveId:id,mode:"check"});
 assert.deepEqual(parseEquivalenceArgs(["--archive",id,"--compare",
  "--confirm=CREATE_SECOND_DISPOSABLE_ONLY"]),{archiveId:id,mode:"compare"});
 for(const args of [[],["--archive",id,"--compare"],
  ["--archive",id,"--compare","--confirm=RESTORE_ACTIVE"],
  ["--archive","invalid","--check"]])
  assert.throws(()=>parseEquivalenceArgs(args),/equivalence-arguments-invalid/);
});
test("SMN-40 equivalence: requires dedicated cluster different from active",()=>{
 assert.equal(validateEquivalenceScope(rec04,live,folder),true);
 for(const [isolated,active,dir] of [
  [rec04.replace("57186","5432"),live,folder],
  [rec04.replace("smn_restore_test_rec04_sandbox","smn"),live,folder],
  [rec04.replace("127.0.0.1","remote.example"),live,folder],
  [rec04,live.replace("5432","57186"),folder],
  [rec04,live.replace("/smn","/postgres"),folder],
  [rec04,live.replace("smn_active","smn_rec04_admin"),folder],
  [rec04,live.replace("smn_active","smn_restore_test_admin"),folder],
  [rec04,live,""]
 ] as const) assert.equal(validateEquivalenceScope(isolated,active,dir),false);
});
test("SMN-40 equivalence: hashes remain private and no existing database is dropped",()=>{
 const text=readFileSync(new URL("../scripts/smn-40-latest-equivalence.ts",import.meta.url),"utf8");
 assert.match(text,/fingerprintPublicTables/);
 assert.match(text,/compareFingerprints/);
 assert.match(text,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(text,/rehearseBackupRestore/);
 assert.match(text,/CREATE DATABASE/);
 assert.match(text,/comparison-target-already-exists/);
 assert.match(text,/sourceLiveAtCaptureEquivalenceProven:false/);
 assert.match(text,/restorationAuthorized:false/);
 assert.doesNotMatch(text,/\bDROP DATABASE\b|\bALTER DATABASE\b/);
});
