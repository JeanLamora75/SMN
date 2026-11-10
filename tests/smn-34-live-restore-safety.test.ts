import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {assessOfflineRestoreActivation} from "../src/server/backup/restore-activation-policy";
import {assessRestoreGate} from "../src/server/backup/restore-readiness";
import type {RestorePreview} from "../src/server/backup/preview";
import type {ErasureEvidence} from "../src/server/backup/erasure-protection";

const archiveId="734b7cb1-38ac-4261-87a8-f9393fdcc301";
const source="singleton:2026-10-20T08:00:00.000Z";
const preview:RestorePreview={
 id:archiveId,checkedAt:"2026-11-10T09:00:00.000Z",
 archive:{id:archiveId,createdAt:"2026-11-10T08:00:00.000Z",
  checkedAt:"2026-11-10T09:00:00.000Z",status:"verified",reason:null,
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
 checkedAt:"2026-11-10T09:00:00.000Z",latestErasureAt:null,
 entriesAfterBackup:0,signatureVerified:true,completeHistory:false,
 memberScopeVerified:true
};
const offline={
 sandboxRehearsed:true,sourceCheckpointVerified:true,
 allManagedFileVersionsStaged:true,restorationManifestVerified:true,
 appTrafficDrained:true,sessionStoreReplaced:true,
 databaseCutoverJournalVerified:true,rollbackDatabaseRetained:true
} as const;

test("SMN-34 / SMN-40: des preuves techniques parfaites ne remplacent pas la couverture d'effacement",()=>{
 const verdict=assessOfflineRestoreActivation(preview,privacy,offline);
 assert.equal(verdict.eligible,false);
 assert.ok(verdict.blockers.includes("untrusted-erasure-history"));
 assert.equal(assessRestoreGate(preview,privacy).canExecute,false);
});
test("SMN-34 / SMN-40: archive ancienne, registre non ancré et historique lacunaire restent interdits",()=>{
 const old={...privacy,coverageStart:"2026-11-10T08:01:00.000Z"} as const;
 assert.ok(assessOfflineRestoreActivation(preview,old,offline).blockers.includes("coverage-gap"));
 const missing={state:"unavailable",reason:"ledger-unavailable"} as const;
 assert.ok(assessOfflineRestoreActivation(preview,missing,offline).blockers.includes("untrusted-erasure-history"));
 const erased={...privacy,completeHistory:true,entriesAfterBackup:1,
  latestErasureAt:"2026-11-10T08:30:00.000Z"} as const;
 assert.ok(assessOfflineRestoreActivation(preview,erased,offline).blockers.includes("previously-erased-data"));
});
test("SMN-34: aucun attribut navigateur ni environnement ne désactive les prérequis offline",()=>{
 for(const key of Object.keys(offline) as (keyof typeof offline)[]){
  const evidence={...offline,[key]:false};
  const result=assessOfflineRestoreActivation(preview,{...privacy,completeHistory:true},evidence);
  assert.equal(result.eligible,false,key);
  assert.ok(result.blockers.length>0,key);
 }
 const route=readFileSync(new URL("../src/app/api/admin/backups/restore/preflight/route.ts",import.meta.url),"utf8");
 assert.match(route,/authorizeApi\(request,"write",\{type:"backups"/);
 assert.match(route,/assessRestoreGate\(preview,evidence\)/);
 assert.match(route,/\},409\)/);
 assert.doesNotMatch(route,/\b(?:spawn|rename|rm|rehearseCoordinatedOfflineCutover)\(/);
});
