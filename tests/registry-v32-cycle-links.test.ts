import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("cycle link endpoint resolves authorized team rather than legacy v27 gate",()=>{
 const api=src("src/app/api/admin/registries/[id]/cycles/route.ts");
 assert.match(api,/resolveRegistryReadContext/);
 assert.match(api,/context\.team\?\.team_id/);
 assert.doesNotMatch(api,/withLegacyTeamApi|withLegacyRegistryReadDb/);
});
test("client sends teamId and cycle relation stays scoped to same team",()=>{
 const ui=src("src/app/app/admin/registries/registry-cycles.tsx");
 const db=src("src/server/registries/cycle-links.ts");
 assert.match(ui,/\?teamId=/);
 assert.match(ui,/\{teamId\}/);
 assert.match(db,/r\.team_id=\$3/);
 assert.match(db,/s\.team_id=r\.team_id/);
 assert.match(db,/agile_mode/);
 assert.match(db,/'scrum','kanban'/);
 assert.match(db,/s\.status<>'closed'/);
});
