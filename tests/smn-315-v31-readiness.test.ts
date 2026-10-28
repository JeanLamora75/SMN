import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const src=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v31 : les lectures et écritures d'équipe conservent la garde explicite",()=>{
 const active=src("src/server/teams/active.ts");
 const write=src("src/server/teams/write.ts");
 const settings=src("src/app/api/admin/teams/route.ts");
 const detail=src("src/server/members/team-context.ts");
 assert.match(active,/\[28,29,30,31\]\.includes/);
 assert.match(write,/\[28,29,30,31\]\.includes/);
 assert.match(settings,/\[28,29,30,31\]\.includes/);
 assert.match(detail,/schema_version IN \(28,29,30,31\)/);
});
test("v31 : les lectures de capacité et le dashboard résolvent l'équipe autorisée",()=>{
 for(const path of ["src/app/api/admin/development-capacity/route.ts",
  "src/app/api/admin/capacity-actual/route.ts","src/server/dashboard/read.ts"]){
  assert.match(src(path),/\[28,29,30,31\]\.includes/);
 }
 assert.match(src("src/server/registries/team-access.ts"),/version===31/);
});
