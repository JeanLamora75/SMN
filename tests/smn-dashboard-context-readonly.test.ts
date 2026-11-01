import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/app/app/page.tsx",import.meta.url),"utf8");
const layout=readFileSync(new URL("../src/app/app/layout.tsx",import.meta.url),"utf8");
test("dashboard and private layout resolve team context without executing auth migrations",()=>{
 assert.match(page,/withSessionReadDb\(db=>readAccountDashboard/);
 assert.match(layout,/withSessionReadDb\(db=>readAccountDashboard/);
 assert.match(page,/smn-dashboard-context-unavailable/);
});
