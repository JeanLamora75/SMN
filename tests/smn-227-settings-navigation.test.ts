import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {privateNavigation} from "../src/lib/private-navigation";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {canAccess} from "../src/server/access-policy";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
describe("SMN-227 — centralisation des accès sans perte",()=>{
 it("préserve les menus opérationnels sans doubler la sécurité des Paramètres",()=>{
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation("scrum",role).flatMap(g=>g.entries);
   assert.equal(entries.some(e=>e.id==="security"),false);
   assert.equal(entries.some(e=>e.id==="events"),false);
   assert.equal(entries.find(e=>e.id==="centralCalendar")?.href,"/app/team-calendar");
   assert.equal(entries.find(e=>e.id==="members")?.href,role==="admin"?"/app/admin/members":null);
   assert.equal(entries.find(e=>e.id==="cycles")?.href,"/app/admin/sprints");
  }
 });
 it("conserve un seul accès paramètres dans la sidebar admin",()=>{
  const entries=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  assert.deepEqual(entries.filter(e=>e.id==="settings").map(e=>e.href),["/app/admin/settings"]);
  assert.equal(settingsCatalog("scrum",admin).flatMap(g=>g.entries)
   .find(e=>e.id==="security")?.href,"/app/security");
  for(const id of ["users","scrumCadence","backups","audit","countries"])
   assert.equal(entries.some(e=>e.id===id),false);
 });
 it("regroupe Langues et Apparence sans retirer leurs ancres historiques",()=>{
  const items=settingsCatalog("scrum",admin).flatMap(g=>g.entries);
  assert.equal(items.find(x=>x.id==="preferences")?.href,"/app/admin/settings/general");
  assert.equal(items.some(x=>x.id==="languages"||x.id==="appearance"),false);
  const form=read("src/app/app/admin/settings/settings-form.tsx");
  for(const anchor of ["settings-language","settings-appearance"])
   assert.ok(form.includes('id="'+anchor+'"'));
  assert.equal(items.find(x=>x.id==="capacity")?.href,null);
  assert.equal(items.find(x=>x.id==="workingDays")?.href,"/app/admin/settings/working-days");
  assert.equal(items.find(x=>x.id==="ceremonies")?.href,"/app/admin/settings/ceremonies");
 });
 it("fournit retour vers paramètres sans modifier les APIs ou formulaires",()=>{
  for(const path of ["countries","company-closures","absence-categories","users","backups","audit","scrum-cadence","settings/working-days","settings/ceremonies"]){
   const page=read("src/app/app/admin/"+path+"/page.tsx");
   assert.ok(page.includes('href="/app/admin/settings"'),path);
  }
  assert.ok(read("src/app/app/security/page.tsx").includes('account.role==="admin"'));
  assert.ok(read("src/app/app/admin/settings/general/page.tsx").includes("<SettingsForm/>"));
 });
 it("conserve les autorisations directes",()=>{
  for(const kind of ["accounts","backups","audit","settings"]){
   assert.equal(canAccess(user,"read",{type:kind,exists:true,inScope:true}),false);
   assert.equal(canAccess(admin,"read",{type:kind,exists:true,inScope:true}),true);
  }
  assert.ok(read("src/app/app/security/page.tsx").includes("<PasswordChangeForm/>"));
 });
});
