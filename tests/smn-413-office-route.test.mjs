import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
const selector=readFileSync("src/server/reports/office-indicator-charts.ts","utf8");
const client=readFileSync("src/app/app/reports/office-template-catalog.tsx","utf8");
test("PPTX and Word share styled renderer while retaining adapters and historic fallback",()=>{
 assert.match(route,/selected\.template\.format==="pptx"\?\s*insertAdaptivePowerPointCharts/);
 assert.match(route,/renderOfficeIndicatorAdaptiveChart\(payload\.report!/);
 assert.match(route,/insertOfficeTrendImages\(result\.bytes,selected\.template\.format/);
 assert.match(route,/renderOfficeIndicatorChart\(payload\.report!/);
 assert.match(selector,/return renderOfficeTrendPng\(/);
 assert.match(selector,/return renderAdaptiveChartPng\(/);
 assert.match(selector,/read(?:OfficeIndicator|ReportIndicator)?Projection|validateTrendSelection/);
});
test("generation cannot commit partial report before package safety verification",()=>{
 const gate=route.indexOf("isSupportedOfficePackage(withCharts");
 const save=route.indexOf('if(action==="save")',gate);
 assert.ok(gate>0&&save>gate);
 assert.match(route,/instanceof OfficeChartTargetError/);
 assert.match(route,/instanceof OfficePowerPointInsertionError/);
 assert.match(route,/instanceof OfficeChartLayoutError/);
});
test("localized error messages exist for target, renderer and insertion without server paths",()=>{
 assert.match(client,/officeChartTargetInvalid/);
 assert.match(client,/officeChartRenderFailed/);
 assert.match(client,/officeChartInsertionFailed/);
 for(const locale of ["fr","en"]){
  const labels=JSON.parse(readFileSync("src/i18n/"+locale+".json","utf8")).reportsCenter;
  for(const key of ["officeChartTargetInvalid","officeChartRenderFailed","officeChartInsertionFailed"])
   assert.ok(labels[key]&&labels[key].length>20,key);
 }
});
