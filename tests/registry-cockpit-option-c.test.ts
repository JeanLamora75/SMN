import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const list=()=>read("src/app/app/admin/registries/registry-list.tsx");
const css=()=>read("src/app/app/admin/registries/registry-cockpit.css");

test("Option C : styles ciblés sur l'index et non sur les fiches détaillées",()=>{
 assert.match(read("src/app/app/admin/registries/page.tsx"),/import "\.\/registry-cockpit\.css"/);
 assert.match(list(),/smn-registry-cockpit/);
 assert.match(css(),/\.smn-registry-cockpit \.smn-registry-hero/);
 assert.doesNotMatch(css(),/\.smn-registry-detail\b/);
});

test("Option C : catégories visibles, recherche toujours présente et filtres repliables",()=>{
 const ui=list();
 assert.match(ui,/smn-registry-category-tabs/);
 assert.match(ui,/role="tab" aria-selected=\{type===kind\}/);
 assert.match(ui,/id="reg-type-mobile"/);
 assert.match(ui,/id="reg-search"/);
 assert.match(ui,/smn-registry-filter-extras/);
 assert.match(ui,/aria-expanded=\{mobileFiltersOpen\}/);
 assert.match(ui,/onClick=\{\(\)=>setMobileFiltersOpen\(value=>!value\)\}/);
 assert.match(css(),/\.smn-registry-filter-extras\{display:none\}/);
 assert.match(css(),/\.smn-registry-filter-extras\.is-open/);
});

test("Option C : création mobile uniquement si administrateur et nom accessible",()=>{
 const ui=list();
 assert.match(ui,/canManage&&<button type="button" className="btn btn-primary smn-registry-create"/);
 assert.match(ui,/aria-label=\{translate\("create"\)\}/);
 assert.match(ui,/smn-registry-create-label/);
 assert.match(css(),/min-width:44px;min-height:44px/);
});

test("Option C : aucune nouvelle source de résultats ou de points d'attention",()=>{
 const ui=list();
 assert.match(ui,/result\.total/);
 assert.match(ui,/attention\.length/);
 assert.match(ui,/result\.items\.map\(item=><RegistryListRow/);
 assert.match(ui,/result\.items\.map\(item=><RegistryCard/);
 assert.match(ui,/view==="list"\?<table/);
 assert.match(ui,/registryDisplayPreferenceKey/);
});

test("Option C : styles de catégorie, sans dériver la criticité du statut",()=>{
 assert.match(read("src/app/app/admin/registries/registry-card.tsx"),/data-registry-type=\{item\.type\}/);
 assert.match(read("src/app/app/admin/registries/registry-list-row.tsx"),/data-registry-type=\{item\.type\}/);
 const styles=css();
 for(const category of ["risk","obstacle","dependency","decision","action","highlight"])
  assert.ok(styles.includes('[data-registry-type="'+category+'"]'),category);
 assert.doesNotMatch(styles,/\[data-registry-status=/);
});

test("Option C : nouveaux libellés disponibles dans les deux locales",()=>{
 for(const lang of ["fr","en"]){
  const json=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const key of ["subtitle","filtersHeading","filtersToggle","viewLabel","summaryCount"])
   assert.equal(typeof json.registryList[key],"string",lang+" "+key);
 }
});
