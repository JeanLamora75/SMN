import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout} from "../src/server/dashboard-builder/layout";
import {visibleSlots,gridColumns} from "../src/lib/dashboard-builder/consultation-layout";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Dashboard Builder displays configured slots only, with stable template geometry",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const block=layout.rows[0].blocks[0];
 assert.deepEqual(visibleSlots(block),[]);
 assert.equal(gridColumns(block),"minmax(0,1fr)");
 block.slots[0].source="indicator:velocity";
 assert.equal(visibleSlots(block).length,0,"Incomplete source/view must remain hidden");
 block.slots[0].view="number";
 assert.deepEqual(visibleSlots(block),[block.slots[0]]);
 assert.equal(gridColumns(block),"1fr");
 const view=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(view,/className=\{styles\.blockPanel\}/);
 assert.match(view,/className=\{styles\.cockpitHeader\}/);
 assert.match(view,/styles\.slotCard/);
});
test("Dashboard Builder does not bypass team-scoped server authorization",()=>{
 const batch=read("src/server/dashboard-builder/batch.ts");
 const permission=read("src/server/dashboard-builder/permissions.ts");
 assert.match(batch,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(permission,/t\.id=\$3/);
 assert.match(permission,/a\.is_active=true/);
});
