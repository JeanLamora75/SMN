import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifySmn478Qualification,smn478RequiredChecks}
 from "../scripts/windows/smn-478-qualification-gate.mjs";

const digest=value=>createHash("sha256").update(value).digest("hex");
const commit="a".repeat(40);
async function fixture(){
 const folder=await mkdtemp(join(tmpdir(),"smn478-proof-"));
 const checks=[];
 for(const name of smn478RequiredChecks){
  const path=join(folder,name+".txt"),message="PASS: "+name+" checked in disposable environment\n";
  await writeFile(path,message);
  checks.push({name,result:"passed",logPath:path,sha256:digest(message),
   disposable:true,runCommand:"pnpm verify:"+name});
 }
 const receiptPath=join(folder,"receipt.json");
 const receipt={version:1,gitCommit:commit,environment:"disposable",
  recordedAt:new Date().toISOString(),checks};
 async function save(){await writeFile(receiptPath,JSON.stringify(receipt));}
 await save();
 return {folder,receipt,receiptPath,save};
}
test("SMN-478: release gate checks every stage and real log hashes",async t=>{
 const x=await fixture();
 t.after(()=>rm(x.folder,{recursive:true,force:true}));
 assert.deepEqual(await verifySmn478Qualification(x.receiptPath,commit),
  {qualified:true,gitCommit:commit,checks:12});
 x.receipt.checks[6].logPath="postgresHistory.txt";
 await x.save();
 assert.deepEqual(await verifySmn478Qualification(x.receiptPath,commit),
  {qualified:true,gitCommit:commit,checks:12});
 x.receipt.checks[6].result="failed";
 await x.save();
 await assert.rejects(verifySmn478Qualification(x.receiptPath,commit),/smn478-delivery-check-rejected/);
 x.receipt.checks[6].result="passed";
 x.receipt.checks[6].sha256="b".repeat(64);
 await x.save();
 await assert.rejects(verifySmn478Qualification(x.receiptPath,commit),/smn478-delivery-log-mismatch/);
});
test("SMN-478: no receipt or no upgraded ZIP restore proof blocks delivery",async t=>{
 const x=await fixture();
 t.after(()=>rm(x.folder,{recursive:true,force:true}));
 await assert.rejects(verifySmn478Qualification(undefined,commit),/smn478-delivery-proof-required/);
 x.receipt.checks=x.receipt.checks.filter(c=>c.name!=="zipUpgradeRestore");
 await x.save();
 await assert.rejects(verifySmn478Qualification(x.receiptPath,commit),/smn478-delivery-proof-invalid/);
});
