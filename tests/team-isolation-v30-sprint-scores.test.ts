import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("scores Scrum v30 : droits, équipe et verrou de Sprint",()=>{
 const service=read("src/server/sprints/sprint-scores.ts");
 assert.match(service,/resolveAdminTeam\(db,access\.actor,access\.teamId\)/);
 assert.match(service,/s\.team_id=\$2/);
 assert.match(service,/t\.is_archived=false/);
 assert.match(service,/FOR UPDATE OF s/);
 assert.match(service,/i\.schema_version<=27/);
});
test("API scores : activation et teamId obligatoires en v30",()=>{
 const route=read("src/app/api/admin/sprints/scores/route.ts");
 assert.match(route,/resolveRegistryReadContext\(db,/);
 assert.match(route,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(route,/teamId/);
});
