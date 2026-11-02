import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout} from "../src/server/dashboard-builder/layout";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("dashboard v33 defaults to two configurable header blocks, not old fixed Fxx cards",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 assert.equal(layout.header.blocks.length,2);
 assert.ok(layout.rows.every(row=>Array.isArray(row.blocks)));
});
test("dashboard v33 never invents fixed metric sources in its empty layout",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 for(const block of [...layout.header.blocks,...layout.rows.flatMap(row=>row.blocks)]){
  for(const slot of block.slots)assert.ok(!slot.source || !/^indicator:F\\d{2}$/.test(slot.source));
 }
});
test("dashboard v33 isolates cycles through team-scoped permission and source adapters",()=>{
 const permissions=read("src/server/dashboard-builder/permissions.ts");
 const sources=read("src/server/dashboard-builder/batch.ts");
 assert.match(permissions,/t\.installation_id=i\.id AND t\.id=\$3/);
 assert.match(sources,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(sources,/scope\.teamId/);
});
test("dashboard v33 displays selected cycle rather than hardcoded dates or zeros",()=>{
 const component=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(component,/navigation\.current\?\.name/);
 assert.match(component,/navigation\.current\.startAt/);
 assert.match(component,/navigation\.current\.endAt/);
 assert.doesNotMatch(component,/deriveSprintIndicators\(/);
});
