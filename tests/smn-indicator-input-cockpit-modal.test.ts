import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const component=readFileSync(new URL("../src/app/app/admin/indicators/universal-input.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/app/admin/indicators/universal-input.module.css",import.meta.url),"utf8");

test("Cockpit Agile: three-column indicator entry, responsive and scoped styles",()=>{
 assert.match(component,/import styles from "\.\/universal-input\.module\.css"/);
 assert.match(component,/className=\{styles\.inputGrid\}/);
 assert.match(css,/\.inputGrid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:880px\).*repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:560px\).*\.inputGrid\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/var\(--smn-brand/);
});
test("Cockpit Agile: computed values are collapsible and closed by default",()=>{
 assert.match(component,/<details className=\{styles\.computedSection\}>/);
 assert.match(component,/<summary className=\{styles\.computedToggle\}>/);
 assert.doesNotMatch(component,/defaultOpen=\{true\}/);
 assert.match(component,/className=\{styles\.computedRow\}/);
 assert.match(css,/\.computedSection\[open\]/);
});
test("Cockpit Agile: modal mechanics and original indicator API remain available",()=>{
 assert.match(component,/<dialog ref=\{dialog\}/);
 assert.match(component,/node\.showModal\(\)/);
 assert.match(component,/onCancel=\{e=>\{e\.preventDefault\(\);close\(\);\}\}/);
 assert.match(component,/onClick=\{close\}/);
 assert.match(component,/onClick=\{\(\)=>void run\("preview"\)\}/);
 assert.match(component,/onClick=\{\(\)=>void run\("save"\)\}/);
 assert.match(component,/setDraft\(v=>\(\{\.\.\.v,\[d\.id\]:e\.target\.value\}\)\)/);
 assert.match(component,/expectedSystemRevision:action==="save"\?systemRevision:undefined/);
 assert.match(component,/disabled=\{!preview\|\|systemRevision===null\|\|busy\}/);
 assert.match(css,/\.body\{flex:1;min-height:0;overflow:auto/);
 assert.match(css,/\.footer\{display:flex;flex:none/);
});
