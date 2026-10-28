import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const route=readFileSync(new URL("../src/app/api/admin/team-cycles/route.ts",import.meta.url),"utf8");
test("Création Scrum/Kanban préparée, non activée avant les validations d'isolation",()=>{
 assert.match(route,/createScopedSprint\(db,/);
 assert.match(route,/createScopedKanbanPeriod\(db,/);
 assert.match(route,/!MULTI_TEAM_CONTEXT_READY\|\|/);
 assert.match(route,/SMN_MULTI_TEAM_WRITES_ENABLED!=="true"/);
 assert.match(route,/authorizeApi\(request,"write",resource\)/);
 assert.match(route,/readJsonObject\(request,4096\)/);
 assert.match(route,/Object\.keys\(body\)\.some/);
});
