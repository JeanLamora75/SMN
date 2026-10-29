import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";
const route=readFileSync(new URL("../src/app/api/team-calendar/route.ts",import.meta.url),"utf8");
const service=readFileSync(new URL("../src/server/members/team-calendar.ts",import.meta.url),"utf8");

test("SMN v32: team calendar passes company closure mode on v31 and v32",()=>{
 for(const v of [31,32])assert.equal(evaluateSchemaCapability(v,"company-catalog").ok,true);
 assert.equal(evaluateSchemaCapability(30,"company-catalog").ok,false);
 assert.match(route,/evaluateSchemaCapability\(schema,"company-catalog"\)\.ok/);
 assert.doesNotMatch(route,/schema===31/);
});
test("SMN v32: company closure queries are team-assignment scoped",()=>{
 assert.match(service,/FROM public\.smn_company_closure c/);
 assert.match(service,/JOIN public\.smn_member_assignment a ON a\.member_id=m\.id AND a\.team_id=\$1/);
 assert.match(service,/WHERE c\.is_active=true/);
});
