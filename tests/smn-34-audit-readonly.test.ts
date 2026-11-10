import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {assessRestoreAudit} from "../src/server/backup/restore-audit";
import type {RestorePreview} from "../src/server/backup/preview";
import type {ErasureEvidence} from "../src/server/backup/erasure-protection";

const archiveId="734b7cb1-38ac-4261-87a8-f9393fdcc301";
const source="singleton:2026-10-20T08:00:00.000Z";
const preview:RestorePreview={
 id:archiveId,checkedAt:"2026-11-10T20:00:00.000Z",
 archive:{id:archiveId,createdAt:"2026-11-10T19:00:00.000Z",
  checkedAt:"2026-11-10T20:00:00.000Z",status:"verified",reason:null,
  installationSource:source,applicationVersion:"0.1.0",schemaVersion:33,
  postgresVersion:"18.6",components:[],documentCount:0,integrityVerified:true,
  restoreTested:false,scopeComplete:true},
 current:{installationSource:source,applicationVersion:"0.1.0",schemaVersion:33,
  postgresVersion:"18.6",documentCount:0},
 issues:[],blocked:false,canRestore:false
};
const privacy:ErasureEvidence={
 state:"verified",source:"external-append-only",
 coverageStart:"2026-11-09T00:00:00.000Z",
 checkedAt:"2026-11-10T20:00:00.000Z",latestErasureAt:null,
 entriesAfterBackup:0,signatureVerified:true,completeHistory:false,
 memberScopeVerified:true
};
const proof={complete:false,checkedAt:"2026-11-10T20:00:00.000Z",
 reason:"archive-review-required",events:3};
const empty={complete:true,
 counts:{pdf:0,officeReports:0,officeTemplates:0,privateFiles:0}};

test("SMN-34: diagnostic empty archives ne certifie pas l'historique",()=>{
 const report=assessRestoreAudit({
  preview,privacy,erasureIntegrity:proof,archiveInventory:empty,platform:"win32"
 });
 assert.equal(report.canActivate,false);
 assert.equal(report.mode,"read-only");
 assert.equal(report.privacy.coverageComplete,false);
 assert.equal(report.archives.status,"inventory-empty-not-cleared");
 assert.equal(report.windowsRecette.scenariosWitnessed,0);
 assert.equal(report.windowsRecette.scenariosRequired,14);
 assert.ok(report.preflightBlockers.includes("privacy-erasures-unverified"));
});
test("SMN-34: archives presentes imposent inspection humaine et version absente n'est pas vide",()=>{
 const archiveInventory={complete:true,
  counts:{pdf:1,officeReports:2,officeTemplates:1,privateFiles:0}};
 const reviewed=assessRestoreAudit({
  preview,privacy,erasureIntegrity:proof,archiveInventory,platform:"linux"
 });
 assert.equal(reviewed.archives.status,"human-review-required");
 assert.deepEqual(reviewed.archives.counts,archiveInventory.counts);
 assert.equal(reviewed.windowsRecette.actualWindowsHost,false);
 const unavailable=assessRestoreAudit({
  preview,privacy,erasureIntegrity:null,archiveInventory:null,platform:"win32"
 });
 assert.equal(unavailable.archives.status,"unverified");
 assert.equal(unavailable.archives.counts,null);
 assert.equal(unavailable.privacy.integrityReason,"unavailable");
});
test("SMN-34: aucune attestation booleenne ne remplace la recette hors ligne",()=>{
 const report=assessRestoreAudit({
  preview,privacy:{...privacy,completeHistory:true},
  erasureIntegrity:{complete:true,checkedAt:"2026-11-10T20:00:00.000Z",
   reason:"qualified-empty-archives-and-guarded-member-erasure",events:0},
  archiveInventory:empty,platform:"win32"
 });
 assert.equal(report.canActivate,false);
 assert.equal(report.execution.productionCutover,false);
 assert.equal(report.execution.writersStoppedProven,false);
 assert.equal(report.execution.persistentSessionsProven,false);
 assert.equal(report.windowsRecette.status,"not-performed");
});
test("SMN-34: le CLI audit ne contient ni operation de bascule ni transmission externe",()=>{
 const cli=readFileSync(new URL("../scripts/smn-34-audit-readonly.ts",import.meta.url),"utf8");
 assert.match(cli,/--audit-only/);
 assert.match(cli,/withSessionReadDb/);
 assert.match(cli,/assessRestoreAudit/);
 assert.match(cli,/previewBackupReadOnly/);
 assert.doesNotMatch(cli,/from ["\x27]\.\.\/src\/server\/backup\/preview["\x27]/);
 assert.doesNotMatch(cli,/\b(?:rename|rm|spawn|exec|fetch|rehearseOfflineDatabaseCutover|rehearseCoordinatedOfflineCutover)\(/);
});

test("SMN-34: previsualisation CLI conserve une transaction SQL read-only",()=>{
 const source=readFileSync(new URL("../src/server/backup/restore-audit-preview.ts",import.meta.url),"utf8");
 assert.match(source,/withSessionReadDb/);
 assert.match(source,/inspectBackup/);
 assert.match(source,/evaluatePreview/);
 assert.match(source,/key\?\.fill\(0\)/);
 assert.doesNotMatch(source,/\b(?:spawn|rename|rm|exec|fetch)\(/);
 assert.doesNotMatch(source,/import "server-only"/);
});
