import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

test("SMN-34: orchestrateur externe refuse sans secret ni preuve de sandbox",()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const script=fileURLToPath(new URL("../scripts/smn-34-offline-cutover-sandbox.ts",
  import.meta.url));
 const result=spawnSync(process.execPath,["--import","tsx",script,"--sandbox-cutover",
  "smn_production","smn_restore_test_candidate","smn_restore_test_rollback",
  "C:\\SMN","C:\\candidate","C:\\rollback","C:\\recovered","C:\\journal"],{
  cwd,encoding:"utf8",timeout:20000,env:{
   ...process.env,SMN_TEST_DATABASE_URL:"postgresql://ci:pass@127.0.0.1:5432/postgres",
   SMN_CUTOVER_TEST_AUDIT_KEY_HEX:"a".repeat(64)
  }
 });
 assert.equal(result.status,2,result.stderr);
 assert.equal(result.stdout,"");
 assert.match(result.stderr,/production remains locked/);
 assert.doesNotMatch(result.stderr,/postgresql:|ci:pass|C:\\SMN|Error:/);
});
