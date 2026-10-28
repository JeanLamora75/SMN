import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("évaluation du risque : équipe autorisée, filtre SQL et verrou de livraison",()=>{
 const service=read("src/server/registries/assessment.ts");
 const route=read("src/app/api/admin/registries/[id]/assessment/route.ts");
 assert.match(service,/resolveAdminTeam\(db,scope\.actor,scope\.teamId\)/);
 assert.match(service,/r\.team_id=\$2/);
 assert.match(service,/is_archived/);
 assert.match(route,/resolveRegistryReadContext\(db,/);
 assert.match(route,/MULTI_TEAM_CONTEXT_READY/);
 assert.match(route,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(route,/assertLegacyTeamApi\(db\)/);
});
