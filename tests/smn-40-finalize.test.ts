import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {parseFinalizeArgs,finalizeEligibility} from "../scripts/smn-40-finalize";

const archive="1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5";
test("one-shot maintenance defaults to read-only and never infers rollback qualification",()=>{
 assert.deepEqual(parseFinalizeArgs(["--check","--archive",archive]),
  {mode:"check",archiveId:archive});
 for(const args of [[],["--apply","--archive",archive],
  ["--apply","--archive",archive,
   "--isolated-restore-and-rollback-verified=NO",
   "--confirm=INSTALL_GUARDS_AND_ENROLL_NEW_LEDGER"],
  ["--apply","--archive","not-a-uuid",
   "--isolated-restore-and-rollback-verified=YES",
   "--confirm=INSTALL_GUARDS_AND_ENROLL_NEW_LEDGER"]])
  assert.throws(()=>parseFinalizeArgs(args),/finalize-arguments-invalid/);
 assert.deepEqual(parseFinalizeArgs(["--apply","--archive",archive,
  "--isolated-restore-and-rollback-verified=YES",
  "--confirm=INSTALL_GUARDS_AND_ENROLL_NEW_LEDGER"]),
  {mode:"apply",archiveId:archive});
});
test("one-shot refuses partially installed guards and allows safe 7/7 resume",()=>{
 for(const n of [1,2,3,4,5,6,8]){
  assert.equal(finalizeEligibility(n,true).canInstallAndEnroll,false);
 }
 assert.equal(finalizeEligibility(0,true).canInstallAndEnroll,true);
 assert.equal(finalizeEligibility(7,true).canInstallAndEnroll,true);
 assert.equal(finalizeEligibility(0,false).canInstallAndEnroll,false);
 assert.equal(finalizeEligibility(7,false).canInstallAndEnroll,false);
 assert.equal(finalizeEligibility(7,true).restoreAuthorized,false);
 assert.equal(finalizeEligibility(7,true).historicalHistoryAttested,false);
});
test("real mutation occurs only after preflight, never after failed enrollment",()=>{
 const s=readFileSync(new URL("../scripts/smn-40-finalize.ts",import.meta.url),"utf8");
 assert.match(s,/inspectPrivacyInstallPreflight/);
 assert.match(s,/if\(!eligibility\.canInstallAndEnroll\)throw/);
 assert.match(s,/finalize-ledger-already-exists/);
 const preflight=s.indexOf("const before=await inspectPrivacyInstallPreflight");
 const sql=s.indexOf('runStep("smn-40-maintenance.ts"');
 const ledger=s.indexOf('runStep("smn-40-ledger-enrollment.ts",[');
 assert.ok(preflight>=0&&preflight<sql&&sql<ledger);
 assert.match(s,/if\(before\.guardsInstalled===0\)/);
 assert.match(s,/if\(count!==7\)/);
 assert.match(s,/if\(verified!==7\)/);
 assert.match(s,/historicalHistoryAttested:false/);
 assert.match(s,/restorationAuthorized:false/);
 assert.doesNotMatch(s,/DROP DATABASE|TRUNCATE|DELETE FROM public/);
});
