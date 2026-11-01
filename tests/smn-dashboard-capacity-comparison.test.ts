import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dashboardMetricRatio} from "../src/lib/dashboard-metric-ratio";
import {metricAvailable,metricNotRecorded} from "../src/lib/dashboard-data-contract";
const source=readFileSync(new URL("../src/app/app/kpi-cards.tsx",import.meta.url),"utf8");
test("capacity card uses computed planned/actual caption instead of static unavailable placeholder",()=>{
 assert.match(source,/tone==="capacity"&&caption\?caption:comparison/);
});
test("capacity ratio is available for known 25 J-H planned and 25 actual",()=>{
 const expected=metricAvailable(25,{source:"manual",quality:"known"});
 assert.equal(dashboardMetricRatio(expected,expected)?.percentage,100);
 assert.equal(dashboardMetricRatio(metricNotRecorded(),expected),null);
});
