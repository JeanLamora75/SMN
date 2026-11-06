import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {batterySegmentFills} from "../src/lib/dashboard-builder/battery-horizontal";
import {verticalBatteryFills} from "../src/lib/dashboard-builder/battery-vertical";
import {normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {SOURCE_VIEWS,resolveDashboardSource,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const indicator:SourceDescriptor={
 code:"indicator:one",name:"Capacité",category:"indicator",unit:"JH",scope:"cycle",permission:"read",
 status:"available",views:["battery-horizontal","battery-vertical"],
};
const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("SMN-393 AC1: vertical battery is a distinct indicator-only presentation",()=>{
 assert.ok(SOURCE_VIEWS.includes("battery-vertical"));
 assert.ok(compatibleVisualizations(indicator).some(x=>x.kind==="battery-vertical"));
 assert.equal(resolveDashboardSource([indicator],indicator.code,"battery-vertical").status,"available");
 assert.equal(resolveDashboardSource([indicator],indicator.code,"list").status,"incompatible");
 assert.equal(compatibleVisualizations({...indicator,status:"unavailable"}).length,0);
});
test("SMN-393 AC2: min/max must be explicit, finite and valid for persisted view",()=>{
 assert.deepEqual(normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"battery-vertical"),{minimum:0,maximum:100});
 assert.deepEqual(normalizeSlotOptions({minimum:-20,maximum:20},"indicator",[],"battery-vertical"),{minimum:-20,maximum:20});
 for(const invalid of [{},{minimum:0},{maximum:100},{minimum:10,maximum:10},{minimum:12,maximum:11},{minimum:0,maximum:Infinity}]){
  assert.throws(()=>normalizeSlotOptions(invalid,"indicator",[],"battery-vertical"),/dashboard-slot-scale-invalid/);
 }
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:100},"indicator",[],"card"),/dashboard-slot-option-incompatible/);
 assert.throws(()=>normalizeSlotOptions({minimum:0,maximum:100},"registry",[],"battery-vertical"),/dashboard-slot-scale-invalid/);
 const layout=read("server/dashboard-builder/layout.ts");
 assert.match(layout,/slot\.view==="battery-vertical"/);
});
test("SMN-393 AC3: correct single KPI normalized states, including negative domain",()=>{
 const resolved=(value:number,minimum=0,maximum=100)=>resolveVisualization(indicator,"battery-vertical",{
  result:{state:"available",value,unit:"JH"},minimum,maximum
 });
 assert.equal(resolved(0).ratio,0);
 assert.equal(resolved(40).ratio,.4);
 assert.equal(resolved(100).ratio,1);
 assert.equal(resolved(-5,-10,0).ratio,.5);
 assert.equal(resolved(110).state,"invalid-bounds");
 assert.equal(resolved(-1).state,"invalid-bounds");
 assert.equal(resolved(4,10,10).state,"invalid-bounds");
 assert.equal(resolveVisualization(indicator,"battery-vertical",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(indicator,"battery-vertical",{result:{state:"error"}}).state,"error");
});
test("SMN-393 AC1/3: six segments fill bottom first and allow partial segments",()=>{
 assert.deepEqual(verticalBatteryFills(0),[0,0,0,0,0,0]);
 assert.deepEqual(verticalBatteryFills(1),[1,1,1,1,1,1]);
 assert.deepEqual(verticalBatteryFills(.5),[0,0,0,1,1,1]);
 assert.deepEqual(verticalBatteryFills(.4),[0,0,0,.4,1,1]);
 assert.deepEqual(verticalBatteryFills(.4),[...batterySegmentFills(.4)].reverse());
 assert.deepEqual(verticalBatteryFills(Number.NaN),[0,0,0,0,0,0]);
});
test("SMN-393 AC4/5: vertical SVG, wizard preview and existing Cockpit CSS",()=>{
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 const consultation=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 const renderer=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 assert.match(wizard,/Pile verticale/);
 assert.match(wizard,/Vertical battery/);
 assert.match(wizard,/view==="battery-vertical"/);
 assert.match(wizard,/view\+"-minimum"/);
 assert.match(wizard,/view\+"-maximum"/);
 assert.match(consultation,/slot\.view==="battery-vertical"/);
 assert.match(renderer,/verticalBatteryFills\(model\.ratio\)/);
 assert.match(renderer,/className=\{styles\.batteryVertical\}/);
 assert.match(renderer,/aria-hidden="true"/);
 assert.match(renderer,/<output className=\{styles\.metricNumber\}>/);
 assert.match(css,/\.batteryVertical/);
 assert.match(css,/var\(--smn-brand\)/);
});
