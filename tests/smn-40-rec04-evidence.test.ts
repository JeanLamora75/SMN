import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {assessRec04Observation} from "../scripts/smn-40-rec04-evidence";

test("isolated REC-04 archive and database checks never authorize deployment or restoration",()=>{
 const result=assessRec04Observation({
  archiveStatus:"verified",archiveIntegrity:true,schema:33,
  pgVersion:"18.6",tableCount:192,physicalClusterMatch:true,
  officeReports:1,officeTemplates:1,pdf:0
 });
 assert.equal(result.sourceArchiveVerified,true);
 assert.equal(result.isolatedPg18Verified,true);
 assert.equal(result.restoredV33Observed,true);
 assert.equal(result.officeComponentsPresent,true);
 assert.equal(result.snapshotRowEquivalenceProven,false);
 assert.equal(result.rollbackCutoverQualified,false);
 assert.equal(result.historicalErasureCoverageQualified,false);
 assert.equal(result.deploymentAuthorized,false);
});
test("REC-04 wrong cluster or incomplete archive are never accepted",()=>{
 const base={archiveStatus:"verified",archiveIntegrity:true,schema:33,
  pgVersion:"18.6",tableCount:192,physicalClusterMatch:true,
  officeReports:1,officeTemplates:1,pdf:0};
 assert.equal(assessRec04Observation({...base,physicalClusterMatch:false}).isolatedPg18Verified,false);
 assert.equal(assessRec04Observation({...base,archiveIntegrity:false}).sourceArchiveVerified,false);
 assert.equal(assessRec04Observation({...base,tableCount:191}).restoredV33Observed,false);
 assert.equal(assessRec04Observation({...base,officeTemplates:0}).officeComponentsPresent,false);
});
test("REC-04 check has no migration, clone, restore or enrollment operation",()=>{
 const c=readFileSync(new URL("../scripts/smn-40-rec04-evidence.ts",import.meta.url),"utf8");
 assert.match(c,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(c,/current_setting\('data_directory'\)/);
 assert.match(c,/--check/);
 assert.doesNotMatch(c,/CREATE DATABASE|DROP DATABASE|pg_restore|initializeErasureLedger/);
});
