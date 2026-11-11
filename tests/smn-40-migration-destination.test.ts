import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {inspectImportedMigration} from "../scripts/smn-40-migration-destination-check";

test("migration destination preflight rejects malformed archive identity",async()=>{
 await assert.rejects(inspectImportedMigration("../active"),/migration-archive-id-invalid/);
});
test("destination preflight uses authenticated archive and independent ledger; never activates",()=>{
 const file=readFileSync(new URL("../scripts/smn-40-migration-destination-check.ts",import.meta.url),"utf8");
 assert.match(file,/inspectBackup\(root,archiveId,key\)/);
 assert.match(file,/readErasureLedger\(\)/);
 assert.match(file,/hasUnresolvedErasureIntent\(\)/);
 assert.match(file,/assessMigrationSource\(item,ledger\)/);
 assert.match(file,/candidateReconstructionAllowed:result\.exportCandidate/);
 assert.match(file,/historicalCoverageCertified:false/);
 assert.match(file,/restorationAuthorized:false/);
 assert.doesNotMatch(file,/ALTER DATABASE|CREATE DATABASE|DROP DATABASE|pg_restore|rename\(|rm\(|writeFile\(|appendFile\(/);
});
