import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {inspectDisposableOfflineScope,validateDisposableOfflineScope}
 from "../src/server/backup/restore-offline-operator-preflight";

test("SMN-34: refuse une base de production même si ses fichiers sont jetables",async()=>{
 const result=await inspectDisposableOfflineScope({
  maintenanceUri:"postgresql://example:password@127.0.0.1:5432/postgres",
  original:"smn_production",candidate:"smn_restore_test_candidate123",
  rollback:"smn_restore_test_rollback123",
  files:{originalRoot:"/some/unsafe/path",candidateRoot:"/some/unsafe/candidate",
   rollbackRoot:"/some/unsafe/rollback"}
 });
 assert.equal(result.canActivate,false);
 assert.equal(result.database.status,"blocked");
 assert.deepEqual(result.blockers,["disposable-scope-invalid"]);
});
test("SMN-34: la source est strictement jetable, pas un raccourci de restauration active",()=>{
 const scope={
  maintenanceUri:"postgresql://example:password@127.0.0.1:5432/postgres",
  original:"smn",candidate:"smn_restore_test_candidate123",
  rollback:"smn_restore_test_rollback123",
  files:{originalRoot:"C:\\SMN",candidateRoot:"C:\\candidate",rollbackRoot:"C:\\rollback"}
 };
 assert.equal(validateDisposableOfflineScope(scope),false);
 assert.equal(validateDisposableOfflineScope({
  ...scope,original:"smn_restore_test_original123",
  maintenanceUri:"postgresql://example:password@remote.example.com:5432/postgres"
 }),false);
});
test("SMN-34: CLI opérateur refuse arguments incomplets et n'affiche aucun secret",()=>{
 const dir=fileURLToPath(new URL("../",import.meta.url));
 const file=fileURLToPath(new URL("../scripts/smn-34-offline-preflight.ts",import.meta.url));
 const result=spawnSync(process.execPath,["--import","tsx",file,"--check-test-only"],{
  cwd:dir,encoding:"utf8",timeout:20000,
  env:{...process.env,SMN_TEST_DATABASE_URL:""}
 });
 assert.equal(result.status,2,result.stderr);
 assert.equal(result.stdout,"");
 assert.match(result.stderr,/no restore performed/);
 assert.doesNotMatch(result.stderr,/postgresql:|password|Error:|at .+\.ts:\d+/i);
});
