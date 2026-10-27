import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseScopedCeremonyChange} from "../src/server/teams/ceremony-reschedule";
const good={teamId:"team_a",ceremonyId:"abc_123",revision:1,startAt:"2026-10-27T09:00:00.000Z",endAt:"2026-10-27T10:00:00.000Z"};
test("contrat strict de replanification Scrum",()=>{
 assert.deepEqual(parseScopedCeremonyChange(good),good);
 assert.equal(parseScopedCeremonyChange({...good,teamId:""}),null);
 assert.equal(parseScopedCeremonyChange({...good,revision:0}),null);
 assert.equal(parseScopedCeremonyChange({...good,endAt:good.startAt}),null);
 assert.equal(parseScopedCeremonyChange({...good,unknown:1}),null);
});
test("migration implicite interdite et verrou route conservé",()=>{
 const service=readFileSync("src/server/teams/ceremony-reschedule.ts","utf8");
 const route=readFileSync("src/app/api/admin/team-calendar/ceremonies/reschedule/route.ts","utf8");
 assert.match(service,/resolveAdminTeam/);
 assert.match(service,/s\.team_id=\$2/);
 assert.match(service,/FOR UPDATE OF c,s/);
 assert.match(service,/ROLLBACK/);
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.doesNotMatch(service,/CREATE TABLE|ALTER TABLE/);
});
