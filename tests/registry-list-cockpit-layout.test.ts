import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../src/app/app/admin/registries/"+name,import.meta.url),"utf8");
test("attention follows registry hero and filters share a compact desktop grid",()=>{
 const list=read("registry-list.tsx");
 assert(list.indexOf('<div className="smn-registry-hero">')<list.indexOf('<AttentionCockpit'));
 assert(list.indexOf('<AttentionCockpit')<list.indexOf('<section className="smn-registry-filters-panel"'));
 assert.match(list,/smn-registry-compact-filters/);
 const css=read("registry-cockpit.css");
 assert.match(css,/grid-template-columns:minmax\(150px,2fr\) repeat\(5,minmax\(95px,1fr\)\) minmax\(160px,auto\)/);
});
test("table column and row both place status immediately after date",()=>{
 const list=read("registry-list.tsx");
 const head=list.slice(list.indexOf("<thead><tr>"),list.indexOf("</tr></thead>"));
 assert(head.indexOf('translate("date")')<head.indexOf('translate("status")'));
 assert(head.indexOf('translate("status")')<head.indexOf('translate("category")'));
 const row=read("registry-list-row.tsx");
 assert(row.indexOf('className="smn-registry-cell-date"')<row.indexOf('className="smn-registry-cell-status"'));
 assert(row.indexOf('className="smn-registry-cell-status"')<row.indexOf('className="smn-registry-cell-type"'));
});
test("status classes use semantic Bootstrap palette tokens",()=>{
 const row=read("registry-list-row.tsx");
 const css=read("registry-cockpit.css");
 assert.match(row,/smn-registry-status-active/);
 assert.match(row,/smn-registry-status-resolved/);
 assert.match(css,/var\(--bs-primary-bg-subtle\)/);
 assert.match(css,/var\(--bs-success-bg-subtle\)/);
});
