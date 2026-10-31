import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Évaluation du risque : neuf cases, valeurs et calcul métier conservés",()=>{
 const jsx=source("src/app/app/admin/registries/risk-assessment.tsx");
 assert.match(jsx,/smn-risk-matrix/);
 assert.match(jsx,/\[\.\.\.levels\]\.reverse\(\)/);
 assert.match(jsx,/levels\.map\(probability/);
 assert.match(jsx,/criticality\(probability,impact\)/);
 assert.match(jsx,/setP\(probability\);setI\(impact\)/);
 assert.match(jsx,/aria-pressed=\{selected\}/);
 assert.match(jsx,/revision:stored\.revision/);
});

test("ROAM : quatre tuiles, sélection et API existante",()=>{
 const jsx=source("src/app/app/admin/registries/risk-roam.tsx");
 assert.match(jsx,/roamValues\.map\(option/);
 assert.match(jsx,/smn-risk-roam-grid/);
 assert.match(jsx,/aria-pressed=\{selected\}/);
 assert.match(jsx,/setValue\(option\)/);
 assert.match(jsx,/classification:value,revision:state\.revision/);
});

test("Deux cartes équilibrées sur desktop, responsive",()=>{
 const css=source("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(css,/smn-registry-risk-layout\{align-items:stretch\}/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/smn-risk-roam-grid/);
 assert.match(css,/grid-template-columns:78px repeat\(3,minmax\(0,1fr\)\)/);
});
