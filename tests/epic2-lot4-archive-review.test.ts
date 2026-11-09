import {test} from "node:test";
import assert from "node:assert/strict";
import {assembleArchiveReview,assessArchiveReview,
 type ArchiveReviewDecision} from "../src/server/backup/erasure-archive-review";
const sha="a".repeat(64);
test("SMN-38: no archive can be silently declared inspected",()=>{
 const inventory=assembleArchiveReview([
  {kind:"pdf",sha256:sha,bytes:1024},
  {kind:"office-report",sha256:"b".repeat(64),bytes:4096}
 ],"2026-11-09T12:00:00.000Z");
 assert.equal(inventory.candidates.length,2);
 assert.ok(inventory.candidates.every(c=>c.inspection==="human-review-required"));
 assert.equal(assessArchiveReview(inventory,[],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 const verified=inventory.candidates.map(c=>({
  fingerprint:c.fingerprint,originalSha256:c.sha256,
  action:"restrict-original" as const,reviewedBy:"independent-reviewer",
  reviewedAt:"2026-11-09T12:01:00.000Z",
  verifiedAccessRestriction:true,verifiedReplacement:false,
  riskOfReidentification:"excluded" as const
 }));
 assert.equal(assessArchiveReview(inventory,verified,
  new Date("2026-11-09T12:05:00.000Z")).permitted,true);
 assert.equal(assessArchiveReview(inventory,
  [{...verified[0],verifiedAccessRestriction:false},verified[1]],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 assert.equal(assessArchiveReview(inventory,
  [{...verified[0],riskOfReidentification:"possible"},verified[1]],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 assert.equal(assessArchiveReview(inventory,
  [{...verified[0],action:"preserve"},verified[1]],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 assert.equal(assessArchiveReview(inventory,
  [{...verified[0],originalSha256:"c".repeat(64)},verified[1]],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 assert.equal(assessArchiveReview(inventory,
  [{...verified[0],reviewedAt:"2026-11-08T12:05:00.000Z"},verified[1]],
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 const changed=assembleArchiveReview([
  {kind:"pdf",sha256:"d".repeat(64),bytes:1024},
  {kind:"office-report",sha256:"b".repeat(64),bytes:4096}
 ],inventory.capturedAt);
 assert.equal(assessArchiveReview(changed,verified,
  new Date("2026-11-09T12:05:00.000Z")).permitted,false);
 assert.throws(()=>assembleArchiveReview([
  {kind:"pdf",sha256:sha,bytes:1024},
  {kind:"pdf",sha256:sha,bytes:1024}
 ]),/duplicate/);
});

test("SMN-38: forged, stale or reordered review inventories never authorize access decisions",()=>{
 const inventory=assembleArchiveReview([
  {kind:"office-template",sha256:"c".repeat(64),bytes:1300},
  {kind:"pdf",sha256:"d".repeat(64),bytes:2200}
 ],"2026-11-09T12:00:00.000Z");
 const decisions:ArchiveReviewDecision[]=inventory.candidates.map(c=>({
  fingerprint:c.fingerprint,originalSha256:c.sha256,action:"restrict-original",
  reviewedBy:"independent-reviewer",reviewedAt:"2026-11-09T12:01:00.000Z",
  verifiedAccessRestriction:true,verifiedReplacement:false,
  riskOfReidentification:"excluded"
 }));
 const validAt=new Date("2026-11-09T12:05:00.000Z");
 assert.equal(assessArchiveReview(inventory,decisions,validAt).permitted,true);
 const mutated={...inventory,inventorySha256:"f".repeat(64)};
 assert.deepEqual(assessArchiveReview(mutated,decisions,validAt).unresolved,["review-incomplete"]);
 const altered={...inventory,candidates:inventory.candidates.map((c,i)=>
  i===0?{...c,bytes:c.bytes+1}:c)};
 assert.equal(assessArchiveReview(altered,decisions,validAt).permitted,false);
 const reversed={...inventory,candidates:[...inventory.candidates].reverse()};
 assert.equal(assessArchiveReview(reversed,decisions,validAt).permitted,false);
 const stale=new Date("2026-11-10T12:00:01.000Z");
 assert.equal(assessArchiveReview(inventory,decisions,stale).permitted,false);
 const future=new Date("2026-11-09T11:59:59.000Z");
 assert.equal(assessArchiveReview(inventory,decisions,future).permitted,false);
});
