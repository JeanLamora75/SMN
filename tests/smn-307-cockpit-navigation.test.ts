import assert from "node:assert/strict";
import test from "node:test";
import {privateNavigation,activePrivateEntry} from "../src/lib/private-navigation";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

test("Liens appears between Registre and Rapports for admin",()=>{
 const entries=privateNavigation("scrum","admin")[0].entries;
 const ids=entries.map(e=>e.id);
 assert.ok(ids.indexOf("risks")<ids.indexOf("links"));
 assert.ok(ids.indexOf("links")<ids.indexOf("reporting"));
 const link=entries.find(e=>e.id==="links");
 assert.equal(link?.href,"/app/admin/links");
 assert.equal(link?.icon,"link-45deg");
 assert.ok(link&&activePrivateEntry("/app/admin/links",link));
});
test("user navigation does not expose a link to an unauthorized page",()=>{
 const entry=privateNavigation("scrum","user")[0].entries.find(e=>e.id==="links");
 assert.equal(entry?.href,null);
});
test("Cockpit translations exist in both languages",()=>{
 for(const key of Object.keys(fr.links) as (keyof typeof fr.links)[]){
  assert.equal(typeof en.links[key],"string",key);
  assert.ok(en.links[key].trim()&&fr.links[key].trim(),key);
 }
 assert.equal(fr.navigation.entries.links,"Liens");
 assert.equal(en.navigation.entries.links,"Links");
});
