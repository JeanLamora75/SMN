import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const load=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=load("src/app/app/admin/sprints/[sprintId]/page.tsx");
const component=load("src/app/app/admin/sprints/[sprintId]/sprint-closure-action.tsx");
const route=load("src/app/api/admin/sprints/closure/route.ts");
const service=load("src/server/sprints/closure.ts");
test("Sprint header uses close/reopen cockpit action scoped to selected team",()=>{
 assert.match(page,/SprintClosureAction sprintId=\{cycle.id\} teamId=\{teamId\}/);
 assert.match(component,/smn-cockpit-modal-header/);
 assert.match(component,/type="checkbox"/);
 assert.match(component,/new URLSearchParams\(\{teamId\}\)/);
 assert.match(component,/router.refresh\(\)/);
 assert.match(component,/setOpen\(false\);setConfirmed\(false\)/);
});
test("Closure API verifies team context for multi-team installations",()=>{
 assert.match(route,/resolveRegistryReadContext/);
 assert.match(route,/context.team\?\.team_id!==teamId/);
 assert.match(service,/resolveAdminTeam/);
 assert.match(service,/s.team_id=\$2/);
 assert.match(service,/access\?\.teamId/);
 assert.match(service,/\["close","reopen"\]/);
 assert.match(service,/s.status!=="finished"/);
 assert.match(service,/s.status!=="closed"/);
 assert.match(service,/smn_sprint_closure_snapshot/);
});
