import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const indicators=read("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
test("Sprint : pas de retour externe, contexte équipe et dates sur la même ligne",()=>{
 assert.doesNotMatch(page,/<nav aria-label=\{t\("dashboard\.cockpit\.sprintDetailsTitle"\)\}/);
 assert.match(page,/smn-sprint-hero-meta/);
 assert.match(page,/smn-sprint-team-name/);
 assert.match(page,/dashboard\.context\.product/);
 assert.match(page,/dashboard\.context\.team/);
 assert.match(page,/<time dateTime=\{start\.toISOString\(\)\}/);
});
test("Sprint : pastille de statut alignée aux boutons, avec style Cockpit",()=>{
 assert.match(page,/className="smn-sprint-status-pill"/);
 assert.match(css,/\.smn-sprint-status-pill/);
 assert.match(css,/min-height:37px/);
 assert.match(page,/sprintReportPrepare\.launch/);
});
test("Indicateurs : trois colonnes desktop avec édition et calcul C02 préservés",()=>{
 assert.match(indicators,/col-12 col-md-6 col-xl-4/);
 assert.match(indicators,/col-12 col-sm-6 col-xl-4/);
 assert.match(indicators,/calculatedActual/);
 assert.match(indicators,/sprintDetail\.indicatorCalculatedReference/);
});
