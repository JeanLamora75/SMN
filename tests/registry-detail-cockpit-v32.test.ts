import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("detail page removes breadcrumbs and duplicated status pencil",()=>{
 const src=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.doesNotMatch(src,/RegistryBreadcrumbs/);
 assert.doesNotMatch(src,/registryEdit\.status/);
 assert.match(src,/smn-registry-detail-cockpit/);
});
test("risk and relations panels are paired; cycles inline on detail",()=>{
 const src=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(src,/smn-registry-risk-layout/);
 assert.match(src,/smn-registry-detail-pair/);
 assert.match(src,/<RegistryCycles id=\{id\} teamId=\{teamId\} canManage=\{false\} embedded\/>/);
});
test("history endpoint uses authorized team instead of legacy v27 guard",()=>{
 const src=read("src/app/api/admin/registries/[id]/history/route.ts");
 assert.match(src,/authorizeRegistryRecord/);
 assert.match(src,/withSprintIndexDb/);
 assert.doesNotMatch(src,/withLegacyRegistryReadDb/);
});
test("Cockpit Agile detail tabs use theme tokens and responsive columns",()=>{
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(css,/smn-registry-detail-tab\[aria-selected="true"\]/);
 assert.match(css,/var\(--smn-context-start\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:800px\)/);
});
