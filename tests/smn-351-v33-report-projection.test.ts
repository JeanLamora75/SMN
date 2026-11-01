import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync("src/server/reports/report-projection.ts","utf8");
test("v33 legacy report does not fabricate mappings from configurable indicators",()=>{
 assert.match(source,/schema_version===33/);
 assert.match(source,/if\(!v33&&schema\?\.points\)/);
 assert.doesNotMatch(source,/byTag\.get\("F0[1-9]"\)/);
});
test("closed reports read the original immutable closure snapshot",()=>{
 assert.match(source,/if\(input.status==="closed"\)/);
 assert.match(source,/FROM public\.smn_sprint_closure_snapshot/);
 assert.match(source,/snap\.storyPoints/);
});
