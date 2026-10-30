import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("dashboard Sprint header includes team without redundant product/eyebrow",()=>{
 const s=read("src/app/app/cycle-overview.tsx");
 assert.match(s,/<h1 id="smn-cycle-overview-heading">\{cycle\?cycle\.name:/);
 assert.match(s,/smn-cycle-eyebrow/);
 assert.doesNotMatch(s,/<strong>\{context\.product\}/);
});
test("dashboard renders up to three goals without additional-goal link",()=>{
 const s=read("src/app/app/cycle-overview.tsx");
 assert.match(s,/goals\.items\.slice\(0,3\)/);
 assert.doesNotMatch(s,/dashboard\.cockpit\.otherGoals/);
});
test("operational cards open authorized modal forms without redundant calendar footer",()=>{
 const overview=read("src/app/app/operational-overview.tsx");
 const quick=read("src/app/app/operational-quick-add.tsx");
 assert.match(overview,/OperationalQuickAdd/);
 assert.doesNotMatch(overview,/smn-operational-calendar-link|createHref=/);
 assert.match(quick,/showModal\(\)/);
 assert.match(quick,/RegistryCreate/);
 assert.match(read("src/app/app/admin/registries/registry-create.tsx"),/\/api\/admin\/registries/);
});
