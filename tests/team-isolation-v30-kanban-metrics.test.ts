import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("métriques Kanban v30 : scope SQL et vérification acteur-équipe",()=>{
 const source=read("src/server/kanban/metrics-block.ts");
 assert.match(source,/resolveAdminTeam\(db,access\.actor,access\.teamId\)/);
 assert.match(source,/p\.team_id=\$2/);
 assert.match(source,/i\.schema_version IN \(28,29,30\)/);
 assert.match(source,/i\.schema_version<=27/);
});
test("API métriques Kanban v30 : double verrou et teamId explicite",()=>{
 const source=read("src/app/api/admin/kanban-periods/[id]/metrics/route.ts");
 assert.match(source,/resolveRegistryReadContext\(db,/);
 assert.match(source,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(source,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(source,/teamId/);
});
