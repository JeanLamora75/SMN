import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("onglets absence : ajout, liste, modification et suppression logique auditée",()=>{
 const ui=read("src/app/app/admin/members/member-absence-editor.tsx");
 const api=read("src/app/api/admin/members/[id]/team-absence/route.ts");
 const server=read("src/server/members/absence.ts");
 assert.match(ui,/role="tablist"/);
 assert.match(ui,/tab==="manage"/);
 assert.match(ui,/setSelected\(item\)/);
 assert.match(ui,/action:"delete",id:item\.id,revision:item\.revision/);
 assert.match(ui,/action:selected\?"update":"create"/);
 assert.match(ui,/memberAbsences\.cancelConfirm/);
 assert.match(api,/const allowed=new Set\(scoped\.rows\.map/);
 assert.match(api,/other\.team_id<>\$2/);
 assert.match(api,/own\.start_on<=a\.start_on/);
 assert.match(server,/deleted:true/);
 assert.match(server,/smn_member_absence_history/);
});

test("correction historique : le départ de l'équipe n'interdit plus l'édition des taux",()=>{
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 const endpoint=read("src/app/api/admin/members/[id]/team-assignment/history-correction/route.ts");
 const service=read("src/server/members/team-assignment-historical-correction.ts");
 const get=read("src/app/api/admin/members/[id]/team-assignment/route.ts");
 assert.match(editor,/teamScoped&&state\.endOn\?"\/team-assignment\/history-correction"/);
 assert.match(editor,/Corriger la version historique/);
 assert.match(editor,/state\.assignmentId&&state\.startOn&&<div/);
 assert.match(editor,/state\.versions\.map\(v=>/);
 assert.match(endpoint,/authorizeApi\(req,"write"/);
 assert.match(endpoint,/correctHistoricalTeamAssignment/);
 assert.match(service,/parseAssignmentInput\(fields\)/);
 assert.match(service,/start_on<=\$3::date/);
 assert.match(service,/end_on>=\$3::date/);
 assert.match(service,/versions\.rows\[0\]\?\.revision!==input\.revision/);
 assert.match(service,/UPDATE public\.smn_member_assignment_version/);
 assert.doesNotMatch(service,/DELETE FROM public\.smn_member_assignment_version/);
 assert.match(get,/latestRevision:Math\.max/);
});

test("traductions absence FR/EN et règles métier documentées",()=>{
 for(const lang of ["fr","en"]){
  const messages=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const key of ["manageTab","manageHeading","manageEmpty","cancelConfirm","cancelFailed"]){
   assert.ok(messages.memberAbsences[key],lang+"."+key);
  }
 }
 const spec=read("_bmad-output/implementation-artifacts/spec-smn-53-absences-individuelles.md");
 assert.match(spec,/Gérer les absences/);
 assert.match(spec,/soft delete/);
});
