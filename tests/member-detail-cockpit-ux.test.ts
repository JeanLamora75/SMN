import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const view=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
const css=read("src/app/app/admin/members/[id]/member-cockpit.css");
const page=read("src/app/app/admin/members/[id]/page.tsx");

test("Cockpit membre : bandeau contextualisé et statut lecture seule",()=>{
 assert.match(view,/className="smn-member-hero"/);
 assert.match(view,/\{teamName\}/);
 assert.match(view,/\{memberName\}/);
 assert.match(view,/smn-member-readonly/);
 assert.match(view,/memberTeamScope\.readOnly/);
 assert.match(page,/import "\.\/member-cockpit\.css"/);
});
test("Cockpit membre : panneaux, indicateurs réels, tableaux et mois conservés",()=>{
 assert.match(view,/smn-member-panel/);
 assert.match(view,/const active=versions\[0\]/);
 assert.match(view,/active\.allocationPercent/);
 assert.match(view,/active\.developerPercent/);
 assert.match(view,/smn-member-revision/);
 assert.match(view,/type="month"/);
 assert.match(view,/days\.filter\(d=>d\.morningAbsent\)/);
 assert.match(view,/days\.filter\(d=>d\.afternoonAbsent\)/);
 assert.match(view,/memberTeamScope\.privacy/);
});
test("Cockpit membre : style isolé et responsive, aucun accès métier ajouté",()=>{
 assert.match(css,/\.smn-member-cockpit/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(view,/fetch\("\/api\/admin\/members\/"/);
 assert.doesNotMatch(view,/method:"(?:PATCH|POST|DELETE)"/);
 assert.match(page,/readTeamAssignmentHistory\(db,/);
});
