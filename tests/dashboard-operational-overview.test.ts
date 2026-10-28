import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import OperationalOverview from "../src/app/app/operational-overview";

const render=(locale:"fr"|"en")=>
  renderToStaticMarkup(createElement(OperationalOverview,{locale}));
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("SMN-21 — lot 3 : quatre colonnes opérationnelles",()=>{
  it("rend exactement quatre panneaux, dans l'ordre contractuel",()=>{
    const html=render("fr");
    assert.equal((html.match(/<section class="smn-operational-panel smn-operational-/g)||[]).length,4);
    const labels=["Obstacles","Risques","Événements","Notes / Alertes"];
    const positions=labels.map(label=>html.indexOf(`>${label}</h3>`));
    assert.ok(positions.every(index=>index>=0));
    assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
    assert.match(html,/id="calendrier"/);
    assert.match(html,/id="registres"/);
  });
  it("affiche l'indisponibilité sans inventer un total, un état métier ou cinq fausses fiches",()=>{
    const html=render("fr");
    assert.equal((html.match(/Aucun éléments à ce jour/g)||[]).length,4);
    assert.equal((html.match(/Nombre d&#x27;éléments indisponible/g)||[]).length,4);
    assert.doesNotMatch(html,/\b0\s+(?:obstacles|risques|événements|alertes)\b/i);
    assert.doesNotMatch(html,/smn-operational-item|smn-operational-entry/);
    assert.equal((html.match(/Les fiches de ce cycle ne sont pas encore accessibles/g)||[]).length,4);
  });
  it("ne crée aucun contrôle de navigation ou mutation inopérant",()=>{
    const html=render("fr");
    assert.equal((html.match(/Voir tout/g)||[]).length,4);
    assert.equal((html.match(/class="smn-operational-add-unavailable"/g)||[]).length,4);
    assert.doesNotMatch(html,/<a\b|<button\b|<form\b|<input\b/);
    assert.doesNotMatch(html,/href=|onClick|action=/);
  });
  it("différencie Note et Alerte par libellé, icône et classe sémantique",()=>{
    const html=render("fr");
    assert.match(html,/smn-operational-type-note/);
    assert.match(html,/smn-operational-type-alert/);
    assert.match(html,/>Note<\/span>/);
    assert.match(html,/>Alerte<\/span>/);
    assert.match(html,/aria-hidden="true"/);
    assert.doesNotMatch(html,/Configuration actuelle/);
  });
  it("rend les mêmes quatre colonnes et les messages d'attente en anglais",()=>{
    const html=render("en");
    for(const label of ["Impediments","Risks","Events","Notes / Alerts"]){
      assert.ok(html.includes(label),label);
    }
    assert.equal((html.match(/No entries to date/g)||[]).length,4);
    assert.equal((html.match(/View all/g)||[]).length,4);
    assert.equal((html.match(/class="smn-operational-add-unavailable"/g)||[]).length,4);
    assert.doesNotMatch(html,/Aucun éléments à ce jour/);
  });
  it("conserve l'autorisation et le bandeau, sans bloc de configuration doublon",()=>{
    const page=source("src/app/app/page.tsx");
    assert.match(page,/canAccess\(account, "read"/);
    assert.match(page,/readAccountDashboard/);
    assert.match(page,/withDashboardRead/);
    assert.ok(page.indexOf("<CycleOverview")<page.indexOf("<OperationalOverview"));
    assert.doesNotMatch(page,/ConfigurationChecklist|readConfigurationChecklist/);
    assert.doesNotMatch(page,/EmptyBlock|smn-attention-card|id="reportings"/);
  });
  it("adapte la grille à la largeur utile avec les tokens des thèmes",()=>{
    const css=source("src/app/dashboard.css");
    assert.match(css,/\.smn-operational-overview\s*\{[\s\S]*?container-type:inline-size/);
    assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
    assert.match(css,/@container \(max-width:1100px\)/);
    assert.match(css,/@container \(max-width:650px\)/);
    for(const variable of ["--smn-surface","--smn-border","--smn-soft","--smn-primary","--bs-warning-text-emphasis"]){
      assert.ok(css.includes(`var(${variable})`),variable);
    }
  });
});
