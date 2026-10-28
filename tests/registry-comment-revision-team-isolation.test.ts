import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("édition/retrait commentaires : même contrôle de teamId dans la transaction",()=>{
 const service=source("src/server/registries/comments.ts");
 const revision=service.slice(service.indexOf("export async function reviseRegistryComment"),service.indexOf("type CommentRow="));
 assert.match(revision,/resolveAdminTeam\(db,scope\.actor,scope\.teamId\)/);
 assert.match(revision,/scopedItem\(db,itemId,true,team\?\.team_id\)/);
 assert.match(revision,/c\.item_id=\$2 FOR UPDATE/);
});
test("API révision commentaires : v30 verrouillé et chemin historique conservé",()=>{
 const route=source("src/app/api/admin/registries/[id]/comments/[commentId]/route.ts");
 assert.match(route,/resolveRegistryReadContext\(db,/);
 assert.match(route,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(route,/assertLegacyTeamApi\(db\)/);
 assert.match(route,/changeComment\(db,actor,req,id,commentId,"edit",body\)/);
 assert.match(route,/changeComment\(db,actor,req,id,commentId,"withdraw",body\)/);
});
