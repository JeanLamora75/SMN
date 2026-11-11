import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {historicalPrivacyDecision} from "../scripts/smn-40-historical-privacy-audit";

test("even complete-looking evidence cannot authorize historical restoration",()=>{
 const verdict=historicalPrivacyDecision({
  guardsInstalled:7,archiveCandidates:0,archivesVerified:true,
  ledgerState:"verified",historicDeletionEvidence:true,collectivesReviewed:7
 });
 assert.equal(verdict.status,"blocked");
 assert.equal(verdict.deploymentAuthorized,false);
 assert.equal(verdict.historicalRestoreAuthorized,false);
 assert.equal(verdict.historicalErasureCoverageQualified,false);
});
test("missing ledger, archives and historical attestations remain blocking",()=>{
 const verdict=historicalPrivacyDecision({
  guardsInstalled:0,archiveCandidates:2,archivesVerified:false,
  ledgerState:"unconfigured",historicDeletionEvidence:false,collectivesReviewed:0
 });
 assert.ok(verdict.pending.includes("sql-guards-not-installed"));
 assert.ok(verdict.pending.includes("external-ledger-unqualified"));
 assert.ok(verdict.pending.includes("archive-inventory-unverified"));
 assert.ok(verdict.pending.includes("human-archive-review-required"));
 assert.ok(verdict.pending.includes("historical-deletion-attestation-missing"));
 assert.ok(verdict.pending.includes("collective-retention-review-missing"));
});
test("live historical audit is read only and never prints names or fingerprints",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-historical-privacy-audit.ts",import.meta.url),"utf8");
 assert.match(script,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(script,/collectArchiveReviewInventory/);
 assert.match(script,/COLLECTIVE_FAMILIES/);
 assert.match(script,/preEnrollmentHistoryAttested:false/);
 assert.match(script,/historicalRestoreAuthorized:false/);
 assert.doesNotMatch(script,/CREATE DATABASE|DROP DATABASE|DELETE FROM|initializeErasureLedger|appendCompletedErasure/);
});


test("audit uses installed private store and independently inventories Office and PDF",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-historical-privacy-audit.ts",import.meta.url),"utf8");
 assert.match(script,/inspectExtraArchives\(db\)/);
 assert.match(script,/installedPrivateDocumentsDirectory\(\)/);
 assert.match(script,/archive-validation-failed/);
 assert.match(script,/combined-inventory-unavailable/);
 assert.match(script,/privateStoreConfigured:archiveReason!==/);
 assert.match(script,/archiveState==="verified"\?null:archiveReason/);
});
