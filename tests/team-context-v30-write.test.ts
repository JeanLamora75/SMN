import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("modification équipe v30: contrôle actor/team dans la transaction",()=>{
 const service=read("src/server/members/team-context.ts");
 const write=service.slice(service.indexOf("export async function saveTeamContext"));
 assert.match(write,/resolveAdminTeam\(db,authorized,input\.teamId\)/);
 assert.match(write,/authorized\.accountId!==actorId/);
 assert.match(write,/FOR UPDATE OF t,p/);
});
test("route PATCH v30: double verrou et compatibilité v27",()=>{
 const route=read("src/app/api/admin/team-context/route.ts");
 const patch=route.slice(route.indexOf("export async function PATCH"));
 assert.match(patch,/resolveRegistryReadContext\(db,/);
 assert.match(patch,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(patch,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(patch,/assertLegacyTeamApi\(db\)/);
});
