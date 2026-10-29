import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("Les lectures contextualisées fonctionnent en v28-v32 et les écritures historiques sont bloquées",()=>{
 const report=readFileSync(new URL("../src/server/reports/center.ts",import.meta.url),"utf8");
 const api=readFileSync(new URL("../src/app/api/admin/development-capacity/route.ts",import.meta.url),"utf8");
 const opening=readFileSync(new URL("../src/server/capacity/opening.ts",import.meta.url),"utf8");
 assert.match(report,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(report,/WHERE d\.team_id=\$1/);
 assert.match(api,/if\(\[28,29,30,31,32\]\.includes\(schema\?\?0\)\)/);
 assert.match(api,/resolveAdminTeam\(db,/);
 assert.match(api,/if\(\(version\.rows\[0\]\?\.schema_version\?\?0\)>=28\)/);
 assert.match(opening,/i\.schema_version<=27/);
});
