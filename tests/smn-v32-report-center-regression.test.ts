import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v32: reports center admits scoped multi-team readers",()=>{
 const page=read("src/app/app/reports/page.tsx");
 assert.equal(evaluateSchemaCapability(32,"multi-team").ok,true);
 assert.equal(evaluateSchemaCapability(33,"multi-team").ok,false);
 assert.match(page,/evaluateSchemaCapability\(schema,"multi-team"\)\.ok/);
 assert.match(page,/resolveAdminTeam\(db,/);
 assert.doesNotMatch(page,/\[28,29,30,31\]\.includes\(schema/);
});
test("v32: reports reader enforces team mode and team-scoped records",()=>{
 const service=read("src/server/reports/center.ts");
 assert.match(service,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(service,/lower\(COALESCE\(to_jsonb\(t\)->>'agile_mode',i\.mode\)\)='scrum'/);
 assert.match(service,/WHERE d\.team_id=\$1/);
 assert.match(service,/searchTeamPdfArchives\(db,team\.team_id/);
});
