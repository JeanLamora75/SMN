import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {trendDirection} from "../src/lib/dashboard-builder/trend-arrow";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {SOURCE_VIEWS,resolveDashboardSource,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const source:SourceDescriptor={code:"indicator:sample",name:"Écart capacité",category:"indicator",unit:"JH",scope:"cycle",permission:"read",status:"available",views:["number","trend-arrow"]};
const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("SMN-394 AC1: a distinct view restricted to compatible indicators",()=>{
 assert.equal(SOURCE_VIEWS.filter(x=>x==="trend-arrow").length,1);
 assert.ok(compatibleVisualizations(source).some(x=>x.kind==="trend-arrow"));
 assert.equal(resolveDashboardSource([source],source.code,"trend-arrow").status,"available");
 assert.equal(resolveDashboardSource([source],source.code,"list").status,"incompatible");
 assert.deepEqual(compatibleVisualizations({...source,status:"unavailable"}),[]);
});
test("SMN-394 AC2: direction is the sign of the current value, not a delta",()=>{
 assert.equal(trendDirection(1),"up");
 assert.equal(trendDirection(.01),"up");
 assert.equal(trendDirection(0),"flat");
 assert.equal(trendDirection(-0),"flat");
 assert.equal(trendDirection(-.01),"down");
 assert.equal(trendDirection(-9),"down");
 assert.equal(trendDirection(Number.NaN),null);
 assert.equal(trendDirection(Number.POSITIVE_INFINITY),null);
 assert.equal(trendDirection(Number.NEGATIVE_INFINITY),null);
});
test("SMN-394 AC4: zero is real; missing and errors do not invent an arrow",()=>{
 const value=(n:number)=>resolveVisualization(source,"trend-arrow",{result:{state:"available",value:n,unit:"JH"}});
 assert.equal(value(0).state,"ready");
 assert.equal(value(0).value,0);
 assert.equal(value(-9).value,-9);
 assert.equal(value(Number.NaN).state,"error");
 assert.equal(resolveVisualization(source,"trend-arrow",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(source,"trend-arrow",{result:{state:"absent"}}).state,"absent");
 assert.equal(resolveVisualization(source,"trend-arrow",{result:{state:"error"}}).state,"error");
});
test("SMN-394 AC1/3/5: accessible arrow, one KPI, wizard and Cockpit styles",()=>{
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 const rendering=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const consultation=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 assert.match(wizard,/trend-arrow:"Tendance"/);
 assert.match(wizard,/"trend-arrow":"Trend arrow"/);
 assert.match(wizard,/view==="trend-arrow"/);
 assert.match(rendering,/trendDirection\(model\.value\)/);
 assert.match(rendering,/aria-hidden="true"/);
 assert.match(rendering,/role="img"/);
 assert.match(rendering,/styles\.trendArrow/);
 assert.match(rendering,/<output className=\{styles\.metricNumber\}>/);
 assert.match(css,/\.trendArrow/);
 assert.match(css,/var\(--smn-brand\)/);
 assert.match(consultation,/kind:slot\.view as VisualizationModel/);
});
