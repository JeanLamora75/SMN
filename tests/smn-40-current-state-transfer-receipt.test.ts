import assert from "node:assert/strict";
import {test} from "node:test";
import {randomBytes} from "node:crypto";
import {
 signCurrentStateReceipt,comparePortableCurrentState,
 type CurrentStateReceiptPayload
} from "../src/server/backup/current-state-transfer-receipt";

const key=randomBytes(32);
const data:CurrentStateReceiptPayload={
 version:1,purpose:"frozen-current-state-migration",
 archiveId:"39b6262d-5f27-4bf8-a005-701dfd9cd9a2",
 archiveCreatedAt:"2026-11-11T18:27:39.087Z",
 measuredAt:"2026-11-11T19:30:00.000Z",
 schemaVersion:33,databaseDigest:"a".repeat(64),filesDigest:"b".repeat(64),
 filesCount:3,ledgerCoverageStart:"2026-11-11T13:36:18.984Z",
 ledgerHeadMac:"c".repeat(64),ledgerCount:0
};
const target={
 archiveId:data.archiveId,databaseDigest:data.databaseDigest,
 filesDigest:data.filesDigest,filesCount:data.filesCount,
 ledgerCoverageStart:data.ledgerCoverageStart,
 ledgerHeadMac:data.ledgerHeadMac,ledgerCount:data.ledgerCount
};
test("portable current-state receipt binds source and destination without member details",()=>{
 const proof=signCurrentStateReceipt(data,key);
 assert.equal(comparePortableCurrentState(proof,key,target).currentStateMatched,true);
 assert.equal(comparePortableCurrentState(proof,key,target).restorationAuthorized,false);
 assert.equal(comparePortableCurrentState(proof,key,target).sourceFrozenIndependently,false);
 assert.doesNotMatch(JSON.stringify(proof),/memberName|memberEmail|password|username/i);
});
test("reject altered database, files, ledger, archive or signature",()=>{
 const proof=signCurrentStateReceipt(data,key);
 for(const changes of [
  {databaseDigest:"d".repeat(64)},{filesDigest:"d".repeat(64)},
  {filesCount:4},{ledgerHeadMac:"d".repeat(64)},{ledgerCount:1},
  {ledgerCoverageStart:"2026-11-11T13:36:18.000Z"},
  {archiveId:"11111111-1111-4111-8111-111111111111"}
 ]){
  const outcome=comparePortableCurrentState(proof,key,{...target,...changes});
  assert.equal(outcome.currentStateMatched,false,JSON.stringify(changes));
  assert.equal(outcome.restorationAuthorized,false);
 }
 assert.equal(comparePortableCurrentState({...proof,mac:"0".repeat(64)},key,target).currentStateMatched,false);
 assert.equal(comparePortableCurrentState(proof,randomBytes(32),target).currentStateMatched,false);
 assert.equal(comparePortableCurrentState(null,key,target).restorationAuthorized,false);
});
test("reject receipts dated before backup or before erasure-ledger coverage",()=>{
 assert.throws(()=>signCurrentStateReceipt({...data,measuredAt:"2026-11-01T00:00:00.000Z"},key));
 assert.throws(()=>signCurrentStateReceipt({...data,ledgerCoverageStart:"2026-11-12T00:00:00.000Z"},key));
});
