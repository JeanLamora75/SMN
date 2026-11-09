import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {IMPACT_CATEGORIES,assessErasurePlan,type ErasureImpactPlan}
 from "../src/server/backup/exceptional-erasure-policy";

describe("SMN-38 — aperçu d'impact non exhaustif",()=>{
 it("toutes les catégories métier sont recensées",()=>{
  assert.deepEqual(IMPACT_CATEGORIES,[
   "personal-records","associations","calendars","history","free-text",
   "private-files","archived-pdf-txt","collective-indicators","managed-backups"
  ]);
 });
 it("des catégories inconnues interdisent toute confirmation d'effacement",()=>{
  const date="2026-11-09T09:00:00.000Z";
  const plan:ErasureImpactPlan={
   planId:"impact-preview-123",installationId:"singleton",subjectToken:"opaque-subject-123",
   mode:"erase",capturedAt:date,expiresAt:"2026-11-09T09:10:00.000Z",
   scopeRevision:"revision-abc123",backupAndExternalCopyWarningAcknowledged:true,
   findings:IMPACT_CATEGORIES.map(category=>({
    category,state:category==="personal-records"?"inspected":"unknown",
    affectedCount:category==="personal-records"?1:null,
    action:"review",justificationRecorded:false,
    reidentificationRisk:"unknown"
   }))
  };
  const assessment=assessErasurePlan(plan,new Date("2026-11-09T09:01:00.000Z"));
  assert.equal(assessment.decision,"blocked");
  assert.ok(assessment.blockers.includes("impact-incomplete"));
  assert.ok(assessment.blockers.includes("action-unjustified"));
 });
});
