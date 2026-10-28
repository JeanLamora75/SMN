import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const server=readFileSync(new URL("../src/server/reports/link-selection.ts",import.meta.url),"utf8");
const route=readFileSync(new URL("../src/app/api/admin/reports/sprints/[id]/links/selection/route.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/report/report-link-selection.tsx",import.meta.url),"utf8");
test("report scope uses report team, not header selection",()=>{
 assert.match(route,/assertTeamReportCycle/);
 assert.match(route,/SELECT team_id FROM public\.smn_sprint/);
});
test("selection is ordered, bounded, distinct and optimistic",()=>{
 assert.match(server,/ids\.length>100/);
 assert.match(server,/new Set\(ids\)\.size!==ids\.length/);
 assert.match(server,/allowed\.has\(id\)/);
 assert.match(server,/if\(\(old\.rows\[0\]\?\.revision\?\?0\)!==revision\)/);
 assert.match(server,/JSON\.stringify\(ids\)/);
});
test("report selector reads back persisted order and saves explicitly",()=>{
 assert.match(ui,/fetch\(root\+"\/selection"/);
 assert.match(ui,/setSelected\(ids\)/);
 assert.match(ui,/method:"PATCH"/);
});

test("SMN-314 report selector searches and displays link comments",()=>{
 assert.match(ui,/item\.description\?\?""/);
 assert.match(ui,/whiteSpace:"pre-wrap"/);
});
test("SMN-314 link editor retains the existing description field",()=>{
 const editor=readFileSync(new URL("../src/app/app/admin/links/link-editor.tsx",import.meta.url),"utf8");
 const cockpit=readFileSync(new URL("../src/app/app/admin/links/links-cockpit.tsx",import.meta.url),"utf8");
 assert.match(editor,/setDescription/);
 assert.match(editor,/links\.descriptionField/);
 assert.match(cockpit,/item\.description/);
});
