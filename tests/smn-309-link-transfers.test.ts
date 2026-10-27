import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("transfer enforces optimistic version and tenant scoping",()=>{
 const code=read("src/server/links/admin-transfer.ts");
 assert.match(code,/Number\.isSafeInteger\(input\.revision\)/);
 assert.match(code,/before\.revision!==input\.revision/);
 assert.match(code,/a\.installation_id=l\.installation_id/);
 assert.match(code,/FOR UPDATE OF l/);
 assert.match(code,/revision=revision\+1/);
});
test("source and target teams are rechecked before update",()=>{
 const code=read("src/server/links/admin-transfer.ts");
 assert.match(code,/if\(input\.teamId\)await resolveAdminTeam/);
 assert.match(code,/if\(before\.team_id\)await resolveAdminTeam/);
 assert.match(code,/INSERT INTO public\.smn_link_audit/);
});
test("admin transfer UI requires explicit confirmation",()=>{
 const code=read("src/app/app/admin/settings/links/link-transfer.tsx");
 assert.match(code,/changed&&confirmed/);
 assert.match(code,/disabled=\{!valid\|\|busy\}/);
 assert.match(code,/JSON\.stringify\(\{scope,teamId:scope==="TRANSVERSE"\?null:teamId,revision:item\.revision\}\)/);
});
