import assert from "node:assert/strict";
import {test} from "node:test";
import {assessFreshDestination,type FreshDestinationEvidence}
 from "../src/server/backup/fresh-destination-readiness";

const ready:FreshDestinationEvidence={
 postgresMajor:18,managedClusterOwned:true,activeDatabaseExists:true,
 publicUserTableCount:0,managedFileCount:0,existingLedger:false,
 maintenanceMarkerPresent:true,webServerStopped:true,
 sourceReceiptVerified:true,candidateFingerprintMatched:true
};
test("offline empty destination may reach operator review, never grants restoration",()=>{
 const v=assessFreshDestination(ready);
 assert.equal(v.state,"pristine");
 assert.equal(v.mayConsiderOfflineCutover,true);
 assert.equal(v.restorationAuthorized,false);
});
test("freshly installed SMN schema is not a blank PostgreSQL destination",()=>{
 const v=assessFreshDestination({...ready,publicUserTableCount:195});
 assert.equal(v.state,"initialized-or-populated");
 assert.equal(v.mayConsiderOfflineCutover,false);
 assert.ok(v.blockers.includes("destination-not-pristine"));
});
test("unknown destination or unavailable registry must fail closed",()=>{
 const v=assessFreshDestination({...ready,publicUserTableCount:null,existingLedger:null});
 assert.equal(v.state,"unverifiable");
 assert.equal(v.mayConsiderOfflineCutover,false);
});
test("running web server or insufficient proof blocks offline cutover",()=>{
 for(const evidence of [
  {webServerStopped:false},{maintenanceMarkerPresent:false},
  {sourceReceiptVerified:false},{candidateFingerprintMatched:false},
  {managedClusterOwned:false},{postgresMajor:17},
  {managedFileCount:1},{existingLedger:true}
 ]){
  const v=assessFreshDestination({...ready,...evidence});
  assert.equal(v.mayConsiderOfflineCutover,false,JSON.stringify(evidence));
  assert.equal(v.restorationAuthorized,false);
 }
});
