import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("SMN-478 release receipt remains mandatory and precedes ZIP publication",()=>{
 const workflow=source(".github/workflows/portable-package.yml");
 const gate=source("scripts/windows/create-delivery-evidence.mjs");
 const final=workflow.indexOf("collect-smn478-evidence.mjs finalize");
 const zip=workflow.indexOf("Construire le ZIP transmissible et vérifier son empreinte");
 assert.ok(final>=0&&zip>final);
 assert.match(gate,/verifySmn478Qualification\(process\.env\.SMN478_QUALIFICATION_RECEIPT,commit\)/);
 assert.match(workflow,/SMN478_QUALIFICATION_RECEIPT:/);
 assert.match(workflow,/SMN-478-Qualification-\$\{\{ github\.run_id \}\}/);
});
test("SMN-478 upgrade probes are not satisfied by repackaging a fresh installation",()=>{
 const workflow=source(".github/workflows/portable-package.yml");
 const acceptance=source("scripts/windows/smn-442-acceptance.mjs");
 for(const name of ["unit","typecheck","lint","build","windowsFresh","zipFreshRestore"])
  assert.ok(workflow.includes("run "+name+" --"),name);
 for(const name of ["browser","postgresEmpty","postgresHistory","postgresRollback"])
  assert.ok(acceptance.includes('captureCheck("'+name+'"'),name);
 for(const name of ["windowsUpgrade","zipUpgradeRestore"]){
  assert.ok(!workflow.includes("run "+name+" --"),name);
  assert.ok(!acceptance.includes('captureCheck("'+name+'"'),name);
 }
 assert.match(workflow,/collect-smn478-evidence\.mjs finalize/);
});
