import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {privacyInstallDecision,isSafeNativeDatabase}
 from "../scripts/smn-40-privacy-install-preflight";
import {parseLedgerEnrollmentArgs,assessLedgerEnrollment}
 from "../scripts/smn-40-ledger-enrollment";

const src=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const confirmed=["--enroll","--archive",
 "1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5",
 "--confirm=ENROLL_NEW_HISTORY_FROM_TODAY"];

test("offline SQL preflight never authorizes historical restoration",()=>{
 const ok=privacyInstallDecision({v33:true,verifiedArchive:true,
  localDatabase:true,otherDatabaseSessions:0,httpStopped:true,
  installedGuards:0});
 assert.equal(ok.readyForExplicitGuardsInstallation,true);
 assert.equal(ok.restorationAuthorized,false);
 assert.equal(ok.historicalPrivacyQualified,false);
 for(const altered of [
  {verifiedArchive:false},{httpStopped:false},{otherDatabaseSessions:null},
  {otherDatabaseSessions:1},{v33:false},{localDatabase:false}
 ]){
  assert.equal(privacyInstallDecision({...{
   v33:true,verifiedArchive:true,localDatabase:true,
   otherDatabaseSessions:0,httpStopped:true,installedGuards:0
  },...altered}).readyForExplicitGuardsInstallation,false);
 }
});
test("native migration blocks remote, production-like or option-injected URLs",()=>{
 const ok="postgresql://smn:test@127.0.0.1:5432/smn";
 assert.equal(isSafeNativeDatabase(ok),true);
 for(const bad of [ok.replace("127.0.0.1","example.org"),
  ok.replace(":5432/smn",":5432/postgres"),ok+"?options=-csearch_path%3Dpublic",
  ok.replace("smn:test@","smn:@")])
  assert.equal(isSafeNativeDatabase(bad),false);
});
test("external ledger enrollment requires explicit date-scoped human approval",()=>{
 assert.equal(parseLedgerEnrollmentArgs(["--check"]),"check");
 assert.equal(parseLedgerEnrollmentArgs(confirmed),"enroll");
 for(const args of [[],["--enroll"],["--enroll",confirmed[3]],
  ["--enroll","--archive",confirmed[2],"--confirm=YES"],
  ["--enroll","--archive","wrong",confirmed[3]]]){
  assert.throws(()=>parseLedgerEnrollmentArgs(args),
   /privacy-ledger-enrollment-arguments-invalid/);
 }
});
test("ledger enrollment needs 7 guards and refuses any existing history material",()=>{
 const input={guardsInstalled:7,ledgerExists:false,anchorExists:false,
  keyExists:false,schemaVersion:33,windows:true};
 assert.equal(assessLedgerEnrollment(input).canEnrollNewHistory,true);
 for(const altered of [{guardsInstalled:6},{ledgerExists:true},
  {anchorExists:true},{keyExists:true},{schemaVersion:32},{windows:false}]){
  const result=assessLedgerEnrollment({...input,...altered});
  assert.equal(result.canEnrollNewHistory,false);
  assert.equal(result.historicalCoverageComplete,false);
  assert.equal(result.restorationAuthorized,false);
 }
});
test("migration remains one transaction and requires real archive proof",()=>{
 const program=src("scripts/smn-40-maintenance.ts");
 assert.match(program,/SMN40_PRIVACY_BACKUP_ARCHIVE_ID/);
 assert.match(program,/inspectPrivacyInstallPreflight/);
 assert.match(program,/maintenance-preflight-refused/);
 assert.match(program,/maintenance-active-db-sessions/);
 assert.match(program,/await db\.query\("BEGIN"\)/);
 assert.match(program,/await db\.query\("ROLLBACK"\)/);
});
test("Windows enrollment never stores raw signing key in .env or GitHub",()=>{
 const program=src("scripts/smn-40-ledger-enrollment.ts");
 const loader=src("scripts/windows/privacy-ledger-env.mjs");
 assert.match(program,/ProtectedData/);
 assert.match(program,/::Protect/);
 assert.match(program,/flag:"wx"/);
 assert.match(program,/initializeErasureLedger/);
 assert.match(program,/inspectPrivacyInstallPreflight/);
 assert.match(loader,/ProtectedData/);
 assert.match(loader,/::Unprotect/);
 assert.match(loader,/privacy-ledger-enrollment-incomplete/);
 assert.doesNotMatch(program,/\.env\.local.*writeFile|DROP TABLE|DELETE FROM|UPDATE public/);
});
