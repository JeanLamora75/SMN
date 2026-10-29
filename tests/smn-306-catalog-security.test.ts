import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("../src/server/links/catalog.ts",import.meta.url),"utf8");
const validation=readFileSync(new URL("../src/server/links/validation.ts",import.meta.url),"utf8");

test("service imports shared identifier validation",()=>{
 assert.match(source,/import \{LinkError,type LinkWrite,validId\} from "\.\/validation"/);
 assert.match(validation,/export const validId=/);
});
test("links require a migrated schema v29 through v32 before accessing their tables",()=>{
 assert.match(source,/i\.schema_version BETWEEN 29 AND 32/);
 assert.doesNotMatch(source,/i\.schema_version=28/);
});
test("list and detail remain scoped to requested team plus transverse",()=>{
 assert.match(source,/l\.installation_id=\$1 AND \(l\.scope='TRANSVERSE' OR l\.team_id=\$2\)/);
 assert.match(source,/l\.installation_id=\$2 AND \(l\.scope='TRANSVERSE' OR l\.team_id=\$3\)/);
});
test("user role remains denied until team permissions are implemented",()=>{
 assert.match(source,/actor\.role!=="admin"/);
});
