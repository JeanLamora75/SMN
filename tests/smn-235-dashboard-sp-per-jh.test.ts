import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {dashboardStoryPointsPerJh} from "../src/lib/dashboard-sp-per-jh";
import {metricAvailable,metricNotRecorded,metricUnavailable} from "../src/lib/dashboard-data-contract";
import CycleOverview from "../src/app/app/cycle-overview";
import type {CollectiveCycleProjection} from "../src/lib/dashboard-data-contract";
import type {DashboardContext} from "../src/server/dashboard/read";
import type {SprintContextItem} from "../src/lib/sprint-context";

const known=(value:number,source:"manual"|"closure-snapshot"="manual")=>
 metricAvailable(value,{quality:"known",source,
  ...(source==="closure-snapshot"?{snapshotVersion:2}:{})});
const estimated=(value:number)=>metricAvailable(value,{quality:"estimated",source:"calculated"});
const context:DashboardContext={productId:"product",product:"Produit",
 teamId:"team",team:"Equipe",mode:"scrum"};
const sprint:SprintContextItem={
 id:"sprint-1",name:"Sprint pilote",status:"active",suspended:false,
 startAt:"2026-10-19T07:00:00Z",endAt:"2026-10-30T17:00:00Z",
 timeZone:"Europe/Paris"
};
const projection=(initial:number,done:number,planned:number,actual:number)=>{
 const data={
  teamId:"team",cycleId:"sprint-1",cycleStatus:"active",snapshotVersion:null,
  capacity:{initialJh:known(planned),actualJh:known(actual)},
  storyPoints:{initial:known(initial),done:known(done)}
 } as CollectiveCycleProjection;
 return data;
};
const view=(locale:"fr"|"en",data:CollectiveCycleProjection)=>
 renderToStaticMarkup(createElement(CycleOverview,{
  context,locale,teamHref:"/app/team/team",cycle:sprint,projection:data
 }));

describe("SMN-235 — SP par jour-homme dans le cockpit",()=>{
 it("utilise les SP initialement engagés / capacité prévue et SP réalisés / capacité réelle",()=>{
  assert.deepEqual(dashboardStoryPointsPerJh(known(20),known(25)),{
   state:"available",value:0.8
  });
  assert.deepEqual(dashboardStoryPointsPerJh(known(12),known(15)),{
   state:"available",value:0.8
  });
  assert.deepEqual(dashboardStoryPointsPerJh(known(3),known(2)),{
   state:"available",value:1.5
  });
 });
 it("préserve les valeurs décimales sans fabriquer des pourcentages",()=>{
  assert.equal(dashboardStoryPointsPerJh(known(1),known(3)).state,"available");
  const result=dashboardStoryPointsPerJh(known(1),known(3));
  if(result.state==="available")assert.equal(result.value,1/3);
 });
 it("distingue zéro de SP, dénominateur nul, saisie absente et indisponibilité",()=>{
  assert.deepEqual(dashboardStoryPointsPerJh(known(0),known(15)),{state:"available",value:0});
  assert.deepEqual(dashboardStoryPointsPerJh(known(0),known(0)),{state:"not-calculable"});
  assert.deepEqual(dashboardStoryPointsPerJh(known(5),known(0)),{state:"not-calculable"});
  assert.deepEqual(dashboardStoryPointsPerJh(known(5),metricNotRecorded()),{state:"not-recorded"});
  assert.deepEqual(dashboardStoryPointsPerJh(metricNotRecorded(),known(5)),{state:"not-recorded"});
  assert.deepEqual(dashboardStoryPointsPerJh(known(5),metricUnavailable("history-missing")),{state:"unavailable"});
  assert.deepEqual(dashboardStoryPointsPerJh(undefined,known(5)),{state:"not-recorded"});
  assert.deepEqual(dashboardStoryPointsPerJh(estimated(2),known(5)),{state:"available",value:0.4});
  assert.deepEqual(dashboardStoryPointsPerJh(known(2),known(-5)),{state:"not-calculable"});
 });
 it("place exactement deux ratios à droite des SP dans la carte sans retirer le taux actuel",()=>{
  const html=view("fr",projection(20,12,25,15));
  assert.match(html,/SP engagés par J\/H prévu/);
  assert.match(html,/SP réalisés par J\/H réel/);
  assert.equal((html.match(/class="smn-kpi-density"/g)||[]).length,2);
  assert.match(html,/0,8[\s\S]*?SP\/J\/H/);
  assert.match(html,/class="smn-kpi-ring"/);
  assert.match(html,/60 % : SP réalisés \/ SP initialement engagés/);
  assert.equal((html.match(/class="smn-metric-card/g)||[]).length,5);
  assert.doesNotMatch(html,/NaN|Infinity/);
 });
 it("affiche en anglais et réutilise les mesures d'un snapshot sans requête actuelle",()=>{
  const data=projection(18,10,20,10);
  const closed:CollectiveCycleProjection={
   ...data,cycleStatus:"closed",snapshotVersion:2,
   storyPoints:{initial:known(18,"closure-snapshot"),done:known(10,"closure-snapshot")},
   capacity:{initialJh:known(20,"closure-snapshot"),actualJh:known(10,"closure-snapshot")}
  };
  const html=view("en",closed);
  assert.match(html,/Committed SP per planned person-day/);
  assert.match(html,/Completed SP per actual person-day/);
  assert.match(html,/0\.9[\s\S]*?SP\/J\/H/);
  assert.match(html,/1[\s\S]*?SP\/J\/H/);
  assert.match(html,/Closure snapshot/);
 });
 it("n'affiche ni division ni zéro fictif en cas de capacité absente ou nulle",()=>{
  const data=projection(8,0,0,10);
  const html=view("fr",data);
  assert.match(html,/Non calculable/);
  assert.match(html,/0[\s\S]*?SP\/J\/H/);
  const missing:CollectiveCycleProjection={
   ...data,storyPoints:{initial:metricNotRecorded(),done:metricNotRecorded()},
   capacity:{initialJh:metricNotRecorded(),actualJh:metricUnavailable("read-failed")}
  };
  const htmlMissing=view("fr",missing);
  assert.match(htmlMissing,/Non renseigné/);
  assert.match(htmlMissing,/Non disponibles/);
  assert.doesNotMatch(htmlMissing,/Infinity|NaN/);
 });
});
