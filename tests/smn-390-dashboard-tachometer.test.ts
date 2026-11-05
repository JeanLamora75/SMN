import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";
import {resolveTachometerRatio,tachometerNeedle} from "../src/lib/dashboard-builder/tachometer";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {SOURCE_VIEWS,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const indicator:SourceDescriptor={code:"indicator:one",name:"Vélocité",category:"indicator",unit:"SP",scope:"cycle",
 permission:"read",status:"available",views:["number","card","tachometer"]};
const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("SMN-390 AC1: tachometer is an additional indicator-only view",()=>{
 assert.equal(SOURCE_VIEWS.filter(view=>view==="tachometer").length,1);
 assert.ok(compatibleVisualizations(indicator).some(item=>item.kind==="tachometer"));
 assert.equal(resolveVisualization(indicator,"tachometer",{result:{state:"available",value:0,unit:"SP"},minimum:0,maximum:100}).ratio,0);
 assert.equal(resolveVisualization(indicator,"tachometer",{result:{state:"available",value:50,unit:"SP"},minimum:0,maximum:100}).ratio,.5);
 assert.equal(resolveVisualization(indicator,"tachometer",{result:{state:"available",value:100,unit:"SP"},minimum:0,maximum:100}).ratio,1);
 assert.equal(resolveVisualization(indicator,"tachometer",{result:{state:"null"}}).state,"null");
});
test("SMN-390 AC2/3: no silent clamping or imaginary scale",()=>{
 for(const [value,min,max] of [[0,0,0],[1,2,1],[200,0,100],[-1,0,100],[1,Number.NaN,100],[1,0,Number.POSITIVE_INFINITY]]){
  assert.equal(resolveTachometerRatio(value,min,max),null);
 }
 assert.equal(resolveTachometerRatio(-5,-10,0),.5);
 assert.equal(resolveTachometerRatio(0,0,100),0);
 assert.equal(resolveTachometerRatio(100,0,100),1);
 assert.deepEqual(tachometerNeedle(0),{x:34,y:128});
 assert.ok(Math.abs(tachometerNeedle(.5).x-130)<1e-9);
 assert.ok(Math.abs(tachometerNeedle(.5).y-32)<1e-9);
 assert.deepEqual(tachometerNeedle(1),{x:226,y:128});
});
test("SMN-390 AC2/4: scale persisted as presentation-only fields",()=>{
 assert.deepEqual(normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"tachometer"),{minimum:0,maximum:100});
 assert.deepEqual(normalizeSlotOptions({minimum:-20,maximum:20},"indicator",[],"tachometer"),{minimum:-20,maximum:20});
 for(const opts of [{},{minimum:0},{maximum:100},{minimum:20,maximum:20},{minimum:101,maximum:100},
  {minimum:"0" as unknown as number,maximum:100},{minimum:0,maximum:Infinity}]){
  assert.throws(()=>normalizeSlotOptions(opts,"indicator",[],"tachometer"),/dashboard-slot-scale-invalid/);
 }
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:100},"registry",[],"list"),/dashboard-slot-option-incompatible/);
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"card"),/dashboard-slot-option-incompatible/);
 const layout=read("server/dashboard-builder/layout.ts");
 assert.match(layout,/normalizeSlotOptions\(slot\.filters as SlotOptions,category,.*slot\.view/);
});
test("SMN-390 AC1/5: only one value and accessible SVG on existing cockpit styles",()=>{
 const view=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 const consultation=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(view,/model\.kind==="tachometer"/);
 assert.match(view,/aria-hidden="true"/);
 assert.match(view,/tachometerNeedle/);
 assert.match(css,/\.tachometer/);
 assert.match(wizard,/Tachymètre/);
 assert.match(wizard,/minimum/);
 assert.match(wizard,/maximum/);
 assert.match(wizard,/0–100/);
 assert.match(consultation,/resolveTachometerRatio/);
});
