import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v32 detail displays editable team-scoped RegistryDetail",()=>{
 const src=read("src/app/app/admin/registries/[id]/page.tsx");
 assert.match(src,/context\.item\?<RegistryDetail id=\{id\} teamId=\{context\.teamId\}/);
 assert.match(src,/canManage=\{actor\.role==="admin"\}/);
 assert.doesNotMatch(src,/Consultation seule/);
});
test("list and detail requests retain team context",()=>{
 const list=read("src/app/app/admin/registries/page.tsx");
 assert.match(list,/schema_version\?\?0\)<=32/);
 for(const file of ["registry-create.tsx","registry-detail.tsx"])
  assert.match(read("src/app/app/admin/registries/"+file),/\?teamId=/);
});
test("PATCH remains scoped and revision-guarded",()=>{
 const src=read("src/app/api/admin/registries/[id]/route.ts");
 assert.match(src,/schema\.rows\[0\]\?\.schema_version!==32/);
 assert.match(src,/context\.team\?\.team_id!==requestedTeamId/);
 assert.match(src,/updateRegistryItem\(db,actor\.id,id,revision as number,input\)/);
});
