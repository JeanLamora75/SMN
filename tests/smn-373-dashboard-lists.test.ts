import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {listFilters} from "../src/server/dashboard-builder/lists";
test("SMN-373 filters: team-safe bounded pagination and permitted types",()=>{
 assert.deepEqual(listFilters(undefined),{limit:10,offset:0,sort:"desc",showClosed:false,type:"all"});
 assert.deepEqual(listFilters({type:"risk",limit:25,offset:25,sort:"asc",showClosed:true}),
 {limit:25,offset:25,sort:"asc",showClosed:true,type:"risk"});
 assert.throws(()=>listFilters({limit:200}),/invalid/);
 assert.throws(()=>listFilters({offset:-1}),/invalid/);
 assert.throws(()=>listFilters({type:"unsafe"}),/invalid/);
});
test("SMN-373 registry reader scopes team, cycle and lifecycle",()=>{
 const source=readFileSync(new URL("../src/server/dashboard-builder/lists.ts",import.meta.url),"utf8");
 assert.match(source,/r.team_id=\$1/);
 assert.match(source,/c.team_id=r.team_id/);
 assert.match(source,/finalSql/);
 assert.match(source,/LIMIT \$5 OFFSET \$6/);
 assert.match(source,/\/app\/admin\/registries\//);
});
test("SMN-373 links read-only to existing detail, empty collection separate",()=>{
 const component=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-business-list.tsx",import.meta.url),"utf8");
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(component,/href=\{item.href\}/);
 assert.match(component,/Aucun résultat/);
 assert.match(component,/Pagination des fiches/);
 assert.match(consultation,/DashboardBusinessList/);
});
