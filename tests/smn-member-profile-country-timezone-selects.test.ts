import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const view=readFileSync("src/app/app/admin/members/[id]/member-identity-editor.tsx","utf8");
test("profile selects countries from the configured country catalogue",()=>{
 assert.match(view,/fetch\("\/api\/admin\/countries"/);
 assert.match(view,/data\.countries/);
 assert.match(view,/<select className="form-select" value=\{country\}/);
 assert.match(view,/countries\.map\(c=><option key=\{c\.code\} value=\{c\.code\}>\{c\.name\}<\/option>/);
});
test("profile offers IANA time zones and preserves existing values",()=>{
 assert.match(view,/Intl\.supportedValuesOf\("timeZone"\)/);
 assert.match(view,/<select className="form-select" value=\{zone\}/);
 assert.match(view,/timeZones\.map/);
 assert.match(view,/zone&&!timeZones\.includes\(zone\)/);
});
