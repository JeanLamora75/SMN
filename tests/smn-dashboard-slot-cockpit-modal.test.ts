import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Dashboard Builder renders customizable slots with a Bootstrap cockpit panel",()=>{
 const view=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(view,/visibleSlots\(block\)/);
 assert.match(view,/className="smn-panel p-3"/);
 assert.match(view,/getDashboardTemplate\(block\.templateId,block\.templateVersion\)/);
});
test("Dashboard Builder does not bypass team-scoped server authorization",()=>{
 const batch=read("src/server/dashboard-builder/batch.ts");
 const permission=read("src/server/dashboard-builder/permissions.ts");
 assert.match(batch,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(permission,/t\.id=\$3/);
 assert.match(permission,/a\.is_active=true/);
});
