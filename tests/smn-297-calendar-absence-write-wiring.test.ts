import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("éditeur absence : POST rattaché à l'équipe pour les parcours contextualisés",()=>{
 const editor=readFileSync("src/app/app/admin/members/member-absence-editor.tsx","utf8");
 const calendar=readFileSync("src/app/app/team-calendar/team-calendar-view.tsx","utf8");
 assert.ok(editor.includes('teamId?"/team-absence":"/absences"'));
 assert.ok(editor.includes("teamId?{teamId,change:payload}:payload"));
 assert.ok(calendar.includes("record={null} teamId={initialTeamId}"));
});
test("écriture d'absence par équipe : rôle admin et verrou de readiness",()=>{
 const route=readFileSync("src/app/api/admin/members/[id]/team-absence/route.ts","utf8");
 assert.ok(route.includes("MULTI_TEAM_CONTEXT_READY"));
 assert.ok(route.includes('actor.role!=="admin"'));
 assert.ok(route.includes("teamId:body.teamId"));
});
