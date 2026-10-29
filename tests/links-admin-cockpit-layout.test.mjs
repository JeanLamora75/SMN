import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("administration des liens utilise le cockpit Agile pleine largeur",()=>{
 const page=read("src/app/app/admin/settings/links/page.tsx");
 const css=read("src/app/app/admin/settings/links/links-admin-cockpit.css");
 assert.match(page,/smn-links-admin-cockpit/);
 assert.match(page,/links-admin-cockpit\.css/);
 assert.match(css,/\.smn-links-admin-cockpit\{[^}]*max-width:none/);
 assert.match(css,/\.smn-links-admin-hero\{/);
 assert.match(css,/@media\(max-width:650px\)/);
});
test("filtres, transfert et catégories restent disponibles",()=>{
 const inventory=read("src/app/app/admin/settings/links/links-admin-inventory.tsx");
 const categories=read("src/app/app/admin/settings/links/category-admin.tsx");
 assert.match(inventory,/smn-links-admin-filters/);
 assert.match(inventory,/setSelected\(item\)/);
 assert.match(inventory,/<LinkTransfer/);
 assert.match(categories,/smn-links-admin-categories/);
 assert.match(categories,/void submit\(\)/);
 assert.match(categories,/void reassign\(\)/);
});
