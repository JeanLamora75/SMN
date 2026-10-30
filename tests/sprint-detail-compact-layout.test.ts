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
test("Indicateurs : trois colonnes fonctionnelles avec sections empilées",()=>{
 const capacity=indicators.indexOf('section(t("sprintDetail.indicatorCapacityTitle")');
 const scores=indicators.indexOf('section(t("sprintDetail.indicatorScoresTitle")');
 const points=indicators.indexOf('section(t("storyPoints.title")');
 const tickets=indicators.indexOf('section(t("sprintTickets.title")');
 const derived=indicators.indexOf('<section aria-label={t("sprintDetail.indicatorDerivedTitle")}');
 assert.ok(capacity>=0&&capacity<scores&&scores<points&&points<tickets&&tickets<derived);
 assert.equal((indicators.match(/className="smn-sprint-indicators-column"/g)??[]).length,3);
 assert.match(indicators,/className="smn-sprint-indicators-layout"/);
 assert.match(indicators,/calculatedActual/);
 const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:700px\)/);
});
