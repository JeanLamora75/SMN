import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";

const route=readFileSync(new URL("../src/app/api/admin/members/route.ts",import.meta.url),"utf8");

test("SMN v32: members GET routes through multi-team capability and scoped team",()=>{
 assert.equal(evaluateSchemaCapability(32,"multi-team").ok,true);
 assert.match(route,/if\(evaluateSchemaCapability\(version,"multi-team"\)\.ok\)/);
 assert.match(route,/resolveAdminTeam\(db,\{accountId:actor\.id,role:actor\.role\}/);
 assert.match(route,/listTeamMembers\(db,\{/);
 assert.match(route,/evaluateSchemaCapability\(version,"company-catalog"\)\.ok/);
});
test("SMN v32: member creation uses company-catalog capability, not v31-only gating",()=>{
 assert.equal(evaluateSchemaCapability(32,"company-catalog").ok,true);
 assert.equal(evaluateSchemaCapability(30,"company-catalog").ok,false);
 assert.match(route,/if\(evaluateSchemaCapability\(current,"company-catalog"\)\.ok\)/);
 assert.match(route,/createCompanyMember\(db,actor\.id,body\)/);
 assert.doesNotMatch(route,/if\(current===31\)|if\(version===28\|\|version===29/);
});
test("SMN: unknown future schemas still fail closed",()=>{
 assert.equal(evaluateSchemaCapability(33,"multi-team").ok,false);
 assert.equal(evaluateSchemaCapability(33,"company-catalog").ok,false);
});
