import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
for(const [name,path,operation] of [
 ["création","src/app/api/admin/registries/route.ts","createRegistryItem"],
 ["modification","src/app/api/admin/registries/[id]/route.ts","updateRegistryItem"]
] as const){
 test("Registre "+name+" : contexte d'équipe autorisé, activation contrôlée",()=>{
  const src=read(path);
  assert.match(src,/resolveRegistryReadContext\(db,/);
  assert.match(src,/context\.team\?\.team_id!==requestedTeamId/);
  assert.match(src,/!MULTI_TEAM_CONTEXT_READY\|\|/);
  assert.match(src,/process\.env\.SMN_MULTI_TEAM_WRITES_ENABLED!=="true"/);
  assert.match(src,/assertLegacyTeamApi\(db\)/);
  assert.ok(src.includes(operation+"(db,actor.id,"));
 });
}
