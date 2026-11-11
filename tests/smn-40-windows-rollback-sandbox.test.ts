import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {resolve} from "node:path";
import {validWindowsRollbackScope} from "../scripts/smn-40-windows-rollback-sandbox";

const cluster=resolve("C:/smn_restore_test_pg18_rec04/cluster");
const good="postgresql://rec04:test-pass@127.0.0.1:57186/postgres";
test("the Windows rehearsal accepts only the dedicated PG18 admin database",()=>{
 assert.equal(validWindowsRollbackScope(good,cluster),true);
 for(const wrong of [
  good.replace(":57186",":5432"),good.replace("/postgres","/smn"),
  good.replace("127.0.0.1","remote.invalid"),
  good.replace("/postgres","/smn_restore_test_rec04_second"),
  good+"?options=-csearch_path%3Dpublic",
  good.replace("test-pass@","@")
 ])assert.equal(validWindowsRollbackScope(wrong,cluster),false);
 assert.equal(validWindowsRollbackScope(good,""),false);
});
test("the runner never executes the tests before physical cluster verification",()=>{
 const c=readFileSync(new URL("../scripts/smn-40-windows-rollback-sandbox.ts",import.meta.url),"utf8");
 assert.match(c,/data_directory/);
 assert.match(c,/isolated-postgres-identity-mismatch/);
 assert.match(c,/smn_restore_test_rec04_sandbox/);
 assert.match(c,/smn_restore_test_rec04_second/);
 assert.match(c,/--sandbox-only/);
 assert.match(c,/tests\/epic2-lot5-cutover-pg\.test\.ts/);
 assert.match(c,/tests\/epic2-lot5-file-cutover\.test\.ts/);
 assert.match(c,/tests\/smn-34-offline-cutover-cli-pg\.test\.ts/);
 assert.doesNotMatch(c,/DROP DATABASE|CREATE DATABASE|ALTER DATABASE|pg_restore/);
 assert.match(c,/productionRestoreEnabled:false/);
});
