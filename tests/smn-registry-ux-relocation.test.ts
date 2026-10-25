import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("registry screen keeps collective attention first and six-register consultation second",()=>{
 const page=read("src/app/app/admin/registries/page.tsx");
 assert.ok(page.indexOf("<AttentionCockpit/>")>=0);
 assert.ok(page.indexOf("<RegistryList")>page.indexOf("<AttentionCockpit/>"));
 for(const name of ["FactSelection","ConfirmedHighlights","AutomaticHighlightsSettings","RegistryDeadlineAlerts"])assert.ok(!page.includes("<"+name));
});
test("configuration components move to the settings portal",()=>{
 const settings=read("src/app/app/admin/settings/registries/page.tsx");
 const catalog=read("src/lib/settings-catalog.ts");
 assert.match(settings,/<AutomaticHighlightsSettings/);
 assert.match(settings,/<RegistryDeadlineAlerts/);
 assert.match(catalog,/href:"\/app\/admin\/settings\/registries"/);
});
test("both Scrum and Kanban report preparation expose fact choice and highlights",()=>{
 for(const path of ["src/app/app/admin/sprints/[sprintId]/report/page.tsx","src/app/app/admin/kanban-periods/[id]/report/prepare/page.tsx"]){
  const page=read(path);
  assert.match(page,/<FactSelection/);
  assert.match(page,/<ConfirmedHighlights/);
 }
});
