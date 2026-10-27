import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("création des comptes rendus: verrous équipe, sprint et cérémonie",()=>{
 const s=readFileSync("src/server/teams/ceremony-outcomes-create.ts","utf8");
 assert.match(s,/resolveAdminTeam/);
 assert.match(s,/s\.team_id=\$2/);
 assert.match(s,/FOR UPDATE OF s,c/);
 assert.match(s,/meeting\.sprintId!==sprint\.rows\[0\]\.id/);
 assert.match(s,/ROLLBACK/);
 assert.doesNotMatch(s,/CREATE TABLE|ALTER TABLE/);
});
test("les API multiéquipes restent fermées avant la recette",()=>{
 for(const route of [
  "src/app/api/admin/team-calendar/ceremonies/outcome-create/route.ts",
  "src/app/api/admin/team-calendar/ceremonies/attendance/route.ts",
  "src/app/api/admin/team-calendar/ceremonies/reschedule/route.ts"
 ]){
  const code=readFileSync(route,"utf8");
  assert.match(code,/MULTI_TEAM_CONTEXT_READY/);
  assert.match(code,/actor\.role!=="admin"/);
 }
});
