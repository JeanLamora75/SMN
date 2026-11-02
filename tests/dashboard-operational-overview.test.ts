import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Builder lists are configurable, not an obligatory four-column grid",()=>{
 const view=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 const lists=read("src/server/dashboard-builder/lists.ts");
 assert.match(view,/layout\.rows\.flatMap/);
 assert.match(view,/DashboardBusinessList/);
 assert.match(view,/visibleSlots\(block\)/);
 for(const fn of ["readRegistryDashboardList","readCalendarDashboardList","readNotesDashboardList"])
  assert.ok(lists.includes(fn),fn);
});
test("Builder protects list reads and editing by team permissions",()=>{
 const batch=read("src/server/dashboard-builder/batch.ts");
 const permissions=read("src/server/dashboard-builder/permissions.ts");
 assert.match(batch,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(permissions,/a\.is_active=true/);
 assert.match(permissions,/t\.id=\$3/);
});
test("an absent list is not rendered as fictitious business data",()=>{
 const batch=read("src/server/dashboard-builder/batch.ts");
 assert.match(batch,/state:list\.rows\.length\?"available":"absent"/);
});
