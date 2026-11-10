import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {filterSettingsGroups,normalizeSettingsQuery} from "../src/lib/settings-catalog-search";
import {translate} from "../src/i18n/catalog";

const admin={role:"admin" as const,is_active:true,must_change_password:false};
const user={role:"user" as const,is_active:true,must_change_password:false};
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("SMN-434 — Paramètres V2 et internationalisation exhaustive",()=>{
 it("fournit exactement six groupes et 19 entrées sans doublon",()=>{
  const groups=settingsCatalog("scrum",admin);
  assert.deepEqual(groups.map(group=>group.id),[
   "application","organization","practices","calendar","reports","administration"
  ]);
  const entries=groups.flatMap(group=>group.entries);
  assert.equal(entries.length,19);
  assert.equal(new Set(entries.map(entry=>entry.id)).size,19);
  for(const id of ["companies","closures","indicators","chartStyles"])
   assert.equal(entries.filter(e=>e.id===id).length,1);
 });
 it("préserve les destinations existantes et distingue Scrum de Kanban",()=>{
  const scrum=settingsCatalog("scrum",admin).flatMap(g=>g.entries);
  const kanban=settingsCatalog("kanban",admin).flatMap(g=>g.entries);
  const get=(id:string)=>scrum.find(x=>x.id===id);
  assert.equal(get("languages")?.href,"/app/admin/settings/general#settings-language");
  assert.equal(get("appearance")?.href,"/app/admin/settings/general#settings-appearance");
  assert.equal(get("holidays")?.href,"/app/admin/settings/holidays-closures#holidays");
  assert.equal(get("closures")?.href,"/app/admin/settings/holidays-closures#closures");
  assert.equal(get("maintenance")?.href,"/app/admin/settings/maintenance");
  assert.equal(get("capacity")?.href,null);
  assert.equal(get("cadence")?.href,"/app/admin/scrum-cadence");
  assert.equal(kanban.find(x=>x.id==="cadence")?.href,"/app/admin/kanban-cadence");
  for(const id of ["ceremonies","workingDays"]){
   assert.equal(kanban.find(x=>x.id===id)?.href,null);
   assert.equal(kanban.find(x=>x.id===id)?.status,"not-applicable");
  }
 });
 it("ne transmet aucune rubrique à un utilisateur non autorisé",()=>{
  assert.deepEqual(settingsCatalog("scrum",user),[]);
  assert.deepEqual(filterSettingsGroups(settingsCatalog("scrum",user),
   "sauvegarde",key=>translate("fr",key)),[]);
 });
 it("recherche sur titres, descriptions et mots clés traduits, sans accent ni casse",()=>{
  for(const locale of ["fr","en"] as const){
   const groups=settingsCatalog("scrum",admin);
   const search=(q:string)=>filterSettingsGroups(groups,q,key=>translate(locale,key))
    .flatMap(group=>group.entries.map(item=>item.id));
   assert.deepEqual(search(locale==="fr"?"CÉRÉMONIE":"ceremony"),["ceremonies"]);
   assert.deepEqual(search(locale==="fr"?"miSes a jouR":"updates"),["maintenance"]);
   assert.deepEqual(search(locale==="fr"?"styles graphiques":"chart styles"),["chartStyles"]);
   assert.deepEqual(search("nonexistent-settings-term"),[]);
   assert.equal(search(" ").length,19);
  }
  assert.equal(normalizeSettingsQuery("  ÉTÉ   AgIlE  "),"ete agile");
 });
 it("garantit la parité de toutes les clés consommées par le catalogue et les contrôles UI",()=>{
  const fr=JSON.parse(read("src/i18n/fr.json")).settingsCatalog;
  const en=JSON.parse(read("src/i18n/en.json")).settingsCatalog;
  const groups=settingsCatalog("scrum",admin);
  for(const locale of ["fr","en"] as const){
   for(const group of groups){
    const name=translate(locale,group.label);
    assert(name.length>0&&!name.includes("Translation unavailable"));
    for(const entry of group.entries){
     for(const key of [entry.label,entry.description,entry.keywords]){
      const message=translate(locale,key);
      assert(message.length>0,locale+" "+key);
     }
    }
   }
  }
  for(const key of ["label","placeholder","clear","results","empty","reset"]){
   assert.equal(typeof fr.search[key],"string");
   assert.equal(typeof en.search[key],"string");
  }
  for(const key of ["back","adminEyebrow","indicatorsTitle","indicatorsDescription"]){
   assert.equal(typeof fr.navigation[key],"string");
   assert.equal(typeof en.navigation[key],"string");
  }
  assert.deepEqual(Object.keys(fr.keywords).sort(),Object.keys(en.keywords).sort());
  assert.equal(Object.keys(fr.keywords).length,19);
  for(const k of Object.keys(fr.keywords)){
   assert(fr.keywords[k].trim().length>0);
   assert(en.keywords[k].trim().length>0);
  }
 });
 it("interdit les textes visibles codés en dur et les accès directs aux API depuis le portail",()=>{
  const view=read("src/app/app/admin/settings/settings-catalog-view.tsx");
  const page=read("src/app/app/admin/settings/page.tsx");
  assert.doesNotMatch(view,/showCompanies|Gestion des entreprises|Fermetures d’entreprise|Disponible/);
  assert.match(view,/t\("settingsCatalog\.search\.placeholder"\)/);
  assert.match(view,/t\("settingsCatalog\.search\.empty"\)/);
  assert.match(view,/t\("settingsCatalog\.search\.clear"\)/);
  assert.match(view,/t\("settingsCatalog\.search\.results",\{count:matches\}\)/);
  assert.match(view,/t\("settingsCatalog\.view\.cards"\)/);
  assert.match(view,/t\("settingsCatalog\.view\.list"\)/);
  assert.match(page,/<SettingsCatalogView groups=\{groups\}\/>/);
  assert.doesNotMatch(view,/fetch\(|method:"(POST|PATCH|PUT|DELETE)"/);
 });
});
