import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {activePrivateEntry,privateNavigation} from "../src/lib/private-navigation";
import {canAccess} from "../src/server/access-policy";
import {translate} from "../src/i18n/catalog";
import {settingsCatalog} from "../src/lib/settings-catalog";

const actor=(role:"admin"|"user")=>({role,is_active:true,must_change_password:false});
const authorized=(type:"accounts"|"settings"|"members",role:"admin"|"user")=>
 canAccess(actor(role),"read",{type,exists:true,inScope:true});

describe("SMN-22 — navigation adaptée au rôle et au mode (sidebar revu)",()=>{
 it("conserve les domaines métier et présente d'abord le pilotage utile",()=>{
  assert.deepEqual(privateNavigation("scrum","admin").map(group=>group.id),
   ["pilotage","cycles","registers","reports","admin"]);
  assert.deepEqual(privateNavigation("scrum","user").map(group=>group.id),
   ["pilotage","cycles","registers","reports"]);
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation("scrum",role).flatMap(g=>g.entries);
   assert.deepEqual(entries.slice(0,3).map(e=>e.id),
    ["dashboard","members","centralCalendar"]);
  }
 });
 it("ne propose que les vraies routes et ne réintroduit ni Sécurité ni Événements Agile",()=>{
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation("scrum",role).flatMap(group=>group.entries);
   const links=entries.filter(entry=>entry.href!==null).map(entry=>entry.href);
   assert.ok(links.includes("/app"));
   assert.ok(links.includes("/app/team-calendar"));
   assert.equal(links.includes("/app/security"),false);
   assert.equal(entries.some(e=>e.id==="events"||e.id==="security"),false);
   assert.equal(links.includes("/app/admin/users"),false);
   assert.equal(links.includes("/app/admin/settings"),role==="admin");
   assert.equal(links.includes("/app/admin/audit"),false);
   assert.equal(links.includes("/app/admin/members"),role==="admin");
   for(const entry of entries.filter(entry=>entry.href===null))
    assert.equal(activePrivateEntry("/app",entry),false);
  }
  // Route de sécurité déplacée dans le catalogue Paramètres, pas supprimée.
  const settings=settingsCatalog("scrum",actor("admin")).flatMap(g=>g.entries);
  assert.equal(settings.find(e=>e.id==="security")?.href,"/app/security");
 });
 it("adapte les cycles sans simuler de fonctions SAFe/ART dans le MVP",()=>{
  const scrum=privateNavigation("scrum","user");
  const kanban=privateNavigation("kanban","user");
  assert.equal(scrum.find(g=>g.id==="cycles")!.entries[0].label,"navigation.entries.sprints");
  assert.equal(kanban.find(g=>g.id==="cycles")!.entries[0].label,"navigation.entries.kanbanPeriods");
  assert.equal(scrum.find(g=>g.id==="cycles")!.entries[0].href,"/app/admin/sprints");
  assert.equal(kanban.find(g=>g.id==="cycles")!.entries[0].href,null);
  for(const groups of [scrum,kanban]){
   const entries=groups.flatMap(g=>g.entries);
   assert.equal(entries.find(e=>e.id==="centralCalendar")?.href,"/app/team-calendar");
   for(const entry of entries.filter(e=>["reviews","reporting","briefs"].includes(e.id)))
    assert.equal(entry.href,null);
  }
 });
 it("n'invente pas un mode si le contexte Scrum/Kanban est indisponible",()=>{
  const groups=privateNavigation(null,"user");
  assert.equal(groups.find(g=>g.id==="cycles")!.entries[0].label,
   "navigation.entries.cyclesUnknown");
  assert.throws(()=>privateNavigation("safe" as never,"admin"),/navigation-mode-unsupported/);
  assert.throws(()=>privateNavigation("scrum","editor" as never),/navigation-role-unsupported/);
 });
 it("calcule l'entrée active, y compris la nouvelle navigation Calendrier",()=>{
  const entries=privateNavigation("scrum","admin").flatMap(g=>g.entries);
  for(const [path,id] of [
   ["/app","dashboard"],["/app/admin/settings","settings"],
   ["/app/admin/members","members"],["/app/team-calendar","centralCalendar"],
   ["/app/team-calendar/meeting/template/any","centralCalendar"],
   ["/app/admin/sprints/any","cycles"],["/app/admin/registries/any","risks"]
  ]){
   assert.deepEqual(entries.filter(e=>activePrivateEntry(path,e)).map(e=>e.id),[id]);
  }
  for(const path of ["/app/security","/app/calendrier","/app/unknown"])
   assert.deepEqual(entries.filter(e=>activePrivateEntry(path,e)),[]);
 });
 it("centralise la traduction des menus FR/EN et garde les libellés courts",()=>{
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
  assert.equal(translate("fr","navigation.entries.calendar"),"Calendrier");
 });
 it("fait toujours prévaloir l'autorisation serveur sur le menu",()=>{
  for(const type of ["accounts","settings","members"] as const){
   assert.equal(authorized(type,"admin"),true);
   assert.equal(authorized(type,"user"),false);
   assert.equal(canAccess(actor("user"),"write",{type,exists:true,inScope:true}),false);
  }
 });
});
