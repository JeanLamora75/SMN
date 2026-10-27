import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("formulaire cérémonie utilise le contrat équipe, révision et horaire",()=>{
 const source=readFileSync("src/app/app/team-calendar/scoped-ceremony-detail.tsx","utf8");
 assert.ok(source.includes('"/api/admin/team-calendar/ceremonies/reschedule"'));
 assert.ok(source.includes("teamId,ceremonyId:detail.id,revision:detail.revision,startAt,endAt"));
 assert.ok(source.includes("resolveCalendarLocalTime"));
});
test("la route reste interdite avant activation",()=>{
 const source=readFileSync("src/app/api/admin/team-calendar/ceremonies/reschedule/route.ts","utf8");
 assert.ok(source.includes("MULTI_TEAM_CONTEXT_READY"));
});
