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

test("Cockpit membre : largeur complète et grille historique/calendrier deux tiers",()=>{
 const css=read("src/app/app/admin/members/[id]/member-cockpit.css");
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,2fr\)/);
 assert.match(css,/smn-member-month-columns/);
 assert.match(view,/smn-member-body/);
 assert.match(view,/smn-member-history/);
 assert.match(view,/smn-member-calendar/);
 assert.match(view,/days\.slice\(0,split\)/);
 assert.match(view,/days\.slice\(split\)/);
 assert.match(page,/maxWidth:"none"/);
});
test("Cockpit membre : rôle, fonction, dates civiles localisées et annuel confidentiel",()=>{
 const service=read("src/server/members/team-annual-absence.ts");
 const route=read("src/app/api/admin/members/[id]/team-annual-absence/route.ts");
 assert.match(view,/professionalFunction/);
 assert.match(view,/scrumMasterPercent/);
 assert.match(view,/productOwnerPercent/);
 assert.match(view,/developerPercent/);
 assert.match(view,/Intl\.DateTimeFormat/);
 assert.match(view,/formatCivil\(v\.startOn,locale\)/);
 assert.match(view,/formatCivil\(d\.date,locale\)/);
 assert.match(view,/annual===null/);
 assert.match(service,/resolveAdminTeam/);
 assert.match(service,/x\.team_id=\$2/);
 assert.match(service,/SELECT DISTINCT/);
 assert.match(service,/EXISTS\(SELECT 1 FROM public\.smn_member_absence/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.doesNotMatch(route,/export async function (?:POST|PATCH|DELETE)/);
});
