import assert from "node:assert/strict";
import {test} from "node:test";
import {randomBytes} from "node:crypto";
import {freshCutoverMac,verifyFreshCutoverJournal,FRESH_CUTOVER_GENESIS,
 type FreshCutoverStage,type FreshCutoverEvent}
 from "../src/server/backup/fresh-cutover-journal";
const key=randomBytes(32);
const base={
 version:1 as const,id:"abcdef123456",
 archiveId:"39b6262d-5f27-4bf8-a005-701dfd9cd9a2",
 candidateDb:"smn_restore_test_newpc_abcdef12",
 rollbackDb:"smn_restore_test_back_abcdef123456"
};
function sequence(stages:FreshCutoverStage[]){
 let previousMac=FRESH_CUTOVER_GENESIS;
 return stages.map((stage,i)=>{
  const unsigned={...base,stage,at:new Date(1762894800000+i*1000).toISOString(),
   previousMac};
  const mac=freshCutoverMac(key,unsigned);
  previousMac=mac;
  return {...unsigned,mac};
 });
}
test("fresh-install cutover signed journal validates success and compensated rollback",()=>{
 assert.equal(verifyFreshCutoverJournal(sequence([
  "intent","files-promoted","source-parked","candidate-promoted","verified"
 ]),key),true);
 assert.equal(verifyFreshCutoverJournal(sequence([
  "intent","files-promoted","source-parked","rollback-started","rolled-back"
 ]),key),true);
});
test("fresh-install cutover rejects truncation, tampering and impossible transitions",()=>{
 const valid=sequence(["intent","files-promoted","source-parked","verified"]);
 assert.equal(verifyFreshCutoverJournal(valid,key),false);
 const complete=sequence(["intent","files-promoted","source-parked","candidate-promoted","verified"]);
 assert.equal(verifyFreshCutoverJournal(complete,randomBytes(32)),false);
 assert.equal(verifyFreshCutoverJournal([
  ...complete.slice(0,2),{...complete[2],stage:"verified"} as FreshCutoverEvent,
  ...complete.slice(3)
 ],key),false);
 assert.equal(verifyFreshCutoverJournal([complete[1]],key),false);
 assert.equal(verifyFreshCutoverJournal(complete.slice(0,4),key),true);
});
