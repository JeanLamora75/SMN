import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
test("v33: dashboard resolves the multi-team admin context",()=>{
 const content=source("src/server/dashboard/read.ts");
 assert.match(content,/\[28,29,30,31,32,33\]\.includes/);
 assert.match(content,/resolveAdminTeam/);
});
test("v33: registries reuse the authorized team resolver",()=>{
 const content=source("src/server/registries/team-access.ts");
 assert.match(content,/version===32\|\|version===33/);
 assert.match(content,/resolveAdminTeam/);
});
test("v33: links inventory and admin lists remain team-scoped",()=>{
 for(const path of ["src/server/links/catalog.ts","src/server/links/admin.ts"]){
  const content=source(path);
  assert.match(content,/i\.schema_version BETWEEN 29 AND 33/);
  assert.match(content,/resolveAdminTeam/);
 }
});
test("v33: reports are team-scoped, old multi-team version cap retired",()=>{
 const content=source("src/server/reports/center.ts");
 assert.match(content,/i\.schema_version BETWEEN 28 AND 33/);
 assert.match(content,/searchTeamPdfArchives/);
});
test("v33: no implicit destructive schema changes in context read paths",()=>{
 for(const path of ["src/server/dashboard/read.ts","src/server/registries/team-access.ts","src/server/links/catalog.ts","src/server/links/admin.ts","src/server/reports/center.ts"]){
  const content=source(path);
  assert.doesNotMatch(content,/\bDROP TABLE\b|\bTRUNCATE TABLE\b/);
 }
});
