import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("SMN-351: sprint list does not query or render legacy Fxx indicators",()=>{
 const source=read("src/server/sprints/index.ts");
 const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 assert.doesNotMatch(source,/readSprintDetailIndicators|item\.metrics=|SprintIndexMetrics/);
 assert.doesNotMatch(ui,/indicatorCodes|item\.metrics|smn-sprints-gauge-cell/);
 assert.match(ui,/IndicatorReporting teamId=\{data\.teamId\} cycleType="scrum" screen="cycle_list"/);
});
test("SMN-351: business navigation and status presentation stay available",()=>{
 const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 const css=read("src/app/app/admin/sprints/sprints-cockpit.css");
 assert.match(ui,/sprintDetailPath\(item\.id\)/);
 assert.match(ui,/smn-sprints-state-complete/);
 assert.match(css,/--bs-success-bg-subtle/);
});
