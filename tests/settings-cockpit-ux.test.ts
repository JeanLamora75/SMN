import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const admin={role:"admin",is_active:true,must_change_password:false};

describe("Centre Paramètres Cockpit — contrats structurels",()=>{
 it("présente douze cartes sans recherche globale",()=>{
  const groups=settingsCatalog("scrum",admin);
  assert.deepEqual(groups.map(g=>g.entries.length),[1,5,3,3]);
  assert.equal(groups.flatMap(g=>g.entries).length,12);
  const view=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  assert.doesNotMatch(view,/placeholder=.*[Rr]echerch/);
 });
 it("conserve le mode et les liens actifs du catalogue",()=>{
  const scrum=settingsCatalog("scrum",admin).flatMap(g=>g.entries);
  const kanban=settingsCatalog("kanban",admin).flatMap(g=>g.entries);
  assert.equal(scrum.find(x=>x.id==="cadence")?.href,"/app/admin/scrum-cadence");
  assert.equal(kanban.find(x=>x.id==="cadence")?.href,"/app/admin/kanban-cadence");
  assert.equal(scrum.find(x=>x.id==="capacity")?.href,null);
  assert.equal(scrum.find(x=>x.id==="maintenance")?.href,"/app/admin/settings/maintenance");
 });
 it("emploie des onglets pour les contenus indépendants",()=>{
  for(const page of ["registries","working-days","holidays-closures","maintenance"]){
   assert.match(source("src/app/app/admin/settings/"+page+"/page.tsx"),/<SettingsTabs/);
  }
 });
 it("conserve les identifiants historiques et cache les champs hors onglet",()=>{
  const form=source("src/app/app/admin/settings/settings-form.tsx");
  assert.match(form,/id="settings-language"/);
  assert.match(form,/id="settings-appearance"/);
  assert.match(form,/d-none/);
  assert.match(form,/useUnsavedChanges/);
 });
 it("conserve les permissions distinctes du journal et des sauvegardes",()=>{
  const maintenance=source("src/app/app/admin/settings/maintenance/page.tsx");
  assert.match(maintenance,/type:"backups"/);
  assert.match(maintenance,/type:"audit"/);
  assert.match(maintenance,/readAuditJournal/);
  assert.match(maintenance,/AuditJournalView/);
  const legacy=source("src/app/app/admin/audit/page.tsx");
  assert.match(legacy,/AuditJournalView/);
  const view=source("src/app/app/admin/audit/audit-journal-view.tsx");
  assert.match(view,/audit.operationId/);
  assert.match(view,/audit.fields/);
 });
 it("traduit les onglets dans les deux langues",()=>{
  for(const lang of ["fr","en"]){
   const tabs=JSON.parse(source("src/i18n/"+lang+".json")).settingsCatalog.tabs;
   for(const name of ["general","language","appearance","slots","lunch","categories","alerts"])
    assert.ok(typeof tabs[name]==="string"&&tabs[name].length>0);
  }
 });
});
