import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("l'écriture compte rendu est contextualisée et verrouillée",()=>{
 const route=readFileSync("src/app/api/admin/team-calendar/ceremonies/outcome-create/route.ts","utf8");
 const service=readFileSync("src/server/teams/ceremony-outcomes-create.ts","utf8");
 const ui=readFileSync("src/app/app/team-calendar/scoped-ceremony-detail.tsx","utf8");
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(service,/resolveAdminTeam/);
 assert.match(service,/team\.team_id/);
 assert.match(service,/FOR UPDATE/);
 assert.doesNotMatch(service,/CREATE TABLE|ALTER TABLE/);
 assert.match(ui,/ceremonies\/outcome-create/);
 assert.match(ui,/teamId,ceremonyId:detail\.id/);
});
