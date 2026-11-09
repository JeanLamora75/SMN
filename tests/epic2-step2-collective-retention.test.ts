import assert from "node:assert/strict";
import {test} from "node:test";
import {COLLECTIVE_FAMILIES,assessCollectiveRetention,
 assessCollectiveRetentionSet,type CollectiveRetentionReview}
 from "../src/server/backup/collective-retention-policy";

const date=new Date("2026-11-09T20:00:00.000Z");
const valid=(family:CollectiveRetentionReview["family"]):CollectiveRetentionReview=>({
 family,action:"preserve",revisionSha256:"a".repeat(64),
 reviewedRevisionSha256:"a".repeat(64),reviewedAt:"2026-11-09T19:00:00.000Z",
 reviewerId:"independent-reviewer",justification:"No personal reference or inference in contextual history",
 directIdentifiersExcluded:true,indirectIdentifiersExcluded:true,
 smallCohortInferenceExcluded:true,crossReportCorrelationExcluded:true,
 historicalSnapshotsChecked:true
});
test("Option A: preservation needs independent revision-bound absence of reidentification",()=>{
 const item=valid("velocity");
 assert.deepEqual(assessCollectiveRetention(item,date),{
  decision:"preserve-with-justification",code:"qualified",canAuthorizeErasure:false
 });
 for(const failure of [
  {...item,reviewedRevisionSha256:"b".repeat(64)},
  {...item,directIdentifiersExcluded:false},
  {...item,indirectIdentifiersExcluded:false},
  {...item,smallCohortInferenceExcluded:false},
  {...item,crossReportCorrelationExcluded:false},
  {...item,historicalSnapshotsChecked:false},
  {...item,justification:""},
  {...item,reviewerId:""},
  {...item,reviewedAt:"2026-11-10T19:00:00.000Z"}
 ]){
  assert.equal(assessCollectiveRetention(failure,date).decision,"blocked");
 }
 assert.equal(assessCollectiveRetention(null,date).decision,"blocked");
});
test("Option A: redaction or deletion is a required follow-up, not a proven operation",()=>{
 for(const action of ["redact","remove"] as const){
  const out=assessCollectiveRetention({...valid("capacity"),action},date);
  assert.equal(out.decision,"requires-redaction-or-removal");
  assert.equal(out.canAuthorizeErasure,false);
 }
});
test("Option A: every family including frozen v33 snapshots must be reviewed",()=>{
 const evidence=COLLECTIVE_FAMILIES.map(valid);
 assert.equal(assessCollectiveRetentionSet(evidence,date).complete,true);
 assert.deepEqual(assessCollectiveRetentionSet(evidence,date).preserve,[...COLLECTIVE_FAMILIES]);
 const missing=assessCollectiveRetentionSet(evidence.slice(0,-1),date);
 assert.equal(missing.complete,false);
 assert.deepEqual(missing.unresolved,["frozen-snapshot"]);
 const duplicate=assessCollectiveRetentionSet([...evidence,evidence[0]],date);
 assert.equal(duplicate.complete,false);
 assert.ok(duplicate.unresolved.includes("velocity"));
 const unsafe=assessCollectiveRetentionSet(
  evidence.map(x=>x.family==="sprint-report"?{...x,smallCohortInferenceExcluded:false}:x),date);
 assert.equal(unsafe.complete,false);
 assert.ok(unsafe.unresolved.includes("sprint-report"));
 const pending=assessCollectiveRetentionSet(
  evidence.map(x=>x.family==="indicator-v33"?{...x,action:"redact"}:x),date);
 assert.equal(pending.complete,false);
 assert.ok(pending.requiresAction.includes("indicator-v33"));
});
