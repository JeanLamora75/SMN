import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("commentaire Registre : l'équipe autorisée est revérifiée dans la transaction",()=>{
 const comments=source("src/server/registries/comments.ts");
 assert.match(comments,/resolveAdminTeam\(db,scope\.actor,scope\.teamId\)/);
 assert.match(comments,/scopedItem\(db,itemId,true,team\?\.team_id\)/);
 assert.match(comments,/r\.team_id=\$2/);
 assert.match(comments,/is_archived/);
});
test("POST commentaire : isolation sous verrou, ancien comportement maintenu en v27",()=>{
 const route=source("src/app/api/admin/registries/[id]/comments/route.ts");
 assert.match(route,/resolveRegistryReadContext\(db,/);
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(route,/assertLegacyTeamApi\(db\)/);
 assert.match(route,/createRegistryComment\(db,actor\.id,id,body,/);
});
