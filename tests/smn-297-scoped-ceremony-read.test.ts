import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("le détail d'une cérémonie nécessite le contexte admin et équipe",()=>{
 const route=readFileSync("src/app/api/admin/team-calendar/meetings/[kind]/[id]/route.ts","utf8");
 assert.ok(route.includes("MULTI_TEAM_CONTEXT_READY"));
 assert.ok(route.includes("resolveAdminTeam"));
 assert.ok(route.includes("readCalendarMeeting(db,kind,id,team.team_id)"));
});
test("la lecture SQL du détail filtre par équipe",()=>{
 const source=readFileSync("src/server/sprints/calendar-meeting-detail.ts","utf8");
 assert.ok(source.includes("s.team_id=$2"));
 assert.ok(source.includes("i.schema_version IN (28,29)"));
});
test("les cérémonies multiéquipes restent en lecture seule",()=>{
 const view=readFileSync("src/app/app/team-calendar/team-calendar-view.tsx","utf8");
 const modal=readFileSync("src/app/app/team-calendar/scoped-ceremony-detail.tsx","utf8");
 assert.ok(view.includes("<ScopedCeremonyDetail"));
 assert.ok(modal.includes('method:"PATCH"')===false);
});
