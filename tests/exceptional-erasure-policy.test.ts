import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {describe,it} from "node:test";
import {
 assessErasurePlan,isDistinctErasureConfirmation,IMPACT_CATEGORIES,
 type ErasureImpactPlan,type ImpactFinding
} from "../src/server/backup/exceptional-erasure-policy";
import {createErasureMarker,verifyErasureChain,ERASURE_GENESIS_MAC}
 from "../src/server/backup/erasure-evidence-format";

const date="2026-11-09T10:00:00.000Z";
const finding=(category:typeof IMPACT_CATEGORIES[number]):ImpactFinding=>({
 category,state:"inspected",affectedCount:0,action:"erase",
 justificationRecorded:true,reidentificationRisk:"excluded"
});
const plan:ErasureImpactPlan={
 planId:"plan-abc12345",installationId:"singleton",subjectToken:"opaque-token-123",
 mode:"erase",capturedAt:date,expiresAt:"2026-11-09T10:10:00.000Z",
 scopeRevision:"revision-100",findings:IMPACT_CATEGORIES.map(finding),
 backupAndExternalCopyWarningAcknowledged:true
};
const now=new Date("2026-11-09T10:03:00.000Z");

describe("SMN-39 — gardes d'effacement exceptionnel",()=>{
 it("refuse un plan obsolète ou une confirmation absente",()=>{
  assert.equal(assessErasurePlan(plan,now).decision,"eligible-for-confirmation");
  assert.equal(assessErasurePlan(plan,new Date("2026-11-09T10:11:00Z")).decision,"blocked");
  assert.equal(assessErasurePlan({...plan,backupAndExternalCopyWarningAcknowledged:false},now).decision,"blocked");
  assert.equal(isDistinctErasureConfirmation(plan,{planId:plan.planId,scopeRevision:plan.scopeRevision,confirmedText:"NON"}),false);
  assert.equal(isDistinctErasureConfirmation(plan,{planId:plan.planId,scopeRevision:"revision-101",confirmedText:"EFFACER "+plan.planId}),false);
  assert.equal(isDistinctErasureConfirmation(plan,{planId:plan.planId,scopeRevision:plan.scopeRevision,confirmedText:"EFFACER "+plan.planId}),true);
 });
 it("refuse une analyse d'impact incomplète ou échouée",()=>{
  const missing={...plan,findings:plan.findings.slice(1)};
  assert.ok(assessErasurePlan(missing,now).blockers.includes("impact-incomplete"));
  const failed={...plan,findings:plan.findings.map((f,i)=>i?f:{...f,state:"failed" as const})};
  assert.ok(assessErasurePlan(failed,now).blockers.includes("impact-incomplete"));
 });
 it("empêche l'altération silencieuse des archives PDF/TXT",()=>{
  const invalid={...plan,findings:plan.findings.map(f=>
   f.category==="archived-pdf-txt"?{...f,affectedCount:1}:f)};
  assert.ok(assessErasurePlan(invalid,now).blockers.includes("immutable-archive"));
 });
 it("n'affirme pas qu'une anonymisation réidentifiable a réussi",()=>{
  const invalid={...plan,mode:"anonymize" as const,
   findings:plan.findings.map(f=>f.category==="personal-records"?
    {...f,affectedCount:1,reidentificationRisk:"possible" as const}:f)};
  assert.ok(assessErasurePlan(invalid,now).blockers.includes("anonymization-unproven"));
 });
 it("refuse la conservation de statistiques réidentifiables",()=>{
  const invalid={...plan,findings:plan.findings.map(f=>
   f.category==="collective-indicators"?{
    ...f,affectedCount:1,action:"preserve-with-justification" as const,
    reidentificationRisk:"unknown" as const}:f)};
  assert.ok(assessErasurePlan(invalid,now).blockers.includes("collective-reidentification-risk"));
 });
});

describe("SMN-39 — marqueurs minimaux d'effacement",()=>{
 it("enchaîne des événements authentifiés sans y copier les données effacées",()=>{
  const key=randomBytes(32);
  const first=createErasureMarker(key,ERASURE_GENESIS_MAC,"erase",new Date(date));
  const second=createErasureMarker(key,first.mac,"anonymize",new Date("2026-11-09T10:01:00Z"));
  assert.equal(verifyErasureChain(key,[first,second]),true);
  assert.equal(JSON.stringify([first,second]).includes("subjectToken"),false);
  assert.equal(verifyErasureChain(key,[second]),false);
  assert.equal(verifyErasureChain(key,[{...first,operation:"anonymize"},second]),false);
  assert.equal(verifyErasureChain(randomBytes(32),[first,second]),false);
 });
});
