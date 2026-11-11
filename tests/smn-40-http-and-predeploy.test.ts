import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {issueImpactReceipt,verifyImpactReceipt}
 from "../src/server/backup/erasure-plan-token";
import {predeployDecision} from "../scripts/smn-40-predeploy-audit";
const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("exceptional HTTP route requires admin and exact signed confirmation before DB connection",()=>{
 const route=source("src/app/api/admin/erasure/execute/route.ts");
 const actor=route.indexOf('actor.role!=="admin"');
 const body=route.indexOf('Object.keys(body).sort().join(",")');
 const token=route.indexOf("verifyImpactReceipt(body.token,actor.id)");
 const typed=route.indexOf('body.confirmation!=="EFFACER "+receipt.planId');
 const revision=route.indexOf("preview.scopeRevision!==receipt.scopeRevision");
 const connection=route.indexOf("await installedDatabaseUri()");
 assert.ok(actor>=0&&body>actor&&token>body&&typed>token&&revision>typed);
 assert.ok(connection>revision,"no database write connection before authorization");
 assert.match(route,/body\.acknowledgeExternalCopies!==true/);
 assert.match(route,/if\(!receipt\|\|receipt\.mode!=="erase"/);
 assert.match(route,/eraseRestrictedMember\(db/);
 assert.match(route,/eraseDependentMember\(db/);
 assert.match(route,/restorePermitted:false/);
 assert.doesNotMatch(route,/forceErase|bypassPrivacy|disableAudit/);
});

test("signed erasure token cannot be used by another actor, after expiry or with a different plan",()=>{
 const now=new Date("2026-11-11T08:00:00.000Z");
 const signed=issueImpactReceipt({actorId:"admin-synthetic",memberId:"member-test",
  mode:"erase",scopeRevision:"e".repeat(64)},now);
 assert.ok(signed);
 assert.equal(verifyImpactReceipt(signed.token,"admin-synthetic",now)?.planId,
  signed.receipt.planId);
 assert.equal(verifyImpactReceipt(signed.token,"other-admin",now),null);
 assert.equal(verifyImpactReceipt(signed.token,"admin-synthetic",
  new Date(now.getTime()+600_000)),null);
 assert.equal(verifyImpactReceipt(signed.token+"x","admin-synthetic",now),null);
});

test("predeployment audit never grants deployment, restoration or backup validity",()=>{
 const empty=predeployDecision({schemaVersion:33,guardsPresent:0,
  unresolvedIntent:null,historicalCoverageComplete:false,
  backupIndependentlyVerified:false});
 assert.equal(empty.deploymentAuthorized,false);
 assert.equal(empty.historicalRestoreAuthorized,false);
 assert.equal(empty.missingGuards,7);
 assert.equal(empty.requiresIndependentBackupVerification,true);
 const full=predeployDecision({schemaVersion:33,guardsPresent:7,
  unresolvedIntent:false,historicalCoverageComplete:true,
  backupIndependentlyVerified:true});
 assert.equal(full.missingGuards,0);
 assert.equal(full.deploymentAuthorized,false);
 assert.equal(full.historicalRestoreAuthorized,false);
 const script=source("scripts/smn-40-predeploy-audit.ts");
 assert.match(script,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.doesNotMatch(script,/DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.smn_/);
});
