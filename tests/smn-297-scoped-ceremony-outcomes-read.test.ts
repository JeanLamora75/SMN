import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("lecture des comptes rendus strictement liée à l'équipe et au sprint",()=>{
 const source=readFileSync("src/server/teams/ceremony-outcomes-read.ts","utf8");
 assert.match(source,/resolveAdminTeam/);
 assert.match(source,/readCalendarMeeting\(db,kind,id,team\.team_id\)/);
 assert.match(source,/l\.team_id=\$1 AND l\.sprint_id=\$2/);
 assert.doesNotMatch(source,/CREATE TABLE|ALTER TABLE/);
 const api=readFileSync("src/app/api/admin/team-calendar/ceremonies/outcomes/route.ts","utf8");
 assert.match(api,/MULTI_TEAM_CONTEXT_READY/);
});
