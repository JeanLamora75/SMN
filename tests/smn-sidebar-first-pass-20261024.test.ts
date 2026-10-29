import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {activePrivateEntry,privateNavigation} from "../src/lib/private-navigation";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {translate} from "../src/i18n/catalog";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("Refonte UX du panneau latéral — premier lot",()=>{
 it("conserve Tableau de Bord et Équipe puis insère Sprint avant Calendrier",()=>{
  for(const role of ["admin","user"] as const){
   const menu=privateNavigation("scrum",role).flatMap(g=>g.entries);
   assert.deepEqual(menu.slice(0,4).map(e=>e.id),
    ["dashboard","members","cycles","centralCalendar"]);
   assert.deepEqual(menu.slice(0,4).map(e=>e.href),
    ["/app",role==="admin"?"/app/admin/members":null,"/app/admin/sprints","/app/team-calendar"]);
  }
 });
 it("retire Sécurité du compte et Événements Agile sans supprimer leurs routes",()=>{
  for(const mode of ["scrum","kanban",null] as const)
   for(const role of ["admin","user"] as const){
    const all=privateNavigation(mode,role).flatMap(group=>group.entries);
    assert.ok(!all.some(e=>e.id==="security"||e.id==="events"));
   }
  const allSettings=settingsCatalog("scrum",{
   role:"admin",is_active:true,must_change_password:false
  }).flatMap(g=>g.entries);
  assert.equal(allSettings.find(e=>e.id==="security")?.href,"/app/security");
 });
 it("n'utilise pas d'anciennes icônes Unicode pour les entrées principales",()=>{
  const entries=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  assert.equal(entries[0].icon,"house-fill");
  assert.equal(entries[1].icon,"people-fill");
  assert.equal(entries[2].icon,"calendar-check");
  assert.equal(entries[3].icon,"calendar3");
  assert.ok(entries.every(e=>!/[♙♧◫▤◷◇◈⚙▦]/.test(e.icon)));
  const jsx=read("src/app/app/private-navigation.tsx");
  assert.match(jsx,/<BootstrapIcon name=\{entry.icon\}/);
  assert.doesNotMatch(jsx,/smn-nav-workspace|navigation\.contextUnavailable/);
 });
 it("conserve le bon libellé FR/EN sans couper un mot en deux",()=>{
  for(const lang of ["fr","en"] as const){
   const items=privateNavigation("scrum","admin").flatMap(g=>g.entries);
   for(const entry of items){
    const label=translate(lang,entry.label);
    assert.notEqual(label,"Traduction indisponible.");
    assert.notEqual(label,"Translation unavailable.");
   }
  }
  assert.deepEqual(privateNavigation("scrum","admin")[0].entries
   .map(e=>translate("fr",e.label)),
    ["Tableau de Bord","Équipe","Sprint","Calendrier","Registre","Liens","Rapports"]);
  const css=read("src/app/dashboard.css");
  assert.match(css,/smn-nav-label[^{]*\{[^}]*white-space:nowrap/);
  assert.match(css,/smn-nav-label[^{]*\{[^}]*text-overflow:ellipsis/);
  assert.match(css,/smn-nav-icon svg[^{]*\{[^}]*width:22px/);
 });
 it("préserve les entrées actives et la navigation repliée/mobile",()=>{
  const items=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  for(const [url,id] of [["/app","dashboard"],
    ["/app/admin/members","members"],
    ["/app/team-calendar","centralCalendar"],
    ["/app/team-calendar/meeting/template/id","centralCalendar"]]){
   assert.deepEqual(items.filter(e=>activePrivateEntry(url,e)).map(e=>e.id),[id]);
  }
  assert.ok(items.some(e=>e.id==="cycles"));
  assert.ok(items.some(e=>e.id==="risks"));
  assert.ok(items.some(e=>e.id==="settings"));
  const css=read("src/app/dashboard.css");
  assert.match(css,/is-collapsed.*smn-nav-label/);
  assert.match(css,/@media \(max-width:991\.98px\)/);
  const shell=read("src/app/app/private-shell.tsx");
  assert.match(shell,/setCollapsed\(value=>!value\)/);
  assert.match(shell,/setMobileOpen\(value=>!value\)/);
 });
});
