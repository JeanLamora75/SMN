import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const ui=readFileSync(new URL("../src/app/app/admin/settings/links/category-admin.tsx",import.meta.url),"utf8");
const service=readFileSync(new URL("../src/server/links/categories-admin.ts",import.meta.url),"utf8");
const validation=readFileSync(new URL("../src/server/links/validation.ts",import.meta.url),"utf8");
test("category listing only accepts item arrays and clears stale errors after reload",()=>{
 assert.match(ui,/Array\.isArray\(data\.items\)/);
 assert.match(ui,/setItems\(data\.items\);setError\(""\)/);
 assert.match(ui,/role="status"/);
});
test("duplicate database keys map to a conflict response",()=>{
 assert.match(validation,/code==="23505"/);
 assert.match(validation,/error:"conflict",status:409/);
});
test("reassignment locks categories and rows before auditing edits",()=>{
 assert.match(service,/ORDER BY id FOR UPDATE/);
 assert.match(service,/if\(after\.rowCount!==1\)throw new LinkError\("conflict"\)/);
});
