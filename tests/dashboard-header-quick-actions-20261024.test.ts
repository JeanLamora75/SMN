import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("dashboard Sprint header includes team without redundant product/eyebrow",()=>{
 const s=read("src/app/app/cycle-overview.tsx");
 assert.match(s,/cycle\.name\+" - "\+context\.team/);
 assert.doesNotMatch(s,/smn-cycle-eyebrow/);
 assert.doesNotMatch(s,/<strong>\{context\.product\}/);
});
test("dashboard renders up to three goals without additional-goal link",()=>{
 const s=read("src/app/app/cycle-overview.tsx");
 assert.match(s,/goals\.items\.slice\(0,3\)/);
 assert.doesNotMatch(s,/dashboard\.cockpit\.otherGoals/);
});
test("operational cards provide real creation navigation and no redundant calendar footer",()=>{
 const s=read("src/app/app/operational-overview.tsx");
 assert.match(s,/\/app\/admin\/registries\/create\?/);
 assert.match(s,/\/report#smn-report-notes/);
 assert.doesNotMatch(s,/smn-operational-calendar-link/);
 assert.match(read("src/app/app/admin/sprints/[sprintId]/report/report-draft-notes.tsx"),/id="smn-report-notes"/);
});
