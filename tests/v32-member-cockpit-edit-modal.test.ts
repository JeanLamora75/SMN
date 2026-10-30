import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const view=readFileSync(new URL("../src/app/app/admin/members/[id]/member-team-read-only.tsx",import.meta.url),"utf8");
const style=readFileSync(new URL("../src/app/app/admin/members/[id]/member-cockpit.css",import.meta.url),"utf8");
test("les trois actions sont dans le bandeau Cockpit Agile",()=>{
 const hero=view.slice(view.indexOf('<header className="smn-member-hero">'),view.indexOf('</header>'));
 for(const action of ["Profil","Localisation","Calendrier","Modifier Affectation"])
  assert.ok(hero.includes(action),action);
 assert.ok(!view.includes('setEditingPlanning('));
});
test("chaque action ouvre une seule modale avec un éditeur adapté",()=>{
 assert.match(view,/dialogRef\.current/);
 assert.match(view,/dialog\.showModal\(\)/);
 assert.match(view,/className="smn-member-edit-dialog"/);
 assert.match(view,/editor==="profile"\?<MemberTeamProfileEditor/);
 assert.match(view,/editor==="assignment"\?<AssignmentEditor/);
 assert.match(view,/<MemberTeamPlanningEditor key=\{editor/);
 assert.match(view,/onCancel=\{\(\)=>setEditor\(null\)\}/);
});
test("la modale respecte le visuel, le fond et les écrans étroits",()=>{
 assert.match(style,/\.smn-member-edit-dialog::backdrop/);
 assert.match(style,/\.smn-member-edit-dialog \.smn-cockpit-modal-header/);
 assert.match(style,/@media\(max-width:650px\)\{\.smn-member-edit-dialog/);
});
