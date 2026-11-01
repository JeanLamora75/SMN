import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=process.cwd();
const read=(path:string)=>readFileSync(root+"/"+path,"utf8");
const ui=read("src/app/app/admin/indicators/catalog-client.tsx");
const page=read("src/app/app/admin/indicators/page.tsx");
const api=read("src/app/api/admin/indicators/catalog/route.ts");
const server=read("src/server/indicators/catalog.ts");
const fr=JSON.parse(read("src/i18n/fr.json")) as Record<string,Record<string,unknown>>;
const en=JSON.parse(read("src/i18n/en.json")) as Record<string,Record<string,unknown>>;
test("SMN-347 : écrans catalogue, équipe, préférences, accessible au clavier",()=>{
 assert.match(ui,/SettingsTabs/);
 for(const key of ["catalog","selections","preferences"])assert.ok(ui.includes('id:"'+key+'"'));
 for(const key of ["dashboard","cycle_list","cycle_detail","trends","reports"])assert.ok(ui.includes('"'+key+'"'));
 assert.match(ui,/type="search"/);assert.match(ui,/table-responsive/);
 assert.match(ui,/aria-label=/);assert.match(ui,/role="alert"/);
 assert.match(ui,/window.confirm/);
 assert.match(ui,/type="checkbox"/);
 assert.match(page,/TeamGrants/);
 assert.match(api,/authorizeApi/);
 assert.match(api,/actorFor/);
 assert.match(api,/sessionAccount/);
 assert.match(page,/indicatorTeams/);
 assert.match(server,/requireIndicatorTeam/);
 assert.match(server,/FOR UPDATE/);
 assert.match(server,/archived_at IS NULL/);
});
test("SMN-347 : les catalogues FR et EN sont complets et de même forme",()=>{
 const f=fr.indicators,e=en.indicators;
 for(const key of ["title","catalog","selections","preferences","team","search","filter","all",
  "active","archived","create","edit","archive","confirmArchive","tag","name","type",
  "actions","manual","computed","selected","visible","order","style","error","retry",
  "empty","editor","formula","description","cancel","save","unit","shortUnit","color","icon"]){
  assert.equal(typeof f[key],"string","FR "+key);
  assert.equal(typeof e[key],"string","EN "+key);
  assert.ok(String(f[key]).length>0);assert.ok(String(e[key]).length>0);
 }
 for(const key of ["dashboard","cycle_list","cycle_detail","trends","reports"]){
  assert.equal(typeof (f.screen as Record<string,unknown>)[key],"string");
  assert.equal(typeof (e.screen as Record<string,unknown>)[key],"string");
 }
});
