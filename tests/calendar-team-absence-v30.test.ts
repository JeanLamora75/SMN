import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Calendrier: l'équipe active est résolue côté serveur",()=>{
 const code=source("src/app/app/team-calendar/page.tsx");
 assert.match(code,/resolveAdminTeam\(db,/);
 assert.match(code,/initialTeamId=\{resolvedTeamId\}/);
});
test("Calendrier: la création d'absence transmet le teamId",()=>{
 const code=source("src/app/app/team-calendar/team-calendar-view.tsx");
 assert.match(code,/teamId=\{initialTeamId\?\?undefined\}/);
});
test("Éditeur: utilise les routes contextualisées en création depuis Calendrier",()=>{
 const code=source("src/app/app/admin/members/member-absence-editor.tsx");
 assert.match(code,/teamId\?"\/team-absence\?"/);
 assert.match(code,/teamId\?"\/team-absence":"\/absences"/);
 assert.match(code,/JSON\.stringify\(teamId\?\{teamId,change:payload\}:payload\)/);
});
test("Lecture: équipe et affectation vérifiées, historique privé non exposé",()=>{
 const code=source("src/app/api/admin/members/[id]/team-absence/route.ts");
 assert.match(code,/export async function GET/);
 assert.match(code,/resolveAdminTeam\(db,/);
 assert.match(code,/a\.member_id=\$1 AND a\.team_id=\$2/);
 assert.match(code,/absences:\[\],onDate:\[\]/);
 assert.match(code,/\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\//);
});
