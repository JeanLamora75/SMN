import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {activePrivateEntry,privateNavigation} from "../src/lib/private-navigation";
import {canAccess} from "../src/server/access-policy";
import {translate} from "../src/i18n/catalog";
import {settingsCatalog} from "../src/lib/settings-catalog";

const actor=(role:"admin"|"user")=>({role,is_active:true,must_change_password:false});
const authorized=(type:"accounts"|"settings"|"members",role:"admin"|"user")=>
 canAccess(actor(role),"read",{type,exists:true,inScope:true});

describe("SMN-22 — navigation adaptée au rôle et au mode",()=>{
 it("affiche un groupe de sept entrées métiers et un groupe Paramètres pour admin",()=>{
  assert.deepEqual(privateNavigation("scrum","admin").map(group=>group.id),["pilotage","admin"]);
  assert.deepEqual(privateNavigation("scrum","user").map(group=>group.id),["pilotage"]);
  for(const role of ["admin","user"] as const){
   const main=privateNavigation("scrum",role)[0].entries;
   assert.deepEqual(main.map(e=>e.id),[
    "dashboard","members","cycles","centralCalendar","risks","links","reporting"
   ]);
   assert.equal(privateNavigation("scrum",role).flatMap(g=>g.entries)
    .filter(e=>e.id==="settings").length,role==="admin"?1:0);
  }
 });
 it("préserve les destinations actives et préserve les destinations Liens et Rapports existantes",()=>{
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation("scrum",role).flatMap(group=>group.entries);
   const paths=entries.filter(e=>e.href!==null).map(e=>e.href);
   assert.ok(paths.includes("/app"));
   assert.ok(paths.includes("/app/team-calendar"));
   assert.ok(paths.includes("/app/admin/registries"));
   assert.equal(paths.includes("/app/admin/settings"),role==="admin");
   assert.equal(entries.find(e=>e.id==="members")?.href,
    role==="admin"?"/app/admin/members":null);
   assert.equal(entries.find(e=>e.id==="reporting")?.href,"/app/reports");
   assert.equal(entries.find(e=>e.id==="links")?.href,role==="admin"?"/app/admin/links":null);
   assert.ok(!entries.some(e=>["events","security","reviews","briefs"].includes(e.id)));
   for(const entry of entries.filter(e=>e.href===null))
    assert.equal(activePrivateEntry("/app",entry),false);
  }
  assert.equal(settingsCatalog("scrum",actor("admin")).flatMap(g=>g.entries)
   .find(e=>e.id==="security")?.href,"/app/security");
 });
 it("maintient un libellé adapté aux modes Scrum, Kanban et inconnu",()=>{
  const scrum=privateNavigation("scrum","admin")[0].entries[2];
  const kanban=privateNavigation("kanban","admin")[0].entries[2];
  const unknown=privateNavigation(null,"admin")[0].entries[2];
  assert.equal(scrum.href,"/app/admin/sprints");
  assert.equal(scrum.label,"navigation.entries.sprint");
  assert.equal(kanban.href,null);
  assert.equal(kanban.label,"navigation.entries.kanbanPeriods");
  assert.equal(unknown.href,null);
  assert.equal(unknown.label,"navigation.entries.cyclesUnknown");
  assert.throws(()=>privateNavigation("safe" as never,"admin"),/navigation-mode-unsupported/);
  assert.throws(()=>privateNavigation("scrum","editor" as never),/navigation-role-unsupported/);
 });
 it("sélectionne les menus à partir de la route, même sur les sous-pages",()=>{
  const entries=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  const pairs:[string,string][]=[
   ["/app","dashboard"],
   ["/app/admin/members","members"],
   ["/app/admin/members/any","members"],
   ["/app/admin/sprints","cycles"],
   ["/app/admin/sprints/any","cycles"],
   ["/app/team-calendar","centralCalendar"],
   ["/app/team-calendar/meeting/template/any","centralCalendar"],
   ["/app/admin/registries","risks"],
   ["/app/admin/registries/any","risks"],
   ["/app/admin/settings","settings"],
   ["/app/admin/settings/general","settings"]
  ];
  for(const [path,id] of pairs)
   assert.deepEqual(entries.filter(e=>activePrivateEntry(path,e)).map(e=>e.id),[id]);
  for(const path of ["/app/security","/app/calendrier","/app/unknown"])
   assert.deepEqual(entries.filter(e=>activePrivateEntry(path,e)),[]);
 });
 it("centralise les intitulés en français et en anglais",()=>{
  for(const mode of ["scrum","kanban",null] as const)
   for(const group of privateNavigation(mode,"admin"))
    for(const locale of ["fr","en"] as const){
     assert.ok(translate(locale,group.label).trim());
     for(const entry of group.entries){
      const value=translate(locale,entry.label);
      assert.ok(value.trim());
      assert.doesNotMatch(value,/translation unavailable|traduction indisponible/i);
     }
    }
  assert.deepEqual(privateNavigation("scrum","admin")[0].entries
   .map(e=>translate("fr",e.label)),
   ["Tableau de Bord","Équipe","Sprint","Calendrier","Registre","Liens","Rapports"]);
  assert.equal(translate("fr","navigation.entries.settings"),"Paramètres");
 });
 it("conserve le contrôle d'accès serveur indépendamment de l'affichage des menus",()=>{
  for(const type of ["accounts","settings","members"] as const){
   assert.equal(authorized(type,"admin"),true);
   assert.equal(authorized(type,"user"),false);
   assert.equal(canAccess(actor("user"),"write",{type,exists:true,inScope:true}),false);
  }
 });
});
