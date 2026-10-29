import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v32: ceremony template reads resolve the selected Scrum team",()=>{
 const service=read("src/server/sprints/ceremony-templates.ts");
 assert.equal(evaluateSchemaCapability(32,"multi-team").ok,true);
 assert.match(service,/evaluateSchemaCapability\(version,"multi-team"\)\.ok/);
 assert.match(service,/resolveAdminTeam\(db,actor,requestedTeamId\)/);
 assert.match(service,/selected\.mode!=="scrum"/);
 assert.doesNotMatch(service,/version<=31/);
});
test("v32: listing templates does not perform implicit DDL",()=>{
 const service=read("src/server/sprints/ceremony-templates.ts");
 const readBlock=service.slice(service.indexOf("export async function listTemplates("),service.indexOf("export async function saveTemplate("));
 assert.doesNotMatch(readBlock,/ensureTemplateSchema|CREATE TABLE|ALTER TABLE|INSERT INTO/);
 assert.match(readBlock,/WHERE team_id=\$1/);
});
test("v32: saving templates retains authorized team scope",()=>{
 const service=read("src/server/sprints/ceremony-templates.ts");
 assert.match(service,/activeTeam\(db,\{accountId:actorId,role:"admin"\},requestedTeamId\)/);
 assert.match(service,/WHERE id=\$1 AND team_id=\$2 FOR UPDATE/);
});
