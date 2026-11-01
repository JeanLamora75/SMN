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

test("SMN-351: v33 closure snapshots capture selected indicator values without legacy reads",()=>{
 const closure=readFileSync("src/server/sprints/closure.ts","utf8");
 const adapter=readFileSync("src/server/indicators/closure-snapshot.ts","utf8");
 assert.match(closure,/captureCycleIndicators\(db,context\.team_id,sprintId\)/);
 assert.match(closure,/v33\?Promise\.resolve/);
 assert.match(closure,/indicatorsV33,storyPoints/);
 assert.match(adapter,/smn_indicator_manual_value/);
 assert.match(adapter,/smn_indicator_computed_result/);
 assert.match(adapter,/smn_indicator_team_selection/);
});
test("SMN-351: closed standard report renders only frozen v33 snapshot values",()=>{
 const reports=readFileSync("src/server/reports/standard-composition.ts","utf8");
 assert.match(reports,/snapshot\.indicatorsV33/);
 assert.match(reports,/d\.state==="available"/);
 assert.doesNotMatch(reports,/UPDATE public\.smn_sprint_closure_snapshot/);
});
