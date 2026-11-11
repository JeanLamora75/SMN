import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {assessBackupReadiness} from "../scripts/smn-40-backup-readiness";

test("a verified v33 archive and documents do not authorize deployment or historical restoration",()=>{
 const verdict=assessBackupReadiness({
  archiveStatus:"verified",archiveIntegrity:true,schemaVersion:33,
  inventoryVerified:true,previewIssues:[]
 });
 assert.equal(verdict.bytesAndManifestVerified,true);
 assert.equal(verdict.compatibleV33,true);
 assert.equal(verdict.documentsInventoryVerified,true);
 assert.equal(verdict.independentlyRestoredAndRollbackQualified,false);
 assert.equal(verdict.privacyHistoryQualified,false);
 assert.equal(verdict.deploymentAuthorized,false);
});
test("missing archive evidence or documents fail closed",()=>{
 const verdict=assessBackupReadiness({
  archiveStatus:"unavailable",archiveIntegrity:false,schemaVersion:33,
  inventoryVerified:false,previewIssues:["archive-missing"]
 });
 assert.equal(verdict.bytesAndManifestVerified,false);
 assert.equal(verdict.documentsInventoryVerified,false);
 assert.equal(verdict.deploymentAuthorized,false);
});
test("backup readiness script only uses read-only validation, not restore or ledger enrollment",()=>{
 const source=readFileSync(new URL("../scripts/smn-40-backup-readiness.ts",import.meta.url),"utf8");
 assert.match(source,/previewBackupReadOnly/);
 assert.match(source,/withSessionReadDb\(db=>inspectExtraArchives\(db\)\)/);
 assert.doesNotMatch(source,/initializeErasureLedger|pg_restore|DROP DATABASE|CREATE DATABASE/);
});
