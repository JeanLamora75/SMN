import assert from "node:assert/strict";
import test from "node:test";
import {cycleNavigation,type DashboardCycle} from "../src/server/dashboard-builder/cycles";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {readFileSync} from "node:fs";
const cycles:DashboardCycle[]=[
 {id:"one",name:"Sprint 1",status:"closed",startAt:"2026-01-01",endAt:"2026-01-14"},
 {id:"two",name:"Sprint 2",status:"active",startAt:"2026-01-15",endAt:"2026-01-28"},
 {id:"three",name:"Sprint 3",status:"planned",startAt:"2026-01-29",endAt:"2026-02-11"},
];
test("SMN-362 AC1/AC3: independent cycle facts with exact bounded arrows",()=>{
 assert.deepEqual(cycleNavigation(cycles,"one"),{current:cycles[0],previous:null,next:"two"});
 assert.deepEqual(cycleNavigation(cycles,"two"),{current:cycles[1],previous:"one",next:"three"});
 assert.deepEqual(cycleNavigation(cycles,"three"),{current:cycles[2],previous:"two",next:null});
 assert.equal(cycleNavigation([],null).current,null);
 assert.throws(()=>cycleNavigation(cycles,"foreign"),/out-of-team/);
});
test("SMN-362 AC2: exactly two non-removable structural header blocks",()=>{
 for(const mode of ["scrum","kanban"] as const){
  const layout=createDefaultDashboardLayout(mode);
  assert.equal(layout.header.blocks.length,2);
  validateDashboardLayout(layout);
  layout.header.blocks.pop();
  assert.throws(()=>validateDashboardLayout(layout),/schema/);
 }
});
test("SMN-362 AC3/AC4: navigation is unavailable in customization, cycle facts independent of slots",()=>{
 const file=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(file,/navigation\.previous&&!personalizing/);
 assert.match(file,/navigation\.next&&!personalizing/);
 assert.match(file,/navigation\.current\.status/);
 assert.match(file,/cycleIdOverride/);
});
test("SMN-362 AC1: all cycle reads tenant scoped and read only",()=>{
 const file=readFileSync(new URL("../src/server/dashboard-builder/cycles.ts",import.meta.url),"utf8");
 assert.match(file,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(file,/t\.installation_id=\$2/);
 assert.doesNotMatch(file,/\b(INSERT|UPDATE|DELETE)\b/i);
});
