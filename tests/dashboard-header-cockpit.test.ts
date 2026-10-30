import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const component=read("src/app/app/cycle-overview.tsx");
const css=read("src/app/dashboard.css");

test("SMN-235 : bandeau plein Cockpit avec équipe, sprint et informations réelles",()=>{
 assert.match(component,/smn-cycle-overview-header smn-cycle-header-compact/);
 assert.match(component,/memberTeamScope\.teamLabel/);
 assert.match(component,/\{context\.team\}/);
 assert.match(component,/\{cycle\?cycle\.name:/);
 assert.match(component,/smn-cycle-date-range/);
 assert.match(component,/smn-cycle-status/);
 assert.match(component,/smn-cycle-goal-block/);
 assert.match(component,/goals\.items\.slice/);
 assert.match(component,/sprintDetailPath\(cycle\.id\)/);
});
test("SMN-235 : palette Cockpit, lien bordé blanc et responsive",()=>{
 assert.match(css,/smn-cycle-overview-header\.smn-cycle-header-compact/);
 assert.match(css,/linear-gradient\(125deg/);
 assert.match(css,/color:#fff/);
 assert.match(css,/\.smn-cycle-header-compact \.smn-cycle-detail-link:focus-visible/);
 assert.match(css,/@container \(max-width:960px\)/);
 assert.match(css,/@container \(max-width:650px\)/);
 assert.doesNotMatch(component,/className="btn btn-outline-primary btn-sm smn-cycle-detail-link"/);
});
