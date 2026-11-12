import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("launcher recovers interrupted migration before web app startup",()=>{
 const source=read("scripts/windows/launch-portable.mjs");
 assert.match(source,/guiPending=path\.join\(root,"updates","migration-pending\.json"\)/);
 assert.match(source,/recoverGuiMigration\(\)/);
 assert.ok(source.indexOf("const result=await recoverGuiMigration()")<
  source.indexOf("const server=path.join(root,\"app\",\"server.js\")"));
 assert.match(source,/await maintenanceBlocked\(\)/);
 assert.match(source,/shuttingDown=true;process\.exitCode=2;break/);
});
test("recovery uses authenticated signed job and original destination fingerprints",()=>{
 const source=read("scripts/smn-gui-offline-recover.ts");
 for(const marker of [
  "signedJob()","fingerprintDestination()","verifyOriginal(job)",
  "readFreshCutoverJournal(","inspectOfflineCutoverJournal(",
  "rollbackVerifiedNewComputerCutover(","releaseVerifiedNewComputerCutover(",
  "parkGuiPrivacyEvidence(","cancelSafeFence(","cancelPartialFence("
 ])assert.ok(source.includes(marker),marker);
 assert.match(source,/gui-recovery-cutover-ambiguous/);
 assert.match(source,/gui-recovery-rollback-digest-mismatch/);
 assert.doesNotMatch(source,/DROP DATABASE|DELETE FROM|TRUNCATE|await rm\(/);
});
test("both recovery and restoration binaries are included in Windows package",()=>{
 for(const file of ["scripts/windows/package-portable.mjs","scripts/windows/verify-package.mjs"]){
  const source=read(file);
  assert.match(source,/"smn-gui-offline-restore"/);
  assert.match(source,/"smn-gui-offline-recover"/);
 }
});

test("released-but-unarchived work requires signed journal and both parked fences",()=>{
 const source=read("scripts/smn-gui-offline-recover.ts");
 assert.match(source,/verifyAlreadyReleased\(job,key\)/);
 assert.match(source,/matching\.length!==1/);
 assert.match(source,/readFreshCutoverJournal\(/);
 assert.match(source,/comparePortableCurrentState\(receipt,key/);
 assert.match(source,/ledger\.markers\.at\(-1\)/);
 assert.match(source,/external\.isFile\(\)/);
 assert.doesNotMatch(source,/if\(state\.stage==="complete"\)\{\s*await archivePending/);
});

test("half-released external marker is recovered before rollback",()=>{
 const source=read("scripts/smn-gui-offline-recover.ts");
 assert.match(source,/async function repairHalfReleasedFence\(job:Job\)/);
 assert.match(source,/const parked=active\+"\.released-"\+record\.operationId/);
 assert.match(source,/proof\.operationId!==record\.operationId/);
 assert.match(source,/await rename\(parked,active\)/);
 assert.match(source,/await repairHalfReleasedFence\(job\)/);
});
