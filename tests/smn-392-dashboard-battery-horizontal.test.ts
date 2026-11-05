import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";
import {resolveTachometerRatio} from "../src/lib/dashboard-builder/tachometer";
import {batterySegmentFills} from "../src/lib/dashboard-builder/battery-horizontal";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {resolveDashboardSource,SOURCE_VIEWS,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const indicator:SourceDescriptor={
 code:"indicator:one",name:"Story Points",category:"indicator",unit:"SP",scope:"cycle",permission:"read",
 status:"available",views:["number","battery-horizontal"],
};
const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("SMN-392 AC1: new battery view belongs to indicator catalog only",()=>{
 assert.ok(SOURCE_VIEWS.includes("battery-horizontal"));
 assert.ok(compatibleVisualizations(indicator).some(x=>x.kind==="battery-horizontal"));
 assert.equal(resolveDashboardSource([indicator],indicator.code,"battery-horizontal").status,"available");
 assert.equal(resolveDashboardSource([indicator],indicator.code,"list").status,"incompatible");
});
test("SMN-392 AC2: presentation-only scale validation and persistence",()=>{
 assert.deepEqual(normalizeSlotOptions({minimum:0,maximum:70},"indicator",[],"battery-horizontal"),{minimum:0,maximum:70});
 assert.deepEqual(normalizeSlotOptions({minimum:-10,maximum:10},"indicator",[],"battery-horizontal"),{minimum:-10,maximum:10});
 for(const values of [{},{minimum:0},{maximum:70},{minimum:70,maximum:70},{minimum:71,maximum:70},{minimum:0,maximum:Infinity}]){
  assert.throws(()=>normalizeSlotOptions(values,"indicator",[],"battery-horizontal"),/dashboard-slot-scale-invalid/);
 }
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:70},"indicator",[],"number"),/dashboard-slot-option-incompatible/);
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:70},"registry",[],"battery-horizontal"),/dashboard-slot-scale-invalid/);
 const layout=read("server/dashboard-builder/layout.ts");
 assert.match(layout,/slot\.view==="battery-horizontal"/);
});
test("SMN-392 AC3: empty/full/intermediate and invalid bounds are distinct",()=>{
 const result=(value:number,minimum=0,maximum=100)=>resolveVisualization(indicator,"battery-horizontal",{
  result:{state:"available",value,unit:"SP"},minimum,maximum
 });
 assert.equal(result(0).ratio,0);
 assert.equal(result(40).ratio,.4);
 assert.equal(result(100).ratio,1);
 assert.equal(result(4,-2,10).ratio,.5);
 assert.equal(result(101).state,"invalid-bounds");
 assert.equal(result(-1).state,"invalid-bounds");
 assert.equal(result(10,20,20).state,"invalid-bounds");
 assert.equal(resolveTachometerRatio(40,0,100),.4);
 assert.equal(resolveVisualization(indicator,"battery-horizontal",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(indicator,"battery-horizontal",{result:{state:"error"}}).state,"error");
});
test("SMN-392 AC3: segmented battery fills continuously without inventing a KPI",()=>{
 assert.deepEqual(batterySegmentFills(0,6),[0,0,0,0,0,0]);
 assert.deepEqual(batterySegmentFills(1,6),[1,1,1,1,1,1]);
 assert.deepEqual(batterySegmentFills(.5,6),[1,1,1,0,0,0]);
 assert.deepEqual(batterySegmentFills(.4,6),[1,1,.4,0,0,0]);
 assert.deepEqual(batterySegmentFills(NaN,6),[0,0,0,0,0,0]);
});
test("SMN-392 AC4/5: wizard preview and clear errors; theme-based rendering",()=>{
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 const consultation=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 const render=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 assert.match(wizard,/Pile horizontale/);
 assert.match(wizard,/Horizontal battery/);
 assert.match(wizard,/view==="battery-horizontal"/);
 assert.match(wizard,/id=\{view\+"-minimum"\}/);
 assert.match(wizard,/id=\{view\+"-maximum"\}/);
 assert.match(consultation,/battery-horizontal/);
 assert.match(render,/batterySegmentFills/);
 assert.match(render,/styles\.batteryHorizontal/);
 assert.match(render,/aria-hidden="true"/);
 assert.match(render,/<output className=\{styles\.metricNumber\}>/);
 assert.match(css,/\.batteryHorizontal/);
 assert.match(css,/var\(--smn-brand\)/);
});
