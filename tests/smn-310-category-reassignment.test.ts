import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const service=readFileSync(new URL("../src/server/links/categories-admin.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/app/app/admin/settings/links/category-admin.tsx",import.meta.url),"utf8");
test("category reassignment validates distinct source and destination in tenant",()=>{
 assert.match(service,/sourceId===targetId/);
 assert.match(service,/WHERE installation_id=\$1 AND id IN \(\$2,\$3\) FOR UPDATE/);
 assert.match(service,/if\(cats\.rowCount!==2\)/);
});
test("all reassigned links are versioned and audited atomically",()=>{
 assert.match(service,/category_id=\$3,updated_at=now\(\),updated_by=\$4,revision=revision\+1/);
 assert.match(service,/INSERT INTO public\.smn_link_audit/);
 assert.match(service,/await db\.query\("COMMIT"\)/);
 assert.match(service,/await db\.query\("ROLLBACK"\)/);
});
test("UI requires chosen destination while category remains protected",()=>{
 assert.match(ui,/items\.filter\(c=>c\.id!==deleting\.id\)/);
 assert.match(ui,/disabled=\{busy\|\|!target\}/);
 assert.match(ui,/disabled=\{busy\|\|deleting\.linkCount>0\}/);
});
