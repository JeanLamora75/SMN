import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import CycleOverview from "../src/app/app/cycle-overview";
import BootstrapIcon from "../src/app/app/bootstrap-icon";
import {sprintDetailPath} from "../src/lib/sprint-detail-path";
import {
 collectionAvailable,collectionUnavailable,metricNotRecorded,
 type CollectiveCycleProjection,type DashboardGoal
} from "../src/lib/dashboard-data-contract";
import type {DashboardContext} from "../src/server/dashboard/read";
import type {SprintContextItem} from "../src/lib/sprint-context";

const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const context:DashboardContext={
 productId:"product-1",product:"Mon produit",teamId:"team-1",team:"Équipe pilote",mode:"scrum"
};
const cycle:SprintContextItem={
 id:"123e4567-e89b-42d3-a456-426614174000",name:"Sprint 12",
 status:"planned",startAt:"2030-10-07T07:00:00Z",
 endAt:"2030-10-20T21:59:00Z",timeZone:"Europe/Paris",suspended:false
};
const emptyMetric=metricNotRecorded();
const unavailable=collectionUnavailable("producer-not-ready");
function projection(goals:CollectiveCycleProjection["goals"]):CollectiveCycleProjection{
 return {
  teamId:context.teamId,cycleId:cycle.id,cycleStatus:cycle.status,snapshotVersion:null,
  goals,
  capacity:{initialJh:emptyMetric,actualJh:emptyMetric},
  storyPoints:{initial:emptyMetric,done:emptyMetric},
  tickets:{initial:emptyMetric,done:emptyMetric},
  scores:{confidence:emptyMetric,clarity:emptyMetric},
  workingDaysRemaining:emptyMetric,
  events:unavailable,obstacles:unavailable,risks:unavailable,notesAndAlerts:unavailable
 };
}
function html(locale:"fr"|"en",goals:CollectiveCycleProjection["goals"]){
 return renderToStaticMarkup(createElement(CycleOverview,{
  locale,context,teamHref:"/app/team/team-1",cycle,projection:projection(goals)
 }));
}
const goal=(id:string,title:string):DashboardGoal=>({
 id,title,evaluation:"not_evaluated"
});

describe("UX — lot 1, bandeau Sprint compact et fiche",()=>{
 it("affiche le Sprint et le premier objectif réel dans un seul bandeau",()=>{
  const output=html("fr",collectionAvailable([goal("a","Améliorer l'expérience utilisateur")],
   1,{source:"manual"}));
  assert.match(output,/class="smn-cycle-overview-header smn-cycle-header-compact"/);
  assert.equal((output.match(/<h1\b/g)||[]).length,1);
  assert.match(output,/Sprint 12/);
  assert.doesNotMatch(output,/Mon produit/);
  assert.match(output,/Équipe pilote/);
  assert.match(output,/Améliorer l&#x27;expérience utilisateur|Améliorer l'expérience utilisateur/);
  assert.match(output,/Objectif du sprint/);
  assert.match(output,/smn-cycle-date-range/);
  assert.match(output,/class="bi bi-calendar3/);
  assert.match(output,/class="bi bi-bullseye/);
  assert.match(output,/Voir le détail du sprint/);
  assert.match(output,/href="\/app\/admin\/sprints\/123e4567-e89b-42d3-a456-426614174000"/);
  assert.doesNotMatch(output,/Sprint sélectionné dans le contexte de pilotage/);
 });
 it("n'invente aucun objectif principal quand la source en contient plusieurs",()=>{
  const output=html("fr",collectionAvailable([
   goal("a","Objectif alpha"),goal("b","Objectif beta"),goal("c","Objectif gamma")
  ],3,{source:"manual"}));
  const banner=output.slice(0,output.indexOf('class="smn-metric-grid"'));
  assert.match(banner,/Objectif alpha/);
  assert.match(banner,/Objectif beta/);
  assert.match(banner,/Objectif gamma/);
  assert.equal((banner.match(/smn-cycle-goal-text/g)||[]).length,3);
  assert.match(banner,/href="\/app\/admin\/sprints\//);
 });
 it("distingue objectif absent d'une source indisponible",()=>{
  const empty=html("fr",collectionAvailable<DashboardGoal>([],0,{source:"manual"}));
  const failed=html("fr",collectionUnavailable("schema-missing"));
  assert.match(empty,/Objectif non renseigné/);
  assert.match(failed,/Non disponibles/);
  assert.doesNotMatch(failed,/Objectif non renseigné/);
 });
 it("traduit le bandeau en anglais et conserve les liens",()=>{
  const output=html("en",collectionAvailable([goal("a","Ship the product")],
   1,{source:"manual"}));
  assert.match(output,/Sprint goal/);
  assert.match(output,/View sprint details/);
  assert.match(output,/Ship the product/);
  assert.match(output,/href="\/app\/admin\/sprints\//);
 });
 it("sans Sprint, ne propose pas de détail fictif et conserve l'accès à l'équipe",()=>{
  const output=renderToStaticMarkup(createElement(CycleOverview,{
   locale:"fr",context,teamHref:"/app/team/team-1",cycle:null
  }));
  assert.match(output,/Aucun cycle créé/);
  assert.match(output,/href="\/app\/team\/team-1"/);
  assert.doesNotMatch(output,/href="\/app\/admin\/sprints\//);
 });
 it("la fiche est autorisée côté serveur, liée à l'équipe et en lecture seule",()=>{
  const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
  assert.match(page,/canAccess\(account,"read",collective\)/);
  assert.match(page,/readSprintContext\(db,teamId\)/);
  assert.match(page,/context\.items\.find\(item=>item\.id===sprintId\)/);
  assert.match(page,/if\(!cycle\)return null/);
  assert.match(page,/readSprintDetailGoals\(db,teamId,cycle\.id\)/);
  assert.match(page,/if\(result===null\)notFound\(\)/);
  assert.match(page,/<SprintGoalsPanel\s/);
  assert.match(page,/backToDashboard/);
  assert.doesNotMatch(page,/CREATE TABLE|UPDATE public\.|INSERT INTO/);
  const index=read("src/app/app/admin/sprints/sprint-index-view.tsx");
  assert.match(index,/href=\{sprintDetailPath\(item\.id\)\}/);
  assert.equal(sprintDetailPath(cycle.id),
   "/app/admin/sprints/123e4567-e89b-42d3-a456-426614174000");
  assert.equal(sprintDetailPath("a/b"),"/app/admin/sprints/a%2Fb");
 });
 it("garde une composition responsive compacte et des icônes officielles sans CDN",()=>{
  const css=read("src/app/dashboard.css");
  const iconSource=read("src/app/app/bootstrap-icon.tsx");
  assert.match(css,/\.smn-cycle-overview-header\s*\{\s*display:grid/);
  assert.match(css,/grid-template-columns:minmax\(0,1\.05fr\) minmax\(0,1\.12fr\) auto/);
  assert.match(css,/@container \(max-width:950px\)/);
  assert.match(css,/@container \(max-width:650px\)/);
  assert.match(css,/\.smn-cycle-header-actions\s*\{grid-column:1;grid-row:3/);
  assert.match(iconSource,/github\.com\/twbs\/icons/);
  const svg=renderToStaticMarkup(createElement(BootstrapIcon,{name:"bullseye"}));
  assert.match(svg,/class="bi bi-bullseye/);
  assert.match(svg,/aria-hidden="true"/);
  assert.match(svg,/viewBox="0 0 16 16"/);
 });
});
