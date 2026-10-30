import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const editor=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx");
const route=read("src/app/api/admin/sprints/[id]/route.ts");
const service=read("src/server/sprints/rename.ts");
test("rename forwards the active team through the UI and API",()=>{
 assert.match(page,/const commonProps=\{\s*teamId,sprintId:cycle.id/);
 assert.match(editor,/new URLSearchParams\(\{teamId:props.teamId\}\)/);
 assert.match(route,/resolveRegistryReadContext/);
 assert.match(route,/context.team\?\.team_id!==teamId/);
});
test("rename is scoped to Scrum team under schema v32, preserving legacy reads",()=>{
 assert.match(service,/i.schema_version BETWEEN 28 AND 32/);
 assert.match(service,/s.team_id=\$2/);
 assert.match(service,/lower\(t.agile_mode\)='scrum'/);
 assert.match(service,/t.is_archived=false/);
 assert.match(service,/i.schema_version<=27/);
 assert.match(service,/resolveAdminTeam/);
});
