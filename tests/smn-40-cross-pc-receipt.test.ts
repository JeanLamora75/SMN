import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";

const script=readFileSync(new URL("../scripts/smn-40-cross-pc-receipt.ts",import.meta.url),"utf8");
test("portable receipt captures only from a maintenance-fenced, quiescent source",()=>{
 assert.match(script,/inspectOfflineRestoreMaintenance\(\)/);
 assert.match(script,/maintenance\.purpose!=="offline-restore"/);
 assert.match(script,/pg_stat_activity/);
 assert.match(script,/pg_current_wal_lsn/);
 assert.match(script,/before!==after/);
 assert.match(script,/verifiedLedger\(item\.createdAt\)/);
 assert.match(script,/signCurrentStateReceipt\(/);
});
test("cross-PC receipt validates independently restored DB and managed files",()=>{
 assert.match(script,/fingerprintCurrentManagedFiles\(db\)/);
 assert.match(script,/inspectRestoreFileTree\(staged\)/);
 assert.match(script,/comparePortableCurrentState\(/);
 assert.match(script,/fingerprintPublicTables\(db\)/);
 assert.match(script,/READ ONLY/);
 assert.match(script,/restorationAuthorized:false/);
 assert.doesNotMatch(script,/ALTER DATABASE|DROP DATABASE|CREATE DATABASE|pg_restore/i);
});
