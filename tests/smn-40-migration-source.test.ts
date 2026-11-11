import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {assessMigrationSource} from "../src/server/backup/migration-source-policy";
import type {BackupInventoryEntry} from "../src/server/backup/verification";

const archive:BackupInventoryEntry={
 id:"39b6262d-5f27-4bf8-a005-701dfd9cd9a2",
 createdAt:"2026-11-11T18:27:39.087Z",status:"verified",
 reason:null,checkedAt:"2026-11-11T19:00:00.000Z",
 installationSource:"singleton:2026-11-01T00:00:00.000Z",
 applicationVersion:"1.0.0",schemaVersion:33,postgresVersion:"18.6",
 components:[],documentCount:0,integrityVerified:true,
 scopeComplete:true,restoreTested:false
};
const ledger={verified:true,coverageStart:"2026-11-11T13:36:18.984Z",
 pendingErasure:false,postArchiveErasureCount:0};
test("v4 archive after anchored ledger is a transport candidate, never active restore",()=>{
 const result=assessMigrationSource(archive,ledger);
 assert.equal(result.exportCandidate,true);
 assert.equal(result.restorationAuthorized,false);
 assert.equal(result.preservesMemberNames,true);
 assert.equal(result.preservesHistory,true);
 assert.ok(result.warnings.includes("historical-erasures-not-attested"));
});
test("refuse invalid, old, partial or pre-ledger packages",()=>{
 for(const sample of [
  {...archive,integrityVerified:false},
  {...archive,scopeComplete:false},
  {...archive,schemaVersion:32},
  {...archive,createdAt:"2026-11-11T12:00:00.000Z"}
 ]){
  assert.equal(assessMigrationSource(sample,ledger).exportCandidate,false);
 }
});
test("refuse lost ledger, missing proof, pending and subsequent erasures",()=>{
 for(const sample of [
  {...ledger,verified:false},
  {...ledger,pendingErasure:true},
  {...ledger,postArchiveErasureCount:null},
  {...ledger,postArchiveErasureCount:1}
 ]){
  const result=assessMigrationSource(archive,sample);
  assert.equal(result.exportCandidate,false);
  assert.equal(result.restorationAuthorized,false);
 }
});
test("migration source endpoint never exports bytes or modifies installed data",()=>{
 const src=readFileSync(new URL("../src/app/api/admin/backups/migration/source/route.ts",import.meta.url),"utf8");
 assert.match(src,/authorizeApi\(request,"write"/);
 assert.match(src,/Object\.keys\(body\)\.length!==1/);
 assert.match(src,/readErasureLedger\(\)/);
 assert.match(src,/hasUnresolvedErasureIntent\(\)/);
 assert.doesNotMatch(src,/pg_restore|CREATE DATABASE|DROP DATABASE|rename\(|writeFile\(|appendFile\(/);
});
