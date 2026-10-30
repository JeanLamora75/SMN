import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
for(const [name,service,route] of [
 ["Story Points","src/server/sprints/story-points.ts","src/app/api/admin/sprints/story-points/route.ts"],
 ["Objectifs","src/server/sprints/goals.ts","src/app/api/admin/sprints/goals/route.ts"]
] as const){
 test(name+": la requête SQL filtre strictement par équipe",()=>{
  const source=read(service);
  assert.match(source,/s\.team_id=\$2/);
  assert.match(source,/t\.is_archived=false/);
  assert.match(source,/i\.schema_version BETWEEN 28 AND 32/);
  assert.match(source,/resolveAdminTeam\(db,access\.actor,access\.teamId\)/);
  assert.match(source,/i\.schema_version<=27/);
 });
 test(name+": GET contextualisé et écriture v30 sous double verrou",()=>{
  const source=read(route);
  assert.match(source,/resolveRegistryReadContext\(db,/);
  assert.match(source,/context\.team!\.team_id/);
  assert.match(source,/!MULTI_TEAM_CONTEXT_READY/);
  assert.match(source,/SMN_MULTI_TEAM_WRITES_ENABLED/);
  assert.match(source,/context\.team\?\.team_id!==params\.get\("teamId"\)/);
 });
}
