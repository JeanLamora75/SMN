import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import CycleOverview from "../src/app/app/cycle-overview";
import {KpiMetricPair,KpiDeadline} from "../src/app/app/kpi-cards";
import {dashboardMetricRatio} from "../src/lib/dashboard-metric-ratio";
import {metricAvailable,metricNotRecorded,metricUnavailable,
 type DashboardMetric} from "../src/lib/dashboard-data-contract";
import type {DashboardContext} from "../src/server/dashboard/read";
import type {SprintContextItem} from "../src/lib/sprint-context";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const available=(value:number)=>metricAvailable(value,{quality:"known",source:"manual"});
const estimated=(value:number)=>metricAvailable(value,{quality:"estimated",source:"calculated"});
const context:DashboardContext={
 productId:"p",product:"Produit",teamId:"team",team:"Équipe",mode:"scrum"
};
const sprint:SprintContextItem={
 id:"sprint-1",name:"Sprint pilote",status:"active",suspended:false,
 startAt:"2026-10-19T07:00:00Z",endAt:"2026-10-30T17:00:00Z",timeZone:"Europe/Paris"
};
const pair=(locale:"fr"|"en",initial?:DashboardMetric,done?:DashboardMetric)=>
 renderToStaticMarkup(createElement(KpiMetricPair,{
  title:locale==="fr"?"Story Points":"Story points",
  first:locale==="fr"?"SP initialement engagés":"Initially committed story points",
  second:locale==="fr"?"SP réalisés":"Completed story points",
  unit:"SP",empty:"Source non encore raccordée",comparison:"Comparaison indisponible",
  firstMetric:initial,secondMetric:done,locale,
  icon:"stack",tone:"points",ratioKey:"dashboard.cockpit.storyPointsRatio"
 }));

describe("UX lot 2 — cartes KPI fiables",()=>{
 it("conserve quatre KPI initiaux et ajoute la carte des deux notes",()=>{
  const html=renderToStaticMarkup(createElement(CycleOverview,{
   locale:"fr",context,teamHref:"/app/team/team",cycle:sprint
  }));
  assert.equal((html.match(/class="smn-metric-card /g)||[]).length,5);
  for(const icon of ["people-fill","stack","ticket-perforated-fill","calendar-event"]){
   assert.match(html,new RegExp('class="bi bi-'+icon));
  }
  assert.match(html,/Capacité prévue/);
  assert.match(html,/Capacité réelle/);
  assert.match(html,/SP initialement engagés/);
  assert.match(html,/Tickets initialement engagés/);
  assert.match(html,/Jours ouvrés restants/);
  assert.doesNotMatch(html,/Avancement global/);
 });
 it("valorise les valeurs enregistrées, leur unité et leur provenance",()=>{
  const html=pair("fr",available(65),available(47));
  assert.match(html,/smn-kpi-primary/);
  assert.match(html,/smn-kpi-secondary/);
  assert.match(html,/65<span class="smn-kpi-unit"> SP/);
  assert.match(html,/47<span class="smn-kpi-unit"> SP/);
  assert.match(html,/Saisie/);
  assert.match(html,/72%/);
  assert.match(html,/72 % : SP réalisés \/ SP initialement engagés/);
  assert.match(html,/--smn-kpi-fill:72.3076923076923%/);
 });
 it("ne fabrique pas de ratio si valeur initiale nulle, absente ou estimée",()=>{
  assert.equal(dashboardMetricRatio(available(0),available(10)),null);
  assert.equal(dashboardMetricRatio(metricNotRecorded(),available(10)),null);
  assert.equal(dashboardMetricRatio(metricUnavailable("schema-missing"),available(10)),null);
  assert.equal(dashboardMetricRatio(estimated(12),available(9)),null);
  assert.equal(dashboardMetricRatio(available(12),estimated(9)),null);
  assert.equal(dashboardMetricRatio(available(12),metricNotRecorded()),null);
  const markup=pair("fr",available(0),available(5));
  assert.match(markup,/0<span class="smn-kpi-unit"> SP/);
  assert.doesNotMatch(markup,/class="smn-kpi-ring"/);
  assert.match(markup,/Comparaison indisponible/);
 });
 it("montre un zéro réalisé authentique, sans considérer zéro comme une absence",()=>{
  const ratio=dashboardMetricRatio(available(8),available(0));
  assert.deepEqual(ratio,{percentage:0,visualFill:0});
  const markup=pair("fr",available(8),available(0));
  assert.match(markup,/0<span class="smn-kpi-unit"> SP/);
  assert.match(markup,/0%/);
  assert.match(markup,/class="smn-kpi-ring"/);
 });
 it("ne plafonne pas un ratio métier supérieur à 100 % dans son texte",()=>{
  const ratio=dashboardMetricRatio(available(8),available(12));
  assert.deepEqual(ratio,{percentage:150,visualFill:100});
  const markup=pair("fr",available(8),available(12));
  assert.match(markup,/150%/);
  assert.match(markup,/--smn-kpi-fill:100%/);
 });
 it("affiche un pourcentage neutre en anglais sans jugement de performance",()=>{
  const html=pair("en",available(10),available(7));
  assert.match(html,/70%: completed story points \/ initially committed story points/);
  assert.doesNotMatch(html,/good progress|bad progress|productivity/i);
 });
 it("conserve les états de données absentes, indisponibles et estimées",()=>{
  const blank=pair("fr",metricNotRecorded(),metricUnavailable("history-missing"));
  assert.match(blank,/Non renseigné/);
  assert.match(blank,/Non disponibles/);
  assert.doesNotMatch(blank,/class="smn-kpi-ring"/);
  const estimate=pair("fr",estimated(10),available(4));
  assert.match(estimate,/Estimé/);
  assert.doesNotMatch(estimate,/class="smn-kpi-ring"/);
 });
 it("pour le compteur de jours, zéro est visible uniquement s'il est réellement disponible",()=>{
  const done=renderToStaticMarkup(createElement(KpiDeadline,{
   locale:"fr",metric:available(0),cycleExists:true,status:"closed"
  }));
  assert.match(done,/0<span class="smn-kpi-unit"> jours/);
  assert.match(done,/Sprint terminé/);
  assert.doesNotMatch(done,/smn-kpi-ring/);
  const absent=renderToStaticMarkup(createElement(KpiDeadline,{
   locale:"en",metric:metricUnavailable("read-failed"),cycleExists:true,status:"active"
  }));
  assert.match(absent,/Cannot be calculated/);
  assert.doesNotMatch(absent,/>0<span/);
 });
 it("garde 4 / 2 / 1 colonnes et n'introduit ni scores globaux ni CDN",()=>{
  const css=read("src/app/dashboard.css");
  const component=read("src/app/app/kpi-cards.tsx");
  assert.match(css,/\.smn-metric-grid\s*\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/@container \(max-width:1000px\)/);
  assert.match(css,/@container \(max-width:520px\)/);
  assert.match(css,/\.smn-kpi-ring::before/);
  assert.match(component,/dashboardMetricRatio\(firstMetric,secondMetric\)/);
  assert.doesNotMatch(component,/https?:\/\/|Math\.random|progress-global|globalProgress/);
 });
});
