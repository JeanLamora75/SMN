import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cockpit=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
const assignment=read("src/app/api/admin/members/[id]/team-assignment/route.ts");
const loc=read("src/app/api/admin/members/[id]/team-location/route.ts");
const cal=read("src/app/api/admin/members/[id]/team-calendar/route.ts");
const planning=read("src/app/app/admin/members/[id]/member-team-planning-editor.tsx");
test("cockpit v32 : éditeurs affectation, rôles, absences, localisation, calendrier présents",()=>{
 for(const marker of ["AssignmentEditor","MemberAbsenceEditor","MemberTeamPlanningEditor",
  "Modifier l’affectation et les rôles","Ajouter une absence","Modifier la localisation",
  "Modifier le calendrier de travail"])assert.ok(cockpit.includes(marker),marker);
 assert.match(cockpit,/teamScoped/);
});
test("API multiéquipes : isolation équipe et autorisations à chaque lecture et écriture",()=>{
 for(const endpoint of [assignment,loc,cal])assert.match(endpoint,/authorizeApi\(/);
 for(const endpoint of [loc,cal])assert.match(endpoint,/requireTeamMemberScope\(/);
 assert.match(assignment,/saveTeamAssignmentRevision\(/);
 assert.match(assignment,/readTeamAssignmentHistory\(/);
 const service=read("src/server/members/team-assignment-write.ts");
 assert.match(service,/resolveAdminTeam\(/);
 assert.match(loc,/parseLocationChange/);
 assert.match(cal,/parseCalendarWrite/);
});
test("localisation et calendrier : révision, transaction, validation et dates",()=>{
 for(const endpoint of [loc,cal]){
  assert.match(endpoint,/FOR UPDATE/);
  assert.match(endpoint,/latest\?\.revision/);
  assert.match(endpoint,/await db\.query\("BEGIN"\)/);
  assert.match(endpoint,/await db\.query\("ROLLBACK"\)/);
  assert.match(endpoint,/await db\.query\("COMMIT"\)/);
 }
 assert.match(planning,/teamId,change/);
});
