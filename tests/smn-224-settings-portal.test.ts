import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {activePrivateEntry,privateNavigation} from "../src/lib/private-navigation";
import {canAccess} from "../src/server/access-policy";
const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
describe("SMN-224 — portail Paramètres",()=>{
 it("conserve l'entrée sidebar engrenage sur le portail pour admin uniquement",()=>{
  const admin=privateNavigation("scrum","admin").flatMap(x=>x.entries);
  const user=privateNavigation("scrum","user").flatMap(x=>x.entries);
  assert.deepEqual(admin.filter(x=>x.id==="settings").map(x=>[x.href,x.icon]),[["/app/admin/settings","sliders"]]);
  assert.equal(user.some(x=>x.id==="settings"),false);
  assert.equal(activePrivateEntry("/app/admin/settings/general",admin.find(x=>x.id==="settings")!),true);
 });
 it("refuse la lecture des paramètres pour un utilisateur standard",()=>{
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},"read",{type:"settings",exists:true,inScope:true}),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},"read",{type:"settings",exists:true,inScope:true}),false);
 });
 it("garde les contrôles d'authentification des deux routes",()=>{
  for(const path of ["src/app/app/admin/settings/page.tsx","src/app/app/admin/settings/general/page.tsx"]){
   const source=file(path);
   assert.match(source,/currentAccount\(\)/);
   assert.match(source,/canAccess\(account,"read",\{type:"settings"/);
   assert.match(source,/redirect\("\/login"\)/);
  }
 });
 it("sépare portail et formulaire d'origine sans nouvelle écriture",()=>{
  const portal=file("src/app/app/admin/settings/page.tsx");
  const form=file("src/app/app/admin/settings/general/page.tsx");
  assert.match(portal,/settingsCatalog\(mode,account\)/);
  assert.match(portal,/<SettingsCatalogView groups=\{groups\}\/>/);
  assert.doesNotMatch(portal,/SettingsForm|fetch\(/);
  assert.match(form,/import SettingsForm from "\.\.\/settings-form"/);
  assert.match(form,/<SettingsForm\/>/);
  assert.match(form,/href="\/app\/admin\/settings"/);
  assert.doesNotMatch(form,/api\/admin\/settings/);
 });
 it("déclare les libellés du portail en FR et EN",()=>{
  for(const locale of ["fr","en"]){
   const labels=JSON.parse(file("src/i18n/"+locale+".json")).settingsPortal;
   for(const key of ["subtitle","groupGeneral","general","generalDescription"])
    assert.ok(typeof labels[key]==="string"&&labels[key].trim().length>0);
  }
 });
});
