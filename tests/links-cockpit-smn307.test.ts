import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("SMN-307: page Liens importe sa charte Cockpit",()=>{
 assert.match(source("src/app/app/admin/links/page.tsx"),/import "\.\/links-cockpit\.css"/);
});
test("SMN-307: en-tête, filtres et état vide intégrés",()=>{
 const code=source("src/app/app/admin/links/links-cockpit.tsx");
 for(const name of ["smn-links-cockpit","smn-links-hero","smn-links-filters","smn-links-results","smn-links-state"])
  assert.ok(code.includes(name),name);
 assert.doesNotMatch(code,/alert alert-info/);
 assert.match(code,/aria-pressed=\{view==="cards"\}/);
 assert.match(code,/aria-pressed=\{view==="list"\}/);
 assert.match(code,/target="_blank" rel="noopener noreferrer"/);
});
test("SMN-307: responsive 3 colonnes et styles circonscrits",()=>{
 const css=source("src/app/app/admin/links/links-cockpit.css");
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:1100px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/var\(--smn-surface\)/);
});
