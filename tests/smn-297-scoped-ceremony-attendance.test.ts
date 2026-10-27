import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseScopedCeremonyAttendance} from "../src/server/teams/ceremony-attendance";
const good={teamId:"team_a",ceremonyId:"123e4567-e89b-42d3-a456-426614174000",revision:2,status:"held",reason:"",actualMinutes:60};
test("présence contextualisée: entrées strictes",()=>{
 assert.deepEqual(parseScopedCeremonyAttendance(good),good);
 assert.equal(parseScopedCeremonyAttendance({...good,teamId:""}),null);
 assert.equal(parseScopedCeremonyAttendance({...good,revision:0}),null);
 assert.equal(parseScopedCeremonyAttendance({...good,actualMinutes:-1}),null);
 assert.equal(parseScopedCeremonyAttendance({...good,status:"scheduled"}),null);
});
test("présence contextualisée: transaction et contrôle d'équipe",()=>{
 const service=readFileSync("src/server/teams/ceremony-attendance.ts","utf8");
 const route=readFileSync("src/app/api/admin/team-calendar/ceremonies/attendance/route.ts","utf8");
 assert.match(service,/resolveAdminTeam/);
 assert.match(service,/s\.team_id=\$2/);
 assert.match(service,/FOR UPDATE OF c,s/);
 assert.match(service,/ROLLBACK/);
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.doesNotMatch(service,/CREATE TABLE|ALTER TABLE/);
});
