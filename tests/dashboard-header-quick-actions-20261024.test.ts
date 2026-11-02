import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");

test("Dashboard Builder header uses selected cycle and optional actions, not historical fixed eyebrow",()=>{
 const s=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(s,/navigation\.current\?\.name/);
 assert.match(s,/navigation\.current\.startAt/);
 assert.match(s,/navigation\.current\.endAt/);
 assert.match(s,/headerActions/);
 assert.match(s,/navigation\.previous/);
 assert.match(s,/navigation\.next/);
});
test("Dashboard Builder resolves configurable sections without hardcoded goals",()=>{
 const s=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(s,/layout\.header\.blocks/);
 assert.match(s,/layout\.rows\.flatMap/);
 assert.match(s,/visibleSlots\(block\)/);
});
test("dashboard registry quick addition remains conditional on rights and active Scrum cycle",()=>{
 const s=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(s,/canManage&&mode==="scrum"&&cycleId&&!personalizing/);
 assert.match(s,/navigation\.current\?\.status!=="closed"/);
 assert.match(s,/OperationalQuickAdd/);
 const quick=read("src/app/app/operational-quick-add.tsx");
 assert.match(quick,/showModal\(\)/);
 assert.match(read("src/app/app/admin/registries/registry-create.tsx"),/\/api\/admin\/registries/);
});
