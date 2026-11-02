import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {dashboardBuilderCutoverEnabled,dashboardBuilderDestination} from "../src/lib/dashboard-builder/cutover";

test("SMN-374: opt-in only, no accidental cutover",()=>{
 assert.equal(dashboardBuilderCutoverEnabled("enabled"),true);
 for(const value of ["true","1","ENABLED","disabled","",undefined])assert.equal(dashboardBuilderCutoverEnabled(value),false);
});
test("SMN-374: team and cycle survive redirect with safe encoding",()=>{
 assert.equal(dashboardBuilderDestination(),"/app/dashboard-builder");
 assert.equal(dashboardBuilderDestination("team-one","sprint-two"),"/app/dashboard-builder?teamId=team-one&cycleId=sprint-two");
 assert.equal(dashboardBuilderDestination("a&b","x y"),"/app/dashboard-builder?teamId=a%26b&cycleId=x+y");
});
test("SMN-374: historical route guarded and rollback does not delete data",()=>{
 const root=readFileSync(new URL("../src/app/app/page.tsx",import.meta.url),"utf8");
 const target=readFileSync(new URL("../src/app/app/dashboard-builder/page.tsx",import.meta.url),"utf8");
 assert.match(root,/if\(dashboardBuilderCutoverEnabled\(\)\)/);
 assert.match(root,/redirect\(dashboardBuilderDestination/);
 assert.match(target,/!dashboardBuilderCutoverEnabled\(\)/);
});
