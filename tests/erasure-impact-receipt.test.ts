import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {issueImpactReceipt,verifyImpactReceipt} from "../src/server/backup/erasure-plan-token";
import {assessErasurePlan,type ErasureImpactPlan,IMPACT_CATEGORIES}
 from "../src/server/backup/exceptional-erasure-policy";

const start=new Date("2026-11-09T09:00:00.000Z");
const revision="a".repeat(64);
describe("SMN-38 — reçu d'analyse serveur signé et expirant",()=>{
 it("lier le plan au membre, mode, révision et Administrateur",()=>{
  const issued=issueImpactReceipt({
   actorId:"account-one",memberId:"member-123",mode:"erase",scopeRevision:revision
  },start);
  assert.ok(issued);
  const verified=verifyImpactReceipt(issued.token,"account-one",
   new Date("2026-11-09T09:05:00.000Z"));
  assert.equal(verified?.scopeRevision,revision);
  assert.equal(verified?.memberId,"member-123");
  assert.equal(verified?.mode,"erase");
  assert.equal(verified?.complete,false);
  assert.equal(verifyImpactReceipt(issued.token,"account-two",start),null);
 });
 it("refuser toute altération du reçu ou de sa date de validité",()=>{
  const issued=issueImpactReceipt({
   actorId:"account-one",memberId:"member-123",mode:"anonymize",scopeRevision:revision
  },start)!;
  assert.equal(verifyImpactReceipt(issued.token+"x","account-one",start),null);
  assert.equal(verifyImpactReceipt(issued.token,"account-one",
   new Date("2026-11-09T09:10:00.000Z")),null);
  assert.equal(verifyImpactReceipt(issued.token,"account-one",
   new Date("2026-11-09T08:59:59.000Z")),null);
  assert.equal(issueImpactReceipt({
   actorId:"account-one",memberId:"member-123",mode:"erase",scopeRevision:"invalid"
  },start),null);
 });
 it("un reçu valide ne donne jamais une autorisation d'effacement",()=>{
  const plan:ErasureImpactPlan={
   planId:"plan-12345678",installationId:"singleton",subjectToken:"opaque-token",
   mode:"erase",capturedAt:start.toISOString(),
   expiresAt:new Date(start.getTime()+10*60_000).toISOString(),
   scopeRevision:"revision-12345",backupAndExternalCopyWarningAcknowledged:true,
   findings:IMPACT_CATEGORIES.map(category=>({
    category,state:"inspected",affectedCount:0,action:"erase",
    justificationRecorded:true,reidentificationRisk:"excluded"
   }))
  };
  const readiness=assessErasurePlan(plan,new Date("2026-11-09T09:04:00Z"));
  assert.equal(readiness.canExecute,false);
  assert.equal(readiness.requiresServerReceipt,true);
  assert.equal(readiness.requiresDistinctConfirmation,true);
 });
});
