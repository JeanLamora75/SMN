import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {activePrivateEntry,privateNavigation} from "../src/lib/private-navigation";
import {canAccess} from "../src/server/access-policy";
import {translate} from "../src/i18n/catalog";

const actor=(role:"admin"|"user")=>({role,is_active:true,must_change_password:false});
const authorized=(type:"accounts"|"settings",role:"admin"|"user")=>
  canAccess(actor(role),"read",{type,exists:true,inScope:true});

describe("SMN-22 — navigation adaptée au rôle et au mode",()=>{
  it("groupe les six domaines pour l'administrateur et seulement cinq pour l'utilisateur",()=>{
    assert.deepEqual(privateNavigation("scrum","admin").map(group=>group.id),
      ["pilotage","calendar","cycles","registers","reports","admin"]);
    assert.deepEqual(privateNavigation("scrum","user").map(group=>group.id),
      ["pilotage","calendar","cycles","registers","reports"]);
  });
  it("conserve une navigation réelle sur les pages livrées et masque les liens d'administration pour l'utilisateur",()=>{
    for(const role of ["user","admin"] as const){
      const entries=privateNavigation("scrum",role).flatMap(group=>group.entries);
      const links=entries.filter(entry=>entry.href!==null).map(entry=>entry.href);
      assert.ok(links.includes("/app"));
      assert.ok(links.includes("/app/security"));
      assert.equal(links.includes("/app/admin/users"),role==="admin");
      assert.equal(links.includes("/app/admin/settings"),role==="admin");
      for(const entry of entries.filter(entry=>entry.href===null))
        assert.equal(activePrivateEntry("/app",entry),false);
    }
  });
  it("adapte les cycles sans jamais proposer une fonction SAFe/ART dans le MVP",()=>{
    const scrum=privateNavigation("scrum","user");
    const kanban=privateNavigation("kanban","user");
    assert.equal(scrum.find(group=>group.id==="cycles")!.entries[0].label,"navigation.entries.sprints");
    assert.equal(kanban.find(group=>group.id==="cycles")!.entries[0].label,"navigation.entries.kanbanPeriods");
    for(const groups of [scrum,kanban]){
      const text=JSON.stringify(groups);
      assert.doesNotMatch(text,/safe|art|train/i);
      for(const future of groups.flatMap(group=>group.entries).filter(entry=>entry.id!=="dashboard"&&entry.id!=="security"))
        assert.equal(future.href,null,"Aucun module futur ne peut être présenté comme actif");
    }
  });
  it("n'invente pas le mode Scrum en cas de contexte indisponible",()=>{
    const groups=privateNavigation(null,"user");
    assert.equal(groups.find(group=>group.id==="cycles")!.entries[0].label,"navigation.entries.cyclesUnknown");
    assert.throws(()=>privateNavigation("safe" as never,"admin"),/navigation-mode-unsupported/);
    assert.throws(()=>privateNavigation("scrum","editor" as never),/navigation-role-unsupported/);
  });
  it("calcule l'entrée active sans donner un état actif aux écrans non livrés",()=>{
    const links=privateNavigation("kanban","admin").flatMap(group=>group.entries);
    for(const pathname of ["/app","/app/security","/app/admin/users","/app/admin/settings"]){
      assert.deepEqual(links.filter(entry=>activePrivateEntry(pathname,entry)).map(entry=>entry.href),[pathname]);
    }
    assert.deepEqual(links.filter(entry=>activePrivateEntry("/app/calendrier",entry)),[]);
    assert.deepEqual(links.filter(entry=>activePrivateEntry("/app/unknown",entry)),[]);
  });
  it("centralise tous les libellés du menu en français et en anglais",()=>{
    for(const mode of ["scrum","kanban",null] as const){
      for(const group of privateNavigation(mode,"admin")){
        for(const locale of ["fr","en"] as const){
          const label=translate(locale,group.label);
          assert.notEqual(label,"Traduction indisponible.");
          assert.notEqual(label,"Translation unavailable.");
          for(const entry of group.entries){
            const text=translate(locale,entry.label);
            assert.ok(text.trim());
            assert.doesNotMatch(text,/translation unavailable|traduction indisponible/i);
          }
        }
      }
    }
  });
  it("fait prévaloir les droits serveur même si une URL d'administration est connue",()=>{
    for(const type of ["accounts","settings"] as const){
      assert.equal(authorized(type,"admin"),true);
      assert.equal(authorized(type,"user"),false);
      assert.equal(canAccess(actor("user"),"write",{type,exists:true,inScope:true}),false);
    }
  });
});
