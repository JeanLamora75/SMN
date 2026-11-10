import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdaptiveChartPng} from "../scripts/smn-412-adaptive-chart.mjs";
import {PREDEFINED_CHART_STYLES} from "../src/server/reports/chart-style-contract";
const src=(p:string)=>readFileSync(p,"utf8");
test("SMN-440 uses one renderer for trends and Office, not duplicated SVG",()=>{
 const server=src("src/app/api/admin/reports/charts/render/route.ts");
 const client=src("src/app/app/admin/indicators/shared-trend-chart.tsx");
 const dynamic=src("src/app/app/admin/indicators/indicator-trends.tsx");
 const sprint=src("src/app/app/admin/sprints/[sprintId]/sprint-trends-panel.tsx");
 assert.match(server,/renderAdaptiveChartPng/);
 assert.match(client,/\/api\/admin\/reports\/charts\/render/);
 assert.match(dynamic,/SharedTrendChart/);assert.match(sprint,/SharedTrendChart/);
 assert.doesNotMatch(dynamic,/<svg/);assert.doesNotMatch(sprint,/<svg/);
 assert.match(client,/chart-styles/);
 assert.match(client,/downloadName/);
 assert.match(server,/authorizeApi/);
});
test("SMN-440 all six types produce PNG from the exact Office renderer and three presets",()=>{
 const cycles=[{name:"Sprint 1"},{name:"Sprint 2"}];
 for(const type of ["bar","line","area","pie","donut","gauge"] as const){
  for(const style of PREDEFINED_CHART_STYLES){
   const series=type==="gauge"?[{name:"Livré",unit:"%",values:[45,60]}]:
    [{name:"Livré",unit:"SP",values:[10,20]}];
   const png=renderAdaptiveChartPng({
    cycles,series,type,locale:"fr",style:style.config,
    target:{widthEmu:960*3048,heightEmu:560*3048}
   });
   assert.ok(Buffer.isBuffer(png),type+" "+style.id);
   assert.equal(png.subarray(1,4).toString(),"PNG",type+" "+style.id);
  }
 }
});
test("SMN-440 new user-facing strings are localized in FR and EN",()=>{
 const fr=JSON.parse(src("src/i18n/fr.json"));
 const en=JSON.parse(src("src/i18n/en.json"));
 assert.deepEqual(Object.keys(fr.indicators.sharedChart).sort(),Object.keys(en.indicators.sharedChart).sort());
 for(const key of Object.keys(fr.indicators.sharedChart)){
  assert.ok(fr.indicators.sharedChart[key]&&en.indicators.sharedChart[key],key);
 }
});
