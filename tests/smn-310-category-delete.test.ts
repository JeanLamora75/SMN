import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("category deletion confirmation uses shared accessible dialog",()=>{
 const component=read("src/app/app/admin/settings/links/category-admin.tsx");
 assert.match(component,/import LinkDialog from "\.\.\/\.\.\/links\/link-dialog"/);
 assert.match(component,/<LinkDialog titleId="smn-category-delete-title"/);
 assert.match(component,/locked=\{busy\}/);
 assert.match(component,/disabled=\{busy\|\|deleting\.linkCount>0\}/);
});
test("category deletion protects against concurrent link association",()=>{
 const service=read("src/server/links/categories-admin.ts");
 assert.match(service,/Number\(usage\.rows\[0\]\?\.link_count\)>0/);
 assert.match(service,/if\(\(error as \{code\?:unknown\}\)\?\.code==="23503"\)throw new LinkError\("conflict"\)/);
 assert.match(service,/await db\.query\("ROLLBACK"\)/);
});
