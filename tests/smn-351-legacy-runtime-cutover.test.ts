import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("v33 legacy story-point and ticket writers fail closed",()=>{
 const points=read("src/server/sprints/story-points.ts");
 const tickets=read("src/server/sprints/ticket-counts.ts");
 for(const file of [points,tickets]){
  assert.match(file,/schema_version===33/);
  assert.match(file,/legacy-indicators-retired/);
  assert.ok(file.indexOf("legacy-indicators-retired")<file.indexOf('await db.query("BEGIN")'),"v33 must reject before writes");
 }
});
test("v33 dashboard and report projections do not read current legacy tables",()=>{
 const dashboard=read("src/server/dashboard/cycle-reader.ts");
 const report=read("src/server/reports/report-projection.ts");
 assert.match(dashboard,/!v33&&await tableExists\(db,"smn_sprint_story_points"\)/);
 assert.match(dashboard,/tickets=v33\?/);
 assert.match(report,/if\(!v33\)/);
 assert.match(report,/readLegacyReportPoints/);
});
test("v33 CSV confirms reject prior to old metric table updates",()=>{
 const csv=read("src/server/historical-csv/confirm.ts");
 assert.match(csv,/v33-indicator-mapping-required/);
 assert.ok(csv.indexOf("v33-indicator-mapping-required")<csv.indexOf("INSERT INTO public.\u0024{table}"));
});
test("v33 closed snapshots remain readable in obsolete compatibility projection",()=>{
 const reader=read("src/server/sprints/indicators-read.ts");
 assert.match(reader,/if\(scope\.rows\[0\]\.status==="closed"\)/);
 assert.match(reader,/FROM public\.smn_sprint_closure_snapshot/);
 assert.match(reader,/if\(v33\)return \{state:"unavailable",reason:"schema-missing"\}/);
});
