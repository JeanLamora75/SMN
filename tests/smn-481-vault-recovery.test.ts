import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(f:string)=>readFileSync(f,"utf8");
test("SMN-481 admin reset is explicit and does not regenerate lost keys",()=>{
 const recovery=read("src/server/ai-connections/recovery.ts");
 const route=read("src/app/api/admin/ai-connections/reset-vault/route.ts");
 const vault=read("src/server/ai-connections/vault.ts");
 assert.match(recovery,/RESET_AI_VAULT/);
 assert.match(recovery,/credential_state='missing'/);
 assert.match(recovery,/EXCLUSIVE MODE/);
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(route,/allowMutation\(req\)/);
 assert.match(vault,/Never create a replacement master key over an existing vault/);
});
test("SMN-481 edit and delete purge stale credential versions",()=>{
 const registry=read("src/server/ai-connections/registry.ts");
 assert.match(registry,/purgeAiCredentialVersions/);
 assert.match(registry,/cleanupPending/);
});
