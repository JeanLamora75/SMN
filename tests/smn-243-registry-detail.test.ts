import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registryDetailTabs,registryBusinessTabKeys} from "../src/lib/registry-detail-tabs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("les six catégories ont toujours Synthèse, Relations et Historique",()=>{
 for(const type of ["risk","obstacle","dependency","decision","action","highlight"] as const){
  const tabs=registryDetailTabs(type);
  assert.equal(tabs[0],"summary");assert.ok(tabs.includes("relations"));assert.equal(tabs.at(-1),"history");
 }
});
test("l'onglet métier est conditionnel et jamais fictif sur un fait marquant",()=>{
 assert.deepEqual(registryDetailTabs("highlight"),["summary","relations","history"]);
 for(const type of ["risk","obstacle","dependency","decision","action"] as const){
  assert.ok(registryDetailTabs(type).includes("business"));
  assert.equal(typeof registryBusinessTabKeys[type],"string");
 }
});
test("la route directe réutilise les règles serveur d'autorisation et n'ouvre aucun historique à user",()=>{
 const page=read("src/app/app/admin/registries/[id]/page.tsx");
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(page,/canAccess\(actor,"read",\{type:"collective",exists:true,inScope:true\}\)/);
 assert.match(page,/RegistryDetail/);
 assert.match(detail,/canManage&&<RegistryHistory/);
 assert.match(detail,/!canManage\?/);
 assert.match(detail,/fetch\("\/api\/admin\/registries\/"/);
});
test("bandeau identité visible sans nom individuel interdit au rôle user",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 for(const marker of ["BootstrapIcon","item.title","label(item.type)","label(item.status)","item.dueOn&&","canManage&&item.owner"])
  assert.ok(ui.includes(marker),marker);
 assert.match(ui,/smn-registry-detail-header/);
});
test("onglets accessibles au clavier avec ids reliés et activation par flèches",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(ui,/role="tablist"/);assert.match(ui,/role="tab"/);
 assert.match(ui,/role="tabpanel"/);assert.match(ui,/aria-selected/);
 assert.match(ui,/aria-controls/);assert.match(ui,/aria-labelledby/);
 assert.match(ui,/ArrowRight/);assert.match(ui,/ArrowLeft/);
 assert.match(ui,/Home/);assert.match(ui,/End/);
});
test("composants métier existants réemployés, édition legacy conservée aux seuls administrateurs",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 for(const c of ["RiskAssessment","RiskRoam","MaterializeRisk","DependencyParties","DependencyVigilance",
  "DecisionDetail","DecisionActions","ActionLinks","RegistryCycles","RegistryRelations","RegistryCreate"])
  assert.ok(ui.includes("<"+c),c);
 assert.match(ui,/canManage&&<button/);
 assert.match(ui,/canManage=\{false\}/);
});
test("la synthèse ne présente pas un faux journal et ne duplique pas le bandeau",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(ui,/item\.description/);
 assert.ok(!ui.includes("fakeEntry"));
 assert.ok(!ui.includes("history.map"));
 assert.match(ui,/registryDetail\.legacyComment/);
});
test("FR/EN: les onglets et états ont les mêmes clés",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).registryDetail;
 const en=JSON.parse(read("src/i18n/en.json")).registryDetail;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const k of ["summary","relations","history","risk","obstacle","dependency","decision","action",
  "historyRestricted","unavailable","retry","readOnly","edit","cancelEdit"]){
  assert.ok(fr[k]&&en[k],k);
 }
});
