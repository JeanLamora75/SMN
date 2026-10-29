import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {privateNavigation,activePrivateEntry,type NavigationIcon} from "../src/lib/private-navigation";
import {translate} from "../src/i18n/catalog";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const ids=["dashboard","members","cycles","centralCalendar","risks","links","reporting"];
const labels=["Tableau de Bord","Équipe","Sprint","Calendrier","Registre","Liens","Rapports"];

describe("SMN — navigation latérale, second lot (six menus et Paramètres)",()=>{
 it("ordonne exactement les six menus demandés, sans sous-rubriques supplémentaires",()=>{
  for(const role of ["admin","user"] as const){
   const groups=privateNavigation("scrum",role);
   assert.deepEqual(groups[0].entries.map(e=>e.id),ids);
   assert.deepEqual(groups[0].entries.map(e=>translate("fr",e.label)),labels);
   assert.equal(groups.length,role==="admin"?2:1);
   const all=groups.flatMap(g=>g.entries);
   assert.deepEqual(all.slice(0,7).map(e=>e.id),ids);
   assert.ok(!all.some(e=>["reviews","briefs","security","events"].includes(e.id)));
  }
 });
 it("conserve les destinations métier existantes sans fabriquer de page de rapports",()=>{
  const entries=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  assert.deepEqual(entries.map(e=>e.href),[
   "/app","/app/admin/members","/app/admin/sprints",
   "/app/team-calendar","/app/admin/registries","/app/admin/links","/app/reports","/app/admin/settings"
  ]);
  assert.equal(entries.filter(e=>e.id==="settings").length,1);
  assert.equal(activePrivateEntry("/app/admin/registries/example",entries[4]),true);
  assert.equal(activePrivateEntry("/app",entries[5]),false);
 });
 it("l'icône Registre est autorisée par NavigationIcon et réellement dessinée",()=>{
  const icon:NavigationIcon="stack";
  const register=privateNavigation("scrum","admin")[0].entries.find(e=>e.id==="risks");
  assert.equal(register?.icon,icon);
  const icons=read("src/app/app/bootstrap-icon.tsx");
  assert.ok(icons.includes('case "stack":'));
 });
 it("Paramètres figure dans le groupe final admin, et respecte les permissions",()=>{
  assert.deepEqual(privateNavigation("scrum","admin").at(-1)?.entries.map(e=>e.id),
   ["settings"]);
  assert.equal(privateNavigation("scrum","user").some(g=>g.entries.some(e=>e.id==="settings")),false);
  assert.equal(privateNavigation("kanban","admin").at(-1)?.entries[0].href,"/app/admin/settings");
 });
 it("affiche Périodes Kanban plutôt que Sprint lorsqu'un mode Kanban est actif",()=>{
  const scrum=privateNavigation("scrum","admin")[0].entries[2];
  const kanban=privateNavigation("kanban","admin")[0].entries[2];
  assert.equal(scrum.label,"navigation.entries.sprint");
  assert.equal(kanban.label,"navigation.entries.kanbanPeriods");
  assert.equal(kanban.href,null);
 });
 it("le composant installe une zone de bas de menu accessible",()=>{
  const component=read("src/app/app/private-navigation.tsx");
  assert.match(component,/group\.id==="admin"\?" smn-nav-group--footer"/);
  assert.match(component,/className="visually-hidden">\{t\(group\.label\)\}/);
  assert.match(component,/aria-current=\{activePrivateEntry\(pathname,entry\)\?"page"/);
 });
 it("séparation fine et alignement bas réels, replié et mobile",()=>{
  const css=read("src/app/dashboard.css");
  assert.match(css,/\.smn-private-layout \.smn-sidebar \{height:100%;min-height:0;\}/);
  assert.match(css,/\.smn-private-layout \.smn-private-navigation \{\s*display:flex;flex-direction:column;min-height:100%;/);
  assert.match(css,/\.smn-private-layout \.smn-private-navigation \.smn-nav-group--footer \{[\s\S]*?margin-top:auto;[\s\S]*?border-top:1px solid var\(--smn-border\)/);
  assert.match(css,/@media \(max-width:991\.98px\) \{[\s\S]*?\.smn-private-layout\.mobile-open \.smn-private-navigation \.smn-nav-group--footer/);
  assert.match(css,/\.smn-private-layout \.smn-private-nav-list \.smn-nav-label \{[\s\S]*?white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
 });
 it("les libellés restent courts dans les deux langues",()=>{
  for(const language of ["fr","en"] as const){
   const groups=privateNavigation("scrum","admin");
   for(const group of groups)for(const entry of group.entries){
    const label=translate(language,entry.label);
    assert.ok(label.length>0&&label.length<32);
    assert.doesNotMatch(label,/translation unavailable|traduction indisponible/i);
   }
  }
  assert.equal(translate("fr","navigation.entries.register"),"Registre");
  assert.equal(translate("fr","navigation.entries.settings"),"Paramètres");
  assert.equal(translate("en","navigation.entries.settings"),"Settings");
 });
});
