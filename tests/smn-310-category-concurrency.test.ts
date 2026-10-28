import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const service=readFileSync(new URL("../src/server/links/categories-admin.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/app/app/admin/settings/links/category-admin.tsx",import.meta.url),"utf8");
test("category deletion locks record before counting links",()=>{
 const lock=service.indexOf("WHERE id=$1 AND installation_id=$2 FOR UPDATE");
 const count=service.indexOf("SELECT count(*)::text AS link_count");
 assert.ok(lock>=0&&count>lock);
});
test("frontend catches duplicate category names but backend remains authority",()=>{
 assert.match(ui,/c\.name\.trim\(\)\.toLocaleLowerCase\(\)===name\.trim\(\)\.toLocaleLowerCase\(\)/);
 assert.match(service,/INSERT INTO public\.smn_link_category/);
});
test("new deletion dialog clears stale target and errors",()=>{
 assert.match(ui,/setTarget\(""\);setError\(""\);setDeleting\(c\)/);
});
