import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("v33 indicator save refreshes matching reporting screens",()=>{
 const input=read("src/app/app/admin/indicators/universal-input.tsx");
 const report=read("src/app/app/admin/indicators/reporting-view.tsx");
 assert.match(input,/if\(!r\.ok\|\|data\.ok===false\)throw/);
 assert.match(input,/dispatchEvent\(new CustomEvent\("smn:indicators-saved"/);
 assert.match(report,/addEventListener\("smn:indicators-saved"/);
 assert.match(report,/detail\.teamId===teamId&&detail\.cycleType===cycleType/);
 assert.match(report,/setRefreshKey\(k=>k\+1\)/);
 assert.match(report,/\[teamId,cycleType,screen,cycleId,refreshKey\]/);
});
test("v33 empty report links to team display configuration",()=>{
 const report=read("src/app/app/admin/indicators/reporting-view.tsx");
 assert.match(report,/data\?\.columns\.length===0/);
 assert.match(report,/indicators\.reporting\.configureHint/);
 assert.match(report,/href="\/app\/admin\/indicators"/);
 for(const locale of ["fr","en"]){
  const catalog=JSON.parse(read("src/i18n/"+locale+".json"));
  assert.ok(catalog.indicators.reporting.configureHint);
  assert.ok(catalog.indicators.reporting.configureAction);
 }
});
