import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {captureCheck,finalizeReceipt,qualificationContext}
 from "../scripts/windows/collect-smn478-evidence.mjs";
import {smn478RequiredChecks} from "../scripts/windows/smn-478-qualification-gate.mjs";

const commit="a".repeat(40);
async function fixture(t){
 const dir=await mkdtemp(join(tmpdir(),"smn478-collector-test-"));
 t.after(()=>rm(dir,{force:true,recursive:true}));
 return {dir,env:{...process.env,GITHUB_SHA:commit,GITHUB_RUN_ID:"123456",
  GITHUB_ACTIONS:"true",SMN478_DISPOSABLE:"YES",SMN478_EVIDENCE_DIR:dir}};
}
test("SMN-478 collector requires an actual disposable CI context",()=>{
 assert.throws(()=>qualificationContext({GITHUB_SHA:commit,GITHUB_RUN_ID:"42",
  GITHUB_ACTIONS:"true"}),/requires-disposable-ci/);
});
test("SMN-478 collector refuses missing evidence and failed commands",async t=>{
 const {env}=await fixture(t);
 await assert.rejects(finalizeReceipt(env),/smn478-collector-missing:/);
 await assert.rejects(captureCheck("unit",process.execPath,
  ["-e","process.exit(9)"],env),/check-failed:unit/);
 await assert.rejects(captureCheck("unit",process.execPath,
  ["-e","console.log('second try')"],env),/collector-duplicate/);
 await assert.rejects(finalizeReceipt(env),/check-rejected:unit/);
});
test("SMN-478 collector creates 12 independently hashed logs and refuses corruption",async t=>{
 const {dir,env}=await fixture(t);
 for(const name of smn478RequiredChecks)
  await captureCheck(name,process.execPath,["-e",
   "console.log('CI fixture for "+name+"')"],env);
 const receiptPath=await finalizeReceipt(env);
 const receipt=JSON.parse(await readFile(receiptPath,"utf8"));
 assert.equal(receipt.checks.length,12);
 assert.equal(receipt.gitCommit,commit);
 await writeFile(join(dir,"zipUpgradeRestore.log"),"corrupted");
 await assert.rejects(finalizeReceipt({...env,SMN478_EVIDENCE_DIR:
  join(dir,"does-not-exist")}),/smn478-collector-missing:/);
 // Removing the receipt still does not allow a changed log to pass.
 await rm(receiptPath);
 await assert.rejects(finalizeReceipt(env),/log-mismatch:zipUpgradeRestore/);
});
