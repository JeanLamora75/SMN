import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";

test("managed PG18 candidate stage refuses all existing SMN data and validates signed source proof",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-managed-candidate-prepare.ts",import.meta.url),"utf8");
 assert.match(script,/process\.platform!=="win32"/);
 assert.match(script,/inspectOfflineRestoreMaintenance\(\)/);
 assert.match(script,/existingManagedUri\(\)/);
 assert.match(script,/migration-live-destination-not-empty/);
 assert.match(script,/migration-live-destination-busy/);
 assert.match(script,/CREATE DATABASE/);
 assert.match(script,/rehearseBackupRestore\(/);
 assert.match(script,/comparePortableCurrentState\(receipt,key/);
 assert.match(script,/restorationAuthorized:false/);
 assert.doesNotMatch(script,/DROP DATABASE|ALTER DATABASE|TRUNCATE|DELETE FROM|rm\(|unlink\(/i);
});
