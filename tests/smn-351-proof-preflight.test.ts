import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {retiredCandidates} from "../scripts/smn-351-candidate-inventory";
import {sourceFingerprint} from "../scripts/smn-351-proof-record";
const read=(name:string)=>readFileSync(name,"utf8");
test("SMN-351: candidate inventory covers exactly four retired tables",()=>{
 assert.deepEqual([...retiredCandidates],[
  "smn_sprint_story_points","smn_sprint_ticket_counts",
  "smn_sprint_story_points_audit","smn_sprint_ticket_counts_audit"
 ]);
 const source=read("scripts/smn-351-candidate-inventory.ts");
 assert.match(source,/sha256/);
 assert.match(source,/SELECT row_to_json/);
 assert.doesNotMatch(source,/DROP TABLE|TRUNCATE TABLE/);
});
test("SMN-351: recorded proofs do not authorize production cleanup",()=>{
 const preflight=read("scripts/smn-351-cleanup-preflight.ts");
 const recorder=read("scripts/smn-351-proof-record.ts");
 assert.match(preflight,/BEGIN READ ONLY/);
 assert.match(preflight,/destructive-cutover-not-authorized/);
 assert.match(preflight,/candidate-data-present-requires-reviewed-backup/);
 assert.match(preflight,/inventoryRetiredCandidates/);
 assert.match(recorder,/backupRestored===true/);
 assert.match(recorder,/24\*3600000/);
 assert.match(recorder,/cleanupAuthorized:false/);
 assert.throws(()=>sourceFingerprint("postgresql://u:p@example.com/smn"));
 assert.throws(()=>sourceFingerprint("postgresql://u:p@localhost/production"));
});
test("SMN-351: backup proof uses only isolated databases and checks restored data",()=>{
 const source=read("tests/smn-351-backup-restore-pg.test.ts");
 assert.match(source,/smn_351_backup_/);
 assert.match(source,/smn_351_restore_/);
 assert.match(source,/pg_dump/);
 assert.match(source,/pg_restore/);
 assert.match(source,/assert\.deepEqual\(after,before\)/);
 assert.doesNotMatch(source,/DROP TABLE|TRUNCATE TABLE/);
});
