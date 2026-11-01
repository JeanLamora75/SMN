import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("SMN-351: current standard reports use v33 team-selected indicators",()=>{
 const source=readFileSync("src/server/reports/standard-composition.ts","utf8");
 assert.match(source,/readIndicatorReporting\(db,sprint\.teamId,"reports","scrum",\[sprintId\]\)/);
 assert.match(source,/!v33&&s\?\.points/);
 assert.match(source,/!v33&&s\?\.tickets/);
 assert.match(source,/dynamicIndicators\.columns/);
});
test("SMN-351: closed standard reports continue reading immutable closure snapshots",()=>{
 const source=readFileSync("src/server/reports/standard-composition.ts","utf8");
 assert.match(source,/if\(sprint\.status==="closed"\)/);
 assert.match(source,/FROM public\.smn_sprint_closure_snapshot/);
 assert.match(source,/snapshot\.storyPoints/);
 assert.match(source,/snapshot\.ticketCounts/);
 assert.doesNotMatch(source,/UPDATE public\.smn_sprint_closure_snapshot/);
});
