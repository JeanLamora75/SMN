import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const route=read("src/app/api/admin/members/[id]/assignment/start-date/route.ts");
const service=read("src/server/members/assignment-start-correction.ts");
const reader=read("src/app/api/admin/members/[id]/team-assignment/route.ts");
const form=read("src/app/app/admin/members/assignment-editor.tsx");
test("v32 correction start date resolves actual team and preserves legacy guard",()=>{
 assert.match(route,/await withAuthDb\(db=>correctAssignmentStart/);
 assert.match(route,/await withLegacyMemberApi/);
 assert.match(service,/resolveAdminTeam\(db,teamScope.actor,teamScope.teamId\)/);
 assert.match(service,/a.team_id!==selected.team_id/);
});
test("member revision supplied by server rather than hardcoded parent prop",()=>{
 assert.match(reader,/memberRevision:member.revision/);
 assert.match(form,/state.memberRevision\?\?memberRevision/);
 assert.match(form,/teamScoped\?\{teamId\}:\{\}/);
});
test("start correction retains transaction, audit and server diagnostics",()=>{
 for(const token of ['await db.query("BEGIN")','await db.query("COMMIT")','await db.query("ROLLBACK")','smn_member_assignment_start_audit'])
  assert.ok(service.includes(token),token);
 assert.match(route,/member-assignment-start-correction-failed/);
});
