import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync("src/server/reports/report-projection.ts","utf8");
test("SMN-351: open Scrum reports use selected v33 indicator values without legacy fallback",()=>{
 assert.match(source,/if\(v33&&input.status!=="closed"\)/);
 assert.match(source,/public\.smn_indicator_manual_value/);
 assert.match(source,/public\.smn_indicator_computed_result/);
 assert.doesNotMatch(source,/committed=byTag\.get\("F01"\)/);
 assert.doesNotMatch(source,/completed=byTag\.get\("F06"\)/);
 assert.match(source,/if\(!v33&&schema\?\.points\)/);
});
test("SMN-351: closed reports always use frozen snapshot",()=>{
 assert.match(source,/if\(input.status==="closed"\)/);
 assert.match(source,/FROM public\.smn_sprint_closure_snapshot/);
 assert.match(source,/snap\.storyPoints/);
});
