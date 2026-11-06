import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {ringProgress,ringTicks} from "../src/lib/dashboard-builder/graduated-ring";
import {normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";
import {resolveVisualization,compatibleVisualizations} from "../src/server/dashboard-builder/visualizations";
import {SOURCE_VIEWS,resolveDashboardSource,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const indicator:SourceDescriptor={code:"indicator:one",name:"Capacité",category:"indicator",unit:"JH",scope:"cycle",permission:"read",status:"available",views:["number","graduated-ring"]};
const read=(file:string)=>readFileSync(new URL("../src/"+file,import.meta.url),"utf8");

test("SMN-395 AC1: ring is a distinct KPI-only view",()=>{
 assert.equal(SOURCE_VIEWS.filter(x=>x==="graduated-ring").length,1);
 assert.ok(compatibleVisualizations(indicator).some(v=>v.kind==="graduated-ring"));
 assert.equal(resolveDashboardSource([indicator],indicator.code,"graduated-ring").status,"available");
 assert.equal(resolveDashboardSource([indicator],indicator.code,"list").status,"incompatible");
});
test("SMN-395 AC2/3: normalized values, out-of-bounds, null and no invented percentage",()=>{
 const result=(value:number,minimum=0,maximum=100)=>resolveVisualization(indicator,"graduated-ring",{result:{state:"available",value,unit:"JH"},minimum,maximum});
 assert.equal(result(0).ratio,0);
 assert.equal(result(50).ratio,.5);
 assert.equal(result(100).ratio,1);
 assert.equal(result(-5,-10,0).ratio,.5);
 assert.equal(result(101).state,"invalid-bounds");
 assert.equal(result(-1).state,"invalid-bounds");
 assert.equal(result(10,10,10).state,"invalid-bounds");
 assert.equal(resolveVisualization(indicator,"graduated-ring",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(indicator,"graduated-ring",{result:{state:"absent"}}).state,"absent");
 assert.equal(resolveVisualization(indicator,"graduated-ring",{result:{state:"error"}}).state,"error");
});
test("SMN-395 AC3: progress starts at 12 o'clock and advances clockwise",()=>{
 assert.equal(ringProgress(0).filled,0);
 assert.ok(Math.abs(ringProgress(.5).filled-ringProgress(1).circumference/2)<1e-8);
 assert.ok(Math.abs(ringProgress(1).filled-ringProgress(1).circumference)<1e-8);
 assert.equal(ringProgress(.25).dashOffset,ringProgress(.75).dashOffset+ringProgress(1).circumference/2);
 const ticks=ringTicks(24);
 assert.equal(ticks.length,24);
 assert.ok(Math.abs(ticks[0].x1-100)<1e-8);
 assert.ok(ticks[0].y1<100);
 assert.ok(ticks[6].x1>100);
 assert.throws(()=>ringTicks(0),/dashboard-ring-ticks-invalid/);
});
test("SMN-395 AC2/5: explicit scales required only for scaled views",()=>{
 assert.deepEqual(normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"graduated-ring"),{minimum:0,maximum:100});
 for(const opts of [{},{minimum:0},{maximum:100},{minimum:30,maximum:30},{minimum:50,maximum:40},{minimum:0,maximum:Infinity}]){
  assert.throws(()=>normalizeSlotOptions(opts,"indicator",[],"graduated-ring"),/dashboard-slot-scale-invalid/);
 }
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"card"),/dashboard-slot-option-incompatible/);
 assert.match(read("server/dashboard-builder/layout.ts"),/slot\.view==="graduated-ring"/);
});
test("SMN-395 AC1/4/5: central original value, accessible rendering and wizard",()=>{
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 const consult=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 const view=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 assert.match(wizard,/Cercle gradué/);
 assert.match(wizard,/Graduated ring/);
 assert.match(wizard,/view==="graduated-ring"/);
 assert.match(wizard,/view\+"-minimum"/);
 assert.match(wizard,/view\+"-maximum"/);
 assert.match(consult,/slot\.view==="graduated-ring"/);
 assert.match(view,/ringProgress\(model\.ratio\)/);
 assert.match(view,/ringTicks\(24\)/);
 assert.match(view,/styles\.graduatedRingValue/);
 assert.match(view,/<output className=\{styles\.metricNumber\}>/);
 assert.match(view,/aria-hidden="true"/);
 assert.match(css,/\.graduatedRingSvg/);
});
