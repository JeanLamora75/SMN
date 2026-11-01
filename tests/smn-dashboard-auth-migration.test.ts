import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const auth=readFileSync(new URL("../src/server/accounts/migration.ts",import.meta.url),"utf8");
const diag=readFileSync(new URL("../src/server/installation/diagnostic.ts",import.meta.url),"utf8");

test("auth recognises v33 plus one checksummed dashboard slots migration",()=>{
 assert.match(auth,/20261101_smn_dashboard_slots_additive/);
 assert.match(auth,/slots\[0\]\.checksum===checksum\(slotsSql\)/);
 assert.match(auth,/const expectedHistory=version\+\(additiveValid\?1:0\)/);
 assert.match(auth,/migrations\.rowCount !== expectedHistory/);
});
test("diagnostic recognises additive migration without upgrading version 33",()=>{
 assert.match(diag,/20261101_smn_dashboard_slots_additive/);
 assert.match(diag,/slotMigration\.checksum/);
});
