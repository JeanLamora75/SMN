import {test} from "node:test";
import assert from "node:assert/strict";
import {assessHistoricalPrivacyQualification} from "../src/server/backup/historical-privacy-qualification";
import type {TableImpact} from "../src/server/backup/erasure-impact-graph";
const source=(table:string,category:TableImpact["category"],
 count:number|null,state:TableImpact["state"]="inspected"):TableImpact=>({
 table,category,count,state,scope:"indirect"
});
test("SMN-38: a member with historical links and unknown text remains blocked",()=>{
 const qualification=assessHistoricalPrivacyQualification({
  mode:"erase",boundedProvisionalEligible:false,observedTables:[
   source("smn_member","personal-records",1),
   source("smn_member_assignment_version","history",4),
   source("smn_registry_comment_revision","free-text",null,"unknown")
  ]
 });
 assert.equal(qualification.scope,"historical-or-unqualified");
 assert.equal(qualification.historicalErasurePermitted,false);
 assert.equal(qualification.historicalAnonymizationPermitted,false);
 assert.equal(qualification.unknownSources,1);
 assert.equal(qualification.positiveReferenceSources,1);
 assert.ok(qualification.pending.includes("unverified-relations"));
 assert.ok(qualification.pending.includes("free-text"));
 assert.ok(qualification.pending.includes("archive-content"));
 assert.ok(qualification.pending.includes("collective-retention"));
 assert.ok(qualification.pending.includes("reintroduction-proof"));
 assert.equal(JSON.stringify(qualification).includes("member-id"),false);
});
test("SMN-39: even an apparently empty historical plan needs independent approval",()=>{
 const q=assessHistoricalPrivacyQualification({
  mode:"anonymize",boundedProvisionalEligible:false,observedTables:[
   source("smn_member","personal-records",1)
  ]
 });
 assert.equal(q.historicalAnonymizationPermitted,false);
 assert.ok(q.pending.includes("collective-retention"));
 assert.ok(q.pending.includes("anonymization-risk"));
 assert.ok(q.pending.includes("external-copies"));
});
test("SMN-39: restricted provisional path does not automatically authorize historical erasure",()=>{
 const q=assessHistoricalPrivacyQualification({
  mode:"erase",boundedProvisionalEligible:true,observedTables:[]});
 assert.equal(q.scope,"bounded-provisional");
 assert.equal(q.historicalErasurePermitted,false);
 assert.deepEqual(q.pending,[]);
});
