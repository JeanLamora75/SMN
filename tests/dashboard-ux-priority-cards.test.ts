import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import OperationalOverview from "../src/app/app/operational-overview";
import {collectionAvailable,collectionUnavailable,metricNotRecorded,
 type CollectiveCycleProjection,type DashboardAttention} from "../src/lib/dashboard-data-contract";

type Collection=CollectiveCycleProjection["risks"];
const missing=collectionUnavailable("producer-not-ready");
function projection(obstacles:Collection=missing,risks:Collection=missing,
 notesAndAlerts:Collection=missing):CollectiveCycleProjection {
 const empty=metricNotRecorded();
 return {
  teamId:"team-A",cycleId:"sprint-A",cycleStatus:"active",snapshotVersion:null,
  goals:missing,capacity:{initialJh:empty,actualJh:empty},
  storyPoints:{initial:empty,done:empty},tickets:{initial:empty,done:empty},
  scores:{confidence:empty,clarity:empty},
  workingDaysRemaining:empty,events:missing,obstacles,risks,notesAndAlerts
 };
}
const record=(id:string,kind:DashboardAttention["kind"],
 priority:DashboardAttention["priority"]=null):DashboardAttention=>
 ({id,kind,title:"Fiche "+id,status:"open",priority});
const available=(items:DashboardAttention[],total=items.length)=>
 collectionAvailable(items,total,{source:"manual" as const});

describe("UX dashboard — lot 4 : cartes de priorité, sans donnée fabriquée",()=>{
 it("conserve les trois registres indisponibles tant que les producteurs de l'Epic 5 manquent",()=>{
  const html=renderToStaticMarkup(createElement(OperationalOverview,{locale:"fr",projection:projection()}));
  assert.equal((html.match(/Nombre d&#x27;éléments indisponible/g)||[]).length,4);
  assert.doesNotMatch(html,/data-priority=/);
  assert.doesNotMatch(html,/Fiche /);
 });
 it("rend les priorités explicites et distinctes sans dépendre de la couleur",()=>{
  const risks=available([record("haute","risk","high"),record("moyenne","risk","medium"),
   record("faible","risk","low"),record("inconnue","risk",null)]);
  const html=renderToStaticMarkup(createElement(OperationalOverview,{locale:"fr",projection:projection(missing,risks)}));
  for(const priority of ["high","medium","low","unknown"]){
   assert.match(html,new RegExp('data-priority="'+priority+'"'));
  }
  for(const label of ["Élevée","Moyenne","Faible","Non évaluée"])assert.ok(html.includes(label),label);
  assert.match(html,/Fiche haute/);
  assert.match(html,/bi-exclamation-triangle-fill/);
  assert.doesNotMatch(html,/href="\/app\/.*registres/);
 });
 it("sépare note et alerte, plafonne l'affichage à cinq et respecte le compteur exact",()=>{
  const notes=available([
   record("1","alert","high"),record("2","note","low"),
   record("3","note",null),record("4","alert","medium"),
   record("5","note","low"),record("6","alert","high")
  ],9);
  const html=renderToStaticMarkup(createElement(OperationalOverview,{locale:"fr",projection:projection(missing,missing,notes)}));
  assert.equal((html.match(/class="smn-attention-card /g)||[]).length,5);
  assert.ok(html.includes("Fiche 1"));
  assert.ok(!html.includes("Fiche 6"));
  assert.match(html,/9 éléments/);
  assert.match(html,/bi-sticky-fill/);
  assert.match(html,/bi-bell-fill/);
  assert.match(html,/>Note</);
  assert.match(html,/>Alerte</);
 });
 it("distingue une liste fiable vide d'un producteur indisponible",()=>{
  const html=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"fr",projection:projection(available([]))
  }));
  assert.match(html,/0 éléments/);
  assert.match(html,/Aucun éléments à ce jour/);
  assert.doesNotMatch(html,/data-priority=/);
 });
 it("traduit les niveaux en anglais et garde les pictogrammes décoratifs",()=>{
  const html=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"en",projection:projection(available([record("item","obstacle","high")]))
  }));
  assert.ok(html.includes("High"));
  assert.ok(html.includes("Impediment"));
  assert.match(html,/aria-hidden="true"/);
 });
 it("n'ajoute aucune mutation, source SQL fictive ou navigation vers un registre absent",()=>{
  const source=readFileSync(new URL("../src/app/app/operational-overview.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(source,/fetch\(|INSERT INTO|UPDATE public\.|DELETE FROM/);
  assert.match(source,/producer-not-ready/);
  assert.match(source,/items\.slice\(0,5\)/);
 });
});
