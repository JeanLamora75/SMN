import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SMN v32: links capability stays available while future unknown versions are rejected",()=>{
 assert.equal(evaluateSchemaCapability(32,"links").ok,true);
 assert.equal(evaluateSchemaCapability(33,"links").ok,false);
 assert.equal(evaluateSchemaCapability(28,"links").ok,false);
});

test("SMN v32: scoped links, categories, inventory and transfers accept v32",()=>{
 for(const path of [
  "src/server/links/catalog.ts",
  "src/server/links/admin.ts",
  "src/server/links/admin-transfer.ts",
  "src/server/links/categories-admin.ts"
 ]){
  const source=read(path);
  assert.match(source,/schema_version BETWEEN 29 AND 32/,path);
  assert.doesNotMatch(source,/schema_version IN \(29,30,31\)/,path);
 }
});
test("SMN v32: link requests still use authorized team and installation",()=>{
 const catalog=read("src/server/links/catalog.ts");
 assert.match(catalog,/resolveAdminTeam\(db,/);
 assert.match(catalog,/a\.must_change_password=false/);
 const inventory=read("src/server/links/admin.ts");
 assert.match(inventory,/i\.state='initialized'/);
});
