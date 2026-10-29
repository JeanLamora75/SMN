import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("v32 registry automatic highlight settings no longer call v27-only guards",()=>{
 const route=read("src/app/api/admin/registries/automatic-highlights/route.ts");
 assert.match(route,/withAuthDb\(readAutomaticHighlightSettings\)/);
 assert.match(route,/withAuthDb\(db=>saveAutomaticHighlightSettings/);
 assert.doesNotMatch(route,/withLegacy(?:TeamApi|RegistryReadDb)/);
 assert.match(route,/authorizeApi\(req,"write"/);
});
test("v32 registry deadlines retain admin scope and isolate team alerts",()=>{
 const route=read("src/app/api/admin/registries/deadlines/route.ts");
 const service=read("src/server/registries/deadlines.ts");
 assert.doesNotMatch(route,/withLegacy(?:TeamApi|RegistryReadDb)/);
 assert.match(route,/resolveAdminTeam\(db,\{accountId:actor\.id,role:actor\.role\}\)/);
 assert.match(route,/readDeadlineAlerts\(db,new Date\(\)\.toISOString\(\)\.slice\(0,10\),team\.team_id\)/);
 assert.match(service,/r\.team_id=\$1/);
});
