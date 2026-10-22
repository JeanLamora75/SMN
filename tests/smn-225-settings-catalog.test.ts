import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {translate} from "../src/i18n/catalog";
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const flatten=(mode:"scrum"|"kanban"|null,actor=admin)=>settingsCatalog(mode,actor).flatMap(g=>g.entries);
describe("SMN-225 — Catalogue des Paramètres",()=>{
 it("expose exactement 14 rubriques dans les 4 familles attendues",()=>{
  const groups=settingsCatalog("scrum",admin);
  assert.deepEqual(groups.map(x=>x.id),["application","agile","calendar","administration"]);
  assert.deepEqual(groups.map(g=>g.entries.map(e=>e.id)),[
   ["general","languages","appearance"],
   ["cadence","ceremonies","capacity"],
   ["workingDays","countries","closures","absences"],
   ["users","security","backups","audit"]
  ]);
 });
 it("n'invente aucun lien pour les fonctions manquantes ou partiellement accessibles",()=>{
  const entries=flatten("scrum");
  for(const id of ["languages","appearance","ceremonies","capacity","workingDays"]){
   assert.equal(entries.find(e=>e.id===id)?.href,null);
  }
  assert.equal(entries.find(e=>e.id==="workingDays")?.status,"planned");
  assert.equal(entries.find(e=>e.id==="capacity")?.status,"partial");
  assert.equal(entries.find(e=>e.id==="general")?.href,"/app/admin/settings/general");
  assert.equal(entries.some(e=>["integrations","notifications"].includes(e.id)),false);
 });
 it("respecte le mode Kanban sans retirer les rubriques du catalogue",()=>{
  const entries=flatten("kanban");
  for(const id of ["cadence","ceremonies"]){
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
