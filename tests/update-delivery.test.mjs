import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import os from "node:os";
import path from "node:path";
import {parseDeliveryChecksum,validateDeliveryEvidence,verifyDelivery}
 from "../scripts/windows/verify-delivery.mjs";
const checksum=bytes=>createHash("sha256").update(bytes).digest("hex");
test("SMN-430: verified ZIP transport checks size, SHA-256 and CI traceability",async()=>{
 const folder=await mkdtemp(path.join(os.tmpdir(),"smn-delivery-"));
 const zip=path.join(folder,"SMN.zip"),proof=zip+".evidence.json",sha=zip+".sha256";
 const bytes=Buffer.from("isolated synthetic archive");const hash=checksum(bytes);
 const evidence={format:1,product:"SMN",kind:"windows-x64-initial",archive:"SMN.zip",
  bytes:bytes.length,sha256:hash,gitCommit:"a".repeat(40),runId:123456};
 try{
  await writeFile(zip,bytes);
  await writeFile(sha,hash+"  SMN.zip\n");
  await writeFile(proof,JSON.stringify(evidence)+"\n");
  assert.equal((await verifyDelivery(zip,proof,sha)).verified,true);
  const cli=spawnSync(process.execPath,["scripts/windows/verify-delivery.mjs",
   zip,proof,sha],{encoding:"utf8"});
  assert.equal(cli.status,0,cli.stderr);
  await writeFile(zip,Buffer.from("tampered transported archive"));
  await assert.rejects(verifyDelivery(zip,proof,sha),/size-mismatch|sha256-mismatch/);
  await writeFile(zip,bytes);
  await writeFile(proof,JSON.stringify({...evidence,bytes:bytes.length+1}));
  await assert.rejects(verifyDelivery(zip,proof,sha),/size-mismatch/);
 }finally{await rm(folder,{recursive:true,force:true})}
});
test("SMN-430: malformed or substituted evidence never validates",()=>{
 const hash="b".repeat(64);
 assert.equal(parseDeliveryChecksum(hash+"  package.zip\n","package.zip"),hash);
 for(const invalid of [hash+" *package.zip",hash+"  other.zip",
   hash+"  package.zip\n"+hash+"  package.zip","invalid"]){
  assert.throws(()=>parseDeliveryChecksum(invalid,"package.zip"));
 }
 const baseline={format:1,product:"SMN",kind:"windows-x64-update",
  archive:"package.zip",bytes:100,sha256:hash,gitCommit:"a".repeat(40),runId:1};
 assert.equal(validateDeliveryEvidence(baseline,"package.zip"),baseline);
 for(const altered of [{bytes:-1},{gitCommit:"wrong"},{runId:0},
  {archive:"different.zip"},{kind:"unknown"},{sha256:"wrong"}])
  assert.throws(()=>validateDeliveryEvidence({...baseline,...altered},"package.zip"));
});
