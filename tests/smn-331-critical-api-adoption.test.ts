import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("la cadence Scrum v32 utilise le contrat central",()=>{
 const s=source("src/server/sprints/cadence.ts");
 assert.match(s,/evaluateSchemaCapability\(version,"multi-team"\)/);
 assert.match(s,/resolveAdminTeam/);
 assert.equal(evaluateSchemaCapability(32,"multi-team").ok,true);
 assert.equal(evaluateSchemaCapability(33,"multi-team").ok,false);
});
test("la liste Kanban v32 exige une équipe autorisée",()=>{
 const s=source("src/app/api/admin/kanban-periods/list/route.ts");
 assert.match(s,/evaluateSchemaCapability\(schema,"multi-team"\)/);
 assert.match(s,/resolveAdminTeam/);
 assert.match(s,/scopedTeamId=team.team_id/);
});
test("l'authentification et le registre partagent la même borne maximale",()=>{
 const s=source("src/server/accounts/migration.ts");
 assert.match(s,/CURRENT_SCHEMA_VERSION/);
 assert.match(s,/version<=CURRENT_SCHEMA_VERSION/);
});
