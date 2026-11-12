import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {validateFreshInstallPaths} from "../src/server/backup/fresh-install-cutover";

const cwd=join(tmpdir(),"smn-epic2-fresh-fixture");
const args={
 archiveId:"39b6262d-5f27-4bf8-a005-701dfd9cd9a2",
 candidateDb:"smn_restore_test_newpc_abcdef12",
 stagedRoot:join(tmpdir(),"smn_restore_test_files_abcdef12"),
 receiptPath:join(tmpdir(),"migration-current-state.json"),
 operatorJournalDir:join(cwd,"data","migration-audit")
};
test("fresh activation scope permits only a disposable candidate and dedicated audit",()=>{
 assert.equal(validateFreshInstallPaths(cwd,args),true);
 assert.equal(validateFreshInstallPaths(cwd,{...args,candidateDb:"smn"}),false);
 assert.equal(validateFreshInstallPaths(cwd,{...args,stagedRoot:cwd}),false);
 assert.equal(validateFreshInstallPaths(cwd,{...args,
  operatorJournalDir:join(cwd,"public","migration-audit")}),false);
});
test("fresh offline activation retains original DB/files and external maintenance fence",()=>{
 const file=readFileSync(new URL("../src/server/backup/fresh-install-cutover.ts",import.meta.url),"utf8");
 assert.match(file,/process\.platform!=="win32"/);
 assert.match(file,/SMN40_FRESH_INSTALL_OFFLINE_CONFIRM/);
 assert.match(file,/inspectOfflineRestoreMaintenance\(\)/);
 assert.match(file,/existingManagedUri\(\)/);
 assert.match(file,/migration-destination-database-not-empty/);
 assert.match(file,/migration-destination-not-empty/);
 assert.match(file,/comparePortableCurrentState\(proof,key/);
 assert.match(file,/ledger\.markers\.some\(/);
 assert.match(file,/fingerprintsByGroups\(operations\.map\(op=>op\.prepared\)\)/);
 assert.match(file,/fingerprintsByGroups\(operations\.map\(op=>op\.active\)\)/);
 assert.match(file,/ALTER DATABASE/);
 assert.match(file,/migration-manual-recovery-required/);
 assert.match(file,/maintenanceMustRemain:true/);
 assert.doesNotMatch(file,/DROP DATABASE|TRUNCATE|DELETE FROM|rm\(|unlink\(/);
});
test("fresh activation command cannot run from browser and never removes the fence",()=>{
 const file=readFileSync(new URL("../scripts/smn-40-fresh-install-activate.ts",import.meta.url),"utf8");
 assert.match(file,/--confirm=PRISTINE_INSTALLATION_OFFLINE_ONLY/);
 assert.match(file,/activateFreshManagedInstallation\(/);
 assert.match(file,/maintenanceMustRemain:true/);
 assert.doesNotMatch(file,/NextRequest|authorizeApi|fetch\(|unlink\(|rm\(/);
});

test("postcutover verification is read-only and never releases maintenance",()=>{
 const code=readFileSync(new URL("../scripts/smn-40-cutover-postcheck.ts",import.meta.url),"utf8");
 assert.match(code,/readFreshCutoverJournal\(/);
 assert.match(code,/inspectOfflineRestoreMaintenance\(/);
 assert.match(code,/migration-postcheck-sessions-active/);
 assert.match(code,/allSessionsMustBeReauthenticated:true/);
 assert.match(code,/maintenanceReleased:false/);
 assert.match(code,/comparePortableCurrentState\(proof,key/);
 assert.match(code,/fingerprintPublicTables\(current\)/);
 assert.match(code,/fingerprintCurrentManagedFiles\(current\)/);
 assert.doesNotMatch(code,/DROP DATABASE|ALTER DATABASE|DELETE FROM|TRUNCATE|unlink\(|rm\(/);
 const pack=readFileSync(new URL("../scripts/windows/package-portable.mjs",import.meta.url),"utf8");
 assert.match(pack,/"smn-40-cutover-postcheck"/);
});

test("replacement of an installed destination requires explicit double approval and rollback",()=>{
 const cutover=readFileSync(new URL("../src/server/backup/fresh-install-cutover.ts",import.meta.url),"utf8");
 const entry=readFileSync(new URL("../scripts/smn-40-fresh-install-activate.ts",import.meta.url),"utf8");
 const prepare=readFileSync(new URL("../scripts/smn-40-managed-candidate-prepare.ts",import.meta.url),"utf8");
 assert.match(cutover,/REPLACE_VERIFIED_INITIALIZED_DESTINATION_WITH_ROLLBACK/);
 assert.match(cutover,/replaceInitializedDestination===true/);
 assert.match(cutover,/migration-initialized-destination-not-independent/);
 assert.match(cutover,/own\.rows\[0\]\.schema_version!==33/);
 assert.match(entry,/--confirm=REPLACE_INITIALIZED_DESTINATION_WITH_ROLLBACK/);
 assert.match(prepare,/PREPARE_REPLACEMENT_WITH_ROLLBACK/);
 assert.match(prepare,/--replace-initialized-with-rollback/);
 assert.match(prepare,/migration-initialized-destination-not-independent/);
 for(const file of [cutover,entry,prepare])
  assert.doesNotMatch(file,/DROP DATABASE|TRUNCATE|DELETE FROM public/);
});

test("postverified rollback preserves original, candidate and maintenance",()=>{
 const rollback=readFileSync(new URL("../src/server/backup/fresh-cutover-rollback.ts",import.meta.url),"utf8");
 const entry=readFileSync(new URL("../scripts/smn-40-cutover-rollback.ts",import.meta.url),"utf8");
 assert.match(rollback,/inspectOfflineCutoverJournal\(/);
 assert.match(rollback,/readFreshCutoverJournal\(/);
 assert.match(rollback,/rollback-started/);
 assert.match(rollback,/rolled-back/);
 assert.match(rollback,/maintenanceMustRemain:true/);
 assert.match(rollback,/allSessionsMustBeReauthenticated:true/);
 assert.match(rollback,/migration-rollback-manual-recovery-required/);
 assert.match(entry,/--confirm=ROLLBACK_VERIFIED_NEWPC_CUTOVER/);
 assert.doesNotMatch(rollback,/DROP DATABASE|TRUNCATE|DELETE FROM|unlink\(|rm\(/);
});

test("release is explicitly offline, fails closed, and archives both barriers",()=>{
 const release=readFileSync(new URL("../src/server/backup/fresh-cutover-release.ts",import.meta.url),"utf8");
 const entry=readFileSync(new URL("../scripts/smn-40-cutover-release.ts",import.meta.url),"utf8");
 const maintenance=readFileSync(new URL("../src/server/backup/restore-maintenance.ts",import.meta.url),"utf8");
 assert.match(release,/inspectOfflineCutoverJournal\(/);
 assert.match(release,/INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED/);
 assert.match(release,/canBindLoopback\(3003\)/);
 assert.match(release,/await rename\(external,externalParked\)/);
 assert.match(release,/await rename\(local,localParked\)/);
 assert.match(release,/allSessionsMustBeReauthenticated:true/);
 assert.match(entry,/--confirm=INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED/);
 assert.match(maintenance,/localRestoreMaintenanceLockPath/);
 assert.doesNotMatch(release,/unlink\(|rm\(|DROP DATABASE/);
});

test("standalone maintenance operator creates persistent fence without claiming shutdown",()=>{
 const operator=readFileSync(new URL("../scripts/smn-40-offline-maintenance.ts",import.meta.url),"utf8");
 const launcher=readFileSync(new URL("../scripts/windows/restore-launch-gate.mjs",import.meta.url),"utf8");
 assert.match(operator,/beginOfflineRestoreMaintenance\(/);
 assert.match(operator,/FENCE_NEWPC_MIGRATION/);
 assert.match(operator,/serverStoppedProven:false/);
 assert.match(operator,/sourceFrozenProven:false/);
 assert.match(launcher,/restore-maintenance.lock/);
 assert.doesNotMatch(operator,/unlink\(|rm\(|DELETE FROM|ALTER DATABASE/);
});
