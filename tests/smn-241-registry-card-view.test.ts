import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRegistryDisplayView,registryDisplayPreferenceKey} from "../src/lib/registry-display-view";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const list=()=>source("src/app/app/admin/registries/registry-list.tsx");
const card=()=>source("src/app/app/admin/registries/registry-card.tsx");

test("la préférence du registre est isolée, Liste est le défaut et inconnue ne devient pas Cartes",()=>{
 assert.equal(parseRegistryDisplayView(null),"list");
 assert.equal(parseRegistryDisplayView(undefined),"list");
 assert.equal(parseRegistryDisplayView("list"),"list");
 assert.equal(parseRegistryDisplayView("cards"),"cards");
 assert.equal(parseRegistryDisplayView("invalid"),"list");
 assert.match(registryDisplayPreferenceKey,/registr/);
 assert.ok(!registryDisplayPreferenceKey.includes("team-roster"));
});

test("une seule vue visible ; les deux consomment les mêmes fiches déjà filtrées",()=>{
 const ui=list();
 assert.match(ui,/view==="list"\?/);
 assert.match(ui,/result\.items\.map\(item=><RegistryListRow/);
 assert.match(ui,/result\.items\.map\(item=><RegistryCard/);
 assert.match(ui,/view==="list"\?<table/);
 assert.ok(!card().includes('fetch('));
});

test("la bascule préserve les requêtes, filtres, pagination et nombre de fiches",()=>{
 const ui=list();
 assert.match(ui,/onClick=\{\(\)=>chooseView\("list"\)\}/);
 assert.match(ui,/onClick=\{\(\)=>chooseView\("cards"\)\}/);
 assert.match(ui,/setView\(next\)/);
 assert.match(ui,/localStorage\.setItem\(registryDisplayPreferenceKey,next\)/);
 assert.match(ui,/localStorage\.getItem\(registryDisplayPreferenceKey\)/);
 const selector=ui.split("const chooseView=")[1]!.split("\n };")[0];
 assert.ok(!selector.includes("setQuery(")&&!selector.includes("setPage(")&&!selector.includes("fetch("));
});

test("deux commandes clavier exclusives, avec nom accessible et état pressed",()=>{
 const ui=list();
 assert.match(ui,/aria-pressed=\{view==="list"\}/);
 assert.match(ui,/aria-pressed=\{view==="cards"\}/);
 assert.match(ui,/role="group"/);
 assert.match(ui,/translate\("viewGroup"\)/);
});

test("chaque carte utilise les six icônes, vrai titre, statut textuel, description et échéance facultative",()=>{
 const ui=card();
 assert.match(ui,/import BootstrapIcon/);
 for(const [type,icon] of Object.entries({
  risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
  dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",highlight:"bell-fill"
 }))assert.ok(ui.includes(type+':"'+icon+'"'),type);
 assert.match(ui,/href=\{href\}/);
 assert.match(ui,/item\.description/);
 assert.match(ui,/item\.dueOn&&/);
 assert.match(ui,/label\(item\.status\)/);
 assert.match(ui,/signals\.map\(/);
 assert.match(ui,/canManage&&/);
});

test("densité compacte responsive : 4/2/1 colonnes sans hauteur artificielle",()=>{
 const css=source("src/app/globals.css");
 assert.match(css,/\.smn-registry-card-grid/);
 assert.match(css,/repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/align-items:start/);
 assert.match(css,/-webkit-line-clamp:2/);
});

test("traductions françaises/anglaises de la bascule et aucun exemple métier artificiel",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json")).registryList;
 const en=JSON.parse(source("src/i18n/en.json")).registryList;
 for(const key of ["viewGroup","listView","cardsView"]){
  assert.equal(typeof fr[key],"string");
  assert.equal(typeof en[key],"string");
  assert.ok(fr[key].length&&en[key].length);
 }
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 const ui=card();
 assert.ok(!ui.includes("example"));
 assert.ok(!ui.includes("mock"));
});
