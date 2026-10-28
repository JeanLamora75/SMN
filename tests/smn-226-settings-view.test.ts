import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
describe("SMN-226 — modes Cartes/Liste du catalogue",()=>{
 it("repose sur une clé indépendante d'Équipe",()=>{
  const settings=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  const team=source("src/app/app/admin/members/team-overview.tsx");
  assert.match(settings,/smn-settings-catalog-view/);
  assert.match(team,/smn-team-roster-view/);
  assert.doesNotMatch(settings,/smn-team-roster-view/);
 });
 it("sélectionne cartes par défaut, restaure et mémorise la préférence",()=>{
  const view=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  assert.match(view,/value==="list"\?"list":"cards"/);
  assert.match(view,/useState<View>\("cards"\)/);
  assert.match(view,/localStorage\.getItem\(SETTINGS_VIEW_STORAGE_KEY\)/);
  assert.match(view,/localStorage\.setItem\(SETTINGS_VIEW_STORAGE_KEY,next\)/);
 });
 it("utilise les mêmes rubriques et les mêmes liens pour les deux vues",()=>{
  const view=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  assert.match(view,/groups\.map\(group=>/);
  assert.match(view,/group\.entries\.map\(entry=>/);
  assert.match(view,/view==="cards"\?"row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3":"d-grid gap-2"/);
  assert.match(view,/entry\.href\?<Link href=\{entry\.href\}/);
  assert.equal(settingsCatalog("scrum",{role:"admin",is_active:true,must_change_password:false})
   .flatMap(g=>g.entries).length,12);
 });
 it("annonce les boutons et leur sélection aux technologies d'assistance",()=>{
  const view=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  assert.match(view,/aria-pressed=\{view==="cards"\}/);
  assert.match(view,/aria-pressed=\{view==="list"\}/);
  assert.match(view,/aria-label=\{t\("settingsCatalog\.view\.cards"\)\}/);
  assert.match(view,/aria-label=\{t\("settingsCatalog\.view\.list"\)\}/);
 });
 it("fournit des libellés FR/EN et ne modifie aucune donnée métier",()=>{
  const view=source("src/app/app/admin/settings/settings-catalog-view.tsx");
  assert.doesNotMatch(view,/fetch\(|method:"(PATCH|POST|PUT|DELETE)"/);
  for(const locale of ["fr","en"]){
   const labels=JSON.parse(source("src/i18n/"+locale+".json")).settingsCatalog.view;
   for(const key of ["switchLabel","cards","list"])assert.ok(labels[key]);
  }
 });
});
