import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SMN-442: browser confirmation only queues an encrypted single-use job",()=>{
 const route=read("src/app/api/admin/backups/migration/restore/route.ts");
 const client=read("src/app/app/admin/backups/migration-import-admin.tsx");
 assert.match(route,/authorizeApi\(request,"write"/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/REPLACE_CURRENT_SMN_WITH_VERIFIED_BACKUP/);
 assert.match(route,/encryptSetting\(JSON\.stringify/);
 assert.match(route,/flag:"wx"/);
 assert.match(route,/launcher\.at/);
 assert.match(client,/restoreConsent/);
 assert.match(client,/window\.confirm\(/);
 assert.match(client,/beginRestore/);
 assert.match(client,/sourceEvidenceVerified/);
 assert.doesNotMatch(route,/DROP DATABASE|ALTER DATABASE|pg_restore|DELETE FROM/);
});

test("SMN-442: only owner Windows launcher runs the migration after shutdown",()=>{
 const launcher=read("scripts/windows/launch-portable.mjs");
 const pack=read("scripts/windows/package-portable.mjs");
 const smoke=read("scripts/windows/verify-package.mjs");
 assert.match(launcher,/migration-pending\.json/);
 assert.match(launcher,/child\.kill\("SIGTERM"\)/);
 assert.match(launcher,/executeGuiMigration\(\)/);
 assert.match(launcher,/if\(!applying&&!restoring\)/);
 assert.match(launcher,/if\(restoring\)/);
 assert.match(launcher,/await maintenanceBlocked\(\)/);
 for(const source of [pack,smoke])
  assert.match(source,/"smn-gui-offline-restore"/);
});

test("SMN-442: supervisor rechecks signed evidence and preserves rollback DB",()=>{
 const worker=read("scripts/smn-gui-offline-restore.ts");
 assert.match(worker,/decryptSetting\(/);
 assert.match(worker,/inspectBackup\(/);
 assert.match(worker,/inspectGuiLedgerEvidence\(/);
 assert.match(worker,/beginOfflineRestoreMaintenance\(/);
 assert.match(worker,/installGuiPrivacyEvidence\(/);
 assert.match(worker,/prepareFreshManagedCandidate\(/);
 assert.match(worker,/activateFreshManagedInstallation\(/);
 assert.match(worker,/inspectOfflineCutoverJournal\(/);
 assert.match(worker,/rollbackVerifiedNewComputerCutover\(/);
 assert.match(worker,/releaseVerifiedNewComputerCutover\(/);
 assert.match(worker,/parkGuiPrivacyEvidence\(/);
 assert.match(worker,/allUsersMustLogInAgain:true/);
 assert.match(worker,/phase="incident"/);
 assert.doesNotMatch(worker,/DROP DATABASE|DELETE FROM|TRUNCATE|unlink\(/);
});

test("SMN-442: replacement retains existing target files and does not demand blank DB",()=>{
 const source=read("src/server/backup/fresh-install-cutover.ts");
 assert.match(source,/replaceInitializedDestination===true/);
 assert.match(source,/await fingerprintsByGroups\(operations\.map\(op=>op\.active\)\)/);
 assert.match(source,/await rename\(op\.active,op\.rollback\)/);
 assert.match(source,/ALTER DATABASE/);
 assert.match(source,/journalPath:journal!/);
});

test("SMN-442: source ZIP includes authenticated erasure evidence",()=>{
 const source=read("src/app/api/admin/backups/migration/export/route.ts");
 const verification=read("src/server/backup/portable-import.ts");
 assert.match(source,/captureGuiTransferEvidence\(/);
 assert.match(source,/wrapPortableTransferZip\(/);
 assert.match(verification,/inspectGuiLedgerEvidence\(/);
 assert.match(verification,/comparePortableCurrentState\(/);
 assert.match(verification,/sourceEvidenceVerified/);
});

test("SMN-442: restore status is read-only and all new controls are translated",()=>{
 const status=read("src/app/api/admin/backups/migration/restore/status/route.ts");
 assert.match(status,/authorizeApi\(request,"read"/);
 assert.doesNotMatch(status,/DROP DATABASE|ALTER DATABASE/);
 const fr=JSON.parse(read("src/i18n/fr.json")).backups.transfer;
 const en=JSON.parse(read("src/i18n/en.json")).backups.transfer;
 for(const name of ["restoreTitle","restoreImpact","restoreConsent","restoreStart",
  "restoreQueued","restoreProgress","restoreRejected","confirmDialog","stageLabel"]){
  assert.ok(fr[name]&&en[name],name);
 }
 assert.deepEqual(Object.keys(fr.stages).sort(),Object.keys(en.stages).sort());
});
