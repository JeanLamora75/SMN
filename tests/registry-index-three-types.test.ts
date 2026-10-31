import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Tous les registres n'inclut que risques obstacles dépendances avant pagination",()=>{
 const server=read("src/server/registries/list.ts");
 assert.ok(server.includes("r.type IN ('risk','obstacle','dependency')"));
 assert.ok(server.includes('const count=await db.query'));
 assert.ok(server.includes('const rows=await db.query'));
});
test("Navigation et statuts visibles restreints aux trois catégories",()=>{
 const ui=read("src/app/app/admin/registries/registry-list.tsx");
 assert.ok(ui.includes('visibleRegistryTypes=["risk","obstacle","dependency"]'));
 assert.ok(ui.includes('["all",...visibleRegistryTypes]'));
 assert.ok(ui.includes("visibleRegistryTypes.flatMap"));
});
