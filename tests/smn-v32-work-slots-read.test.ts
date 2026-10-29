import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v32 work slot team resolution uses the central schema capability",()=>{
 const service=source("src/server/sprints/work-slot-config.ts");
 assert.match(service,/evaluateSchemaCapability\(version,"multi-team"\)\.ok/);
 assert.match(service,/resolveAdminTeam\(db,actor,requestedTeamId\)/);
 assert.doesNotMatch(service,/version>=28/);
});
test("read errors in work slots include a server diagnostic",()=>{
 const route=source("src/app/api/admin/sprints/work-slots/route.ts");
 assert.match(route,/smn-work-slots-read-unavailable/);
 assert.match(route,/return jsonResult\(\{error:"unavailable"\},503\)/);
});
