import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("les fuseaux du calendrier sont lus depuis l'équipe autorisée",()=>{
 const api=readFileSync("src/app/api/team-calendar/time-zones/route.ts","utf8");
 assert.match(api,/resolveAdminTeam\(db,/);
 assert.match(api,/teamId=team\.team_id/);
 assert.match(api,/\[teamId\]/);
 assert.match(api,/params\.getAll\("teamId"\)\.length>1/);
});
test("le calendrier transmet l'équipe demandée lors de la lecture des fuseaux",()=>{
 const view=readFileSync("src/app/app/team-calendar/team-calendar-view.tsx","utf8");
 assert.ok(view.includes('fetch("/api/team-calendar/time-zones"+(initialTeamId?'));
});
