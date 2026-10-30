import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const closure=read("src/server/sprints/closure.ts");
const presence=read("src/server/sprints/presence-detail-read.ts");
test("Closure captures the available team presence even for a historical sprint",()=>{
 assert.match(closure,/const memberPresence=await readSprintMemberPresence\(db,context.team_id/);
 assert.doesNotMatch(closure,/historical\?null:await readSprintMemberPresence/);
 assert.match(closure,/memberPresence:memberPresence\?\?/);
 assert.match(closure,/memberPresenceProvenance:historical\?"retrospective-calendar-estimate"/);
});
test("Closed sprint reads only immutable closure snapshot, not current calendars",()=>{
 assert.match(presence,/scope.rows\[0\]\.status==="closed"/);
 assert.match(presence,/presenceFromSnapshot\(value,latest.version\)/);
});
