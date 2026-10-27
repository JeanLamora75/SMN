import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("absence contextualisée : garde admin et disponibilité",()=>{
 const route=readFileSync("src/app/api/admin/members/[id]/team-absences/route.ts","utf8");
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/readScopedTeamAbsences/);
});
test("lecture exclut tout chevauchement d'une autre équipe",()=>{
 const source=readFileSync("src/server/members/team-absence-read.ts","utf8");
 assert.match(source,/requireTeamMemberScope/);
 assert.match(source,/NOT EXISTS/);
 assert.match(source,/other\.team_id<>\$2/);
 assert.match(source,/own\.start_on<=a\.start_on/);
 assert.match(source,/own\.end_on>=a\.end_on/);
});
test("formulaire utilise le GET contextualisé en conservant la route historique",()=>{
 const editor=readFileSync("src/app/app/admin/members/member-absence-editor.tsx","utf8");
 assert.match(editor,/teamId\?"\/team-absences\?"/);
 assert.match(editor,/teamId\?"\/team-absence":"\/absences"/);
});
