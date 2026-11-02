import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateFormula} from "../src/server/indicators/formula";
import {buildDependencyGraph} from "../src/server/indicators/dependencies";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("v33 dynamic catalogue does not depend on predefined legacy F01-Fxx tags",()=>{
 const graph=buildDependencyGraph([
  {id:"a",tag:"CUSTOM_SOURCE",formula:null},
  {id:"b",tag:"CUSTOM_TOTAL",formula:"CUSTOM_SOURCE+1"}
 ],[{indicator_id:"b",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null}]);
 assert.deepEqual(graph.order,["a","b"]);
 assert.deepEqual(calculateFormula("CUSTOM_SOURCE+1",{CUSTOM_SOURCE:"0"}),{kind:"available",value:"1"});
});
test("migration and safety tests continue to enforce legacy writer rejection and version continuity",()=>{
 const guard=read("tests/smn-351-legacy-runtime-cutover.test.ts");
 const upgrade=read("tests/smn-351-v32-history-upgrade-pg.test.ts");
 assert.match(guard,/legacy story-point and ticket writers fail closed/);
 assert.match(guard,/v33 CSV confirms reject/);
 assert.match(upgrade,/legacy v32 history survives isolated upgrade to v33/);
});
test("closed snapshots and permissions keep dedicated regression coverage",()=>{
 const snapshot=read("tests/smn-351-v33-capture-pg.test.ts");
 const auth=read("tests/smn-357-dashboard-permissions.test.ts");
 const dependency=read("tests/smn-342-dependency-graph.test.ts");
 assert.match(snapshot,/snapshot is frozen while live value changes/);
 assert.match(auth,/dashboardPermission|requireDashboardPermission/);
 assert.match(dependency,/NULL non assimilé à zéro/);
});
