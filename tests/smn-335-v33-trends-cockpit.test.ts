import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("SMN-335 trends exposes indicator/start/style/end/filter controls and PNG",()=>{
 const c=read("src/app/app/admin/indicators/indicator-trends.tsx");
 for(const token of ['"bar"|"line"|"pie"|"donut"|"gauge"|"area"','name','setStart','setEnd','setStyle','type="submit"','exportPng','svgRef'])assert.ok(c.includes(token),token);
});
test("SMN-335 defaults to six inclusive cycles ending on selected Sprint",()=>{
 const c=read("src/app/app/admin/indicators/indicator-trends.tsx");
 assert.match(c,/last-5/);
 assert.match(c,/defaultTrendRange\(data\.cycles,cycleId\)/);
 assert.match(c,/report\.cycles\.slice\(a,b\+1\)/);
});
test("SMN-335 trends is separate from cycle detail without changing other reports",()=>{
 const c=read("src/app/app/admin/indicators/reporting-view.tsx");
 assert.match(c,/if\(props\.screen==="trends"\)return <IndicatorTrends/);
 assert.match(c,/return <LegacyIndicatorReporting \{\.\.\.props\}\/>/);
});
