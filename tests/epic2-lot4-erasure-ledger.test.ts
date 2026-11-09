import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdtemp,mkdir,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {appendCompletedErasure,initializeErasureLedger,readErasureLedger}
 from "../src/server/backup/erasure-ledger";
import {currentErasureEvidence,evaluateErasureProtection}
 from "../src/server/backup/erasure-protection";

test("Epic 2 lot 4 — external journal, watermark, rollback and privacy restoration gate",
 {timeout:20000},async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-erasure-ledger-"));
 const dir=join(root,"journal"),anchor=join(root,"external-anchor");
 const vars=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR"] as const;
 const original=Object.fromEntries(vars.map(v=>[v,process.env[v]]));
 try{
  process.env.SMN_ERASURE_LEDGER_DIR=dir;
  process.env.SMN_ERASURE_ANCHOR_DIR=anchor;
  process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
  delete process.env.SMN_BACKUP_DIR;
  const before="2026-11-08T00:00:00.000Z";
  assert.equal((await currentErasureEvidence(before)).state,"unavailable");
  await initializeErasureLedger(new Date("2026-11-09T10:00:00.000Z"));
  const after="2026-11-09T10:01:00.000Z";
  assert.equal((await currentErasureEvidence(before)).state,"unavailable",
   "An enrollment cannot certify erasures before installation");
  const initially=await currentErasureEvidence(after);
  assert.equal(initially.state,"verified");
  assert.equal(evaluateErasureProtection(after,initially).permitted,false,
   "Authentic ledger is not a complete erasure history until all deletion paths are instrumented");
  const marker=await appendCompletedErasure("erase",new Date("2026-11-09T10:02:00.000Z"));
  assert.equal((await readErasureLedger()).markers.length,1);
  assert.equal(JSON.stringify(marker).includes("memberId"),false);
  const evidence=await currentErasureEvidence(after);
  assert.equal(evidence.state,"verified");
  if(evidence.state==="verified"){
   assert.equal(evidence.entriesAfterBackup,1);
   assert.equal(evaluateErasureProtection(after,{...evidence,completeHistory:true}).code,"previously-erased-data");
  }
  assert.equal(evaluateErasureProtection(after,evidence).permitted,false);
  await appendCompletedErasure("anonymize",new Date("2026-11-09T10:03:00.000Z"));
  assert.equal((await readErasureLedger()).markers.length,2);
  await assert.rejects(initializeErasureLedger(),/EEXIST/,
   "Re-enrolling must never overwrite existing evidence");
  // Truncate the ledger without changing the independently signed anchor.
  const file=join(dir,"erasure-ledger.jsonl");
  const originalBytes=await readFile(file);
  await writeFile(file,originalBytes.subarray(0,originalBytes.indexOf(10)+1));
  assert.equal((await currentErasureEvidence(after)).state,"unavailable");
  await assert.rejects(appendCompletedErasure("erase"),/truncation|pending-append/);
  await writeFile(file,originalBytes);
  const aFile=join(anchor,"erasure-anchor.json");
  const oldAnchor=await readFile(aFile,"utf8");
  await writeFile(aFile,oldAnchor.replace(/"count":2/,'"count":0'));
  assert.equal((await currentErasureEvidence(after)).state,"unavailable");
  await writeFile(aFile,oldAnchor);
  assert.equal((await readErasureLedger()).markers.length,2);
  await mkdir(join(root,"backups"));
  process.env.SMN_BACKUP_DIR=root;
  assert.equal((await currentErasureEvidence(after)).state,"unavailable",
   "Ledger inside the backup tree is never trusted");
 }finally{
  for(const key of vars){
   const value=original[key];if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
  await rm(root,{recursive:true,force:true});
 }
});
