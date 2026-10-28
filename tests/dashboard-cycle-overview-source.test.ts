import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";

const src=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=src("src/app/app/page.tsx");
const overview=src("src/app/app/cycle-overview.tsx");
const css=src("src/app/dashboard.css");
const dashboard=src("src/server/dashboard/read.ts");
const operational=src("src/app/app/operational-overview.tsx");

describe("SMN-21 — intégration du lot 2 au dashboard",()=>{
  it("remplace le bandeau hero et les anciens KPI génériques sans perdre les modules existants",()=>{
    assert.match(page,/<CycleOverview context=\{context\} locale=\{locale\} teamHref=\{teamHref\} cycle=\{cycle\} projection=\{projection\}/);
    assert.doesNotMatch(page,/smn-context-card|smn-cycle-empty|dashboard\.metricsDesc/);
    assert.match(operational,/definition\.id==="events"\?"calendrier"/);
    assert.match(operational,/definition\.id==="obstacles"\?"registres"/);
    assert.match(page,/cycle=\{cycle\}/);
    assert.ok(page.indexOf("<CycleOverview")<page.indexOf("<ConfigurationChecklist"));
    assert.match(page,/readConfigurationChecklist/);
  });
  it("ne force ni capacité, ni engagement, ni compteur lorsqu'aucun producteur n'existe",()=>{
    assert.match(dashboard,/currentCycle: null/);
    assert.match(dashboard,/objectives: \[\]/);
    assert.match(dashboard,/metrics: \[\]/);
    assert.match(overview,/noPreviousCycle/);
    assert.match(overview,/notSpecified/);
    assert.match(overview,/notCalculable/);
    assert.doesNotMatch(overview,/Math\.round|Date\.now|\b0\s*(?:\*|\+|SP|J\/H)/);
  });
  it("utilise la largeur utile du contenu et les tokens de thèmes existants",()=>{
    assert.match(css,/\.smn-cycle-overview\s*\{[\s\S]*?container-type:inline-size/);
    assert.match(css,/@container \(max-width:1000px\)/);
    assert.match(css,/@container \(max-width:650px\)/);
    assert.match(css,/@container \(max-width:520px\)/);
    assert.match(css,/\.smn-metric-grid\s*\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
    assert.match(css,/\.smn-cycle-overview-header\s*\{[\s\S]*?var\(--smn-soft\)/);
    assert.match(css,/\.smn-metric-deadline\s*\{[\s\S]*?var\(--smn-primary\)/);
  });
});
