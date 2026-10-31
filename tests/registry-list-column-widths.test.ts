import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Fiche follows Catégorie and takes flexible table width",()=>{
 const list=read("src/app/app/admin/registries/registry-list.tsx");
 const head=list.slice(list.indexOf("<thead><tr>"),list.indexOf("</tr></thead>"));
 const labels=["date","status","category","title","owner","due","actions"];
 const indices=labels.map(k=>head.indexOf('translate("'+k+'")'));
 assert.ok(indices.every(i=>i>=0));
 assert.deepEqual(indices,[...indices].sort((a,b)=>a-b));
 const css=read("src/app/globals.css");
 assert.match(css,/smn-registry-list-table th:nth-child\(3\)\{width:155px\}/);
 assert.match(css,/smn-registry-list-table th:nth-child\(4\)\{width:auto\}/);
 assert.doesNotMatch(css,/smn-registry-list-table th:nth-child\(4\)\{width:150px\}/);
});
