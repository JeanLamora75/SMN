import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const component=read("src/app/app/reports/office-tag-configurator.tsx");
const css=read("src/app/app/reports/report-center-cockpit.css");
const page=read("src/app/app/reports/page.tsx");

test("Office tag configurator uses scoped Cockpit Agile modal regions",()=>{
 for(const name of ["smn-office-tag-config-modal","smn-office-tag-config-dialog",
  "smn-office-tag-config-header","smn-office-tag-config-body",
  "smn-office-tag-config-footer","smn-office-tag-generated"]){
  assert.ok(component.includes(name),name);
  assert.ok(css.includes(name),name);
 }
 assert.match(page,/import "\.\/report-center-cockpit\.css"/);
 assert.match(component,/aria-modal="true"/);
 assert.match(component,/aria-labelledby="smn-tag-config-title"/);
});
test("tag configurator header follows active theme and remains responsive",()=>{
 const header=css.match(/\.smn-office-tag-config-modal \.smn-office-tag-config-header\{[^}]+\}/)?.[0]??"";
 assert.match(header,/--smn-context-start/);
 assert.match(header,/--smn-context-end/);
 assert.match(header,/linear-gradient/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
 assert.match(css,/focus-visible/);
});
test("Office tag building, sorting, chart options, clipboard and focus controls remain",()=>{
 for(const token of ["serializeOfficeTag(","setRules(","setChartTags(","setChartType(",
  "navigator.clipboard.writeText(value)","document.addEventListener(\"keydown\",onKey)",
  "setOpen(false)","tr(\"Copy\")"]){
  assert.ok(component.includes(token),token);
 }
});
