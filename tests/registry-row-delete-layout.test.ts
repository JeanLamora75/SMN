import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("registry delete action belongs to anchored row menu, not narrow table cell",()=>{
 const row=read("src/app/app/admin/registries/registry-list-row.tsx");
 const menu=row.indexOf('<div className="smn-registry-row-menu">');
 const deleteAction=row.indexOf("<RegistryDeleteAction",menu);
 const menuClosing=row.indexOf("</details>",menu);
 assert.ok(menu>=0&&deleteAction>menu&&deleteAction<menuClosing);
 assert.match(row,/className="smn-registry-row-menu-link smn-registry-row-delete"/);
 assert.doesNotMatch(row,/btn btn-sm btn-outline-danger ms-1/);
});
test("error stays in full-width positioned menu, not a table layout track",()=>{
 const css=read("src/app/globals.css");
 assert.match(css,/\.smn-registry-row-menu\{position:absolute/);
 assert.match(css,/\.smn-registry-row-menu \.smn-registry-row-delete\{/);
 assert.match(css,/\.smn-registry-row-menu \[role="alert"\]\{/);
 assert.match(css,/overflow-wrap:break-word/);
});
