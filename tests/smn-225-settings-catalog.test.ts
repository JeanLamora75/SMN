import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {translate} from "../src/i18n/catalog";
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const flatten=(mode:"scrum"|"kanban"|null,actor=admin)=>settingsCatalog(mode,actor).flatMap(g=>g.entries);
describe("SMN-225 — Catalogue des Paramètres",()=>{
 it("expose les rubriques Cockpit et Liens dans les 4 familles attendues",()=>{
  const groups=settingsCatalog("scrum",admin);
  assert.deepEqual(groups.map(x=>x.id),["application","agile","calendar","administration"]);
  assert.deepEqual(groups.map(g=>g.entries.map(e=>e.id)),[
   ["preferences"],
   ["teams","cadence","ceremonies","capacity","registries","links"],
   ["workingDays","holidaysClosures","absences"],
   ["users","security","maintenance"]
  ]);
 });
 it("n'invente aucun lien pour les fonctions manquantes ou partiellement accessibles",()=>{
  const entries=flatten("scrum");
  for(const id of ["capacity"]){
   assert.equal(entries.find(e=>e.id===id)?.href,null);
  }
  assert.equal(entries.find(e=>e.id==="workingDays")?.status,"partial");
  assert.equal(entries.find(e=>e.id==="workingDays")?.href,"/app/admin/settings/working-days");
  assert.equal(entries.find(e=>e.id==="ceremonies")?.status,"partial");
  assert.equal(entries.find(e=>e.id==="ceremonies")?.href,"/app/admin/settings/ceremonies");
  assert.equal(entries.find(e=>e.id==="capacity")?.status,"planned");
  assert.equal(entries.find(e=>e.id==="preferences")?.href,"/app/admin/settings/general");
  assert.equal(entries.some(e=>["integrations","notifications"].includes(e.id)),false);
 });
 it("respecte le mode Kanban sans retirer les rubriques du catalogue",()=>{
  const entries=flatten("kanban");
  assert.equal(entries.find(e=>e.id==="cadence")?.status,"available");
  assert.equal(entries.find(e=>e.id==="cadence")?.href,"/app/admin/kanban-cadence");
  for(const id of ["ceremonies","workingDays"]){
   assert.equal(entries.find(e=>e.id===id)?.status,"not-applicable");
   assert.equal(entries.find(e=>e.id===id)?.href,null);
  }
 });
 it("ne divulgue pas les rubriques sensibles à un utilisateur non autorisé",()=>{
  assert.equal(flatten("scrum",user).length,0);
 });
 it("traduit chaque rubrique et chaque état en français et en anglais",()=>{
  for(const lang of ["fr","en"] as const){
   for(const group of settingsCatalog("scrum",admin)){
    assert.ok(translate(lang,group.label));
    for(const item of group.entries){
     assert.ok(translate(lang,item.label));
     assert.ok(translate(lang,item.description));
    }
   }
  }
 });
});
