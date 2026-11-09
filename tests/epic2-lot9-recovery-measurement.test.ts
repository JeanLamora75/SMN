import assert from "node:assert/strict";
import {test} from "node:test";
import {qualifyRecoveryDrill} from "../src/server/backup/recovery-drill-measurement";
const valid={
 mode:"restore" as const,startedAt:"2026-11-09T09:00:00.000Z",
 verifiedAt:"2026-11-09T09:02:30.000Z",
 databaseMatchesExpected:true,filesMatchExpected:true,
 rollbackDatabaseVerified:true,rollbackFilesVerified:true,
 journalVerified:true,sessionRevocationVerified:true
};
test("SMN-41: an isolated cutover duration is not a production RTO or RPO",()=>{
 const r=qualifyRecoveryDrill(valid);
 assert.equal(r.status,"verified");
 assert.equal(r.measuredCutoverMinutes,2.5);
 assert.equal(r.productionRtoMinutes,null);
 assert.equal(r.productionRpoMinutes,null);
 assert.equal(r.objectivesValidated,false);
 assert.equal(r.measuredDataLossMinutes,null);
});
test("SMN-34/37: uncertain rollback or missing session revocation denies measurement",()=>{
 for(const key of ["databaseMatchesExpected","filesMatchExpected",
  "rollbackDatabaseVerified","rollbackFilesVerified",
  "journalVerified","sessionRevocationVerified"] as const){
  const r=qualifyRecoveryDrill({...valid,[key]:false});
  assert.equal(r.status,"unverifiable",key);
  assert.equal(r.measuredCutoverMinutes,null,key);
  assert.ok(r.blockers.length,key);
 }
 for(const time of ["bad","2026-11-09T08:59:59.000Z"]){
  const r=qualifyRecoveryDrill({...valid,verifiedAt:time});
  assert.equal(r.status,"unverifiable");
 }
});
test("SMN-37: reset drill is not proof of a destructive production reset",()=>{
 const r=qualifyRecoveryDrill({...valid,mode:"reset"});
 assert.equal(r.status,"verified");
 assert.equal(r.objectivesValidated,false);
 assert.equal(r.productionRtoMinutes,null);
});
