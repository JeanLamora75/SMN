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
 assert.match(view,/firstHalf=days\.filter/);
 assert.match(view,/secondHalf=days\.filter/);
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
 assert.match(service,/member-out-of-team/);
 assert.match(service,/EXISTS\(SELECT 1 FROM public\.smn_member_absence/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.doesNotMatch(route,/export async function (?:POST|PATCH|DELETE)/);
});

test("Cockpit membre : navigation intégrée au bandeau sans fil d'Ariane externe",()=>{
 assert.match(view,/smn-member-hero-actions/);
 assert.match(view,/className="smn-member-readonly smn-member-back"/);
 assert.match(view,/href={backHref}/);
 assert.doesNotMatch(view,/smn-member-hero-description/);
 assert.doesNotMatch(page,/<Link href={back}/);
 assert.match(page,/backHref={back}/);
 assert.match(css,/smn-member-back:focus-visible/);
});

test("Cockpit membre : trois synthèses, historique SM PO DEV et dates de sprint",()=>{
 const windowSource=read("src/server/members/team-availability-window.ts");
 assert.match(view,/smn-member-sprint-day/);
 assert.match(view,/smn-current-cycle/);
 assert.match(view,/sprintDays/);
 assert.match(view,/<th scope="col">SM<\/th>/);
 assert.match(view,/<th scope="col">PO<\/th>/);
 assert.match(view,/<th scope="col">DEV<\/th>/);
 assert.match(view,/v\.scrumMasterPercent/);
 assert.match(view,/v\.productOwnerPercent/);
 assert.match(view,/v\.developerPercent/);
 assert.doesNotMatch(view,/<th scope="col">\{t\("memberTeamScope\.effective"\)\}<\/th>/);
 assert.doesNotMatch(view,/<div><span>\{t\("memberTeamScope\.developer"\)\}/);
 assert.match(windowSource,/generate_series\(\$3::date,\$4::date/);
 assert.match(windowSource,/d\.assigned AND a\.id IS NOT NULL/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
