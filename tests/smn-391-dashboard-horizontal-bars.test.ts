import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {horizontalBarGeometry,shortCycleLabel} from "../src/lib/dashboard-builder/horizontal-bars";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {resolveDashboardSource,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const source:SourceDescriptor={code:"indicator:one",name:"Vélocité",category:"indicator",unit:"SP",scope:"cycle",permission:"read",status:"available",views:["bar","bar-horizontal"]};
const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("SMN-391 AC1: horizontal bar is a distinct indicator visualization",()=>{
 assert.ok(compatibleVisualizations(source).some(v=>v.kind==="bar-horizontal"));
 assert.equal(resolveDashboardSource([source],source.code,"bar-horizontal").status,"available");
 assert.equal(resolveDashboardSource([source],source.code,"list").status,"incompatible");
 assert.equal(compatibleVisualizations({...source,status:"unavailable"}).length,0);
});
test("SMN-391 AC2/3: historical series preserves snapshots, zeros and gaps",()=>{
 const points=[{label:"Sprint 1",value:-6},{label:"Sprint 2",value:0},{label:"Sprint 3",value:null},{label:"Sprint 4",value:12}];
 const value=resolveVisualization(source,"bar-horizontal",{result:{state:"available",value:12,unit:"SP"},points,snapshot:true});
 assert.equal(value.state,"ready");assert.equal(value.kind,"bar-horizontal");assert.equal(value.snapshot,true);
 assert.deepEqual(value.points,points);
 assert.equal(resolveVisualization(source,"bar-horizontal",{result:{state:"available",value:0,unit:"SP"},points:[{label:"S1",value:0}]}).state,"ready");
 assert.equal(resolveVisualization(source,"bar-horizontal",{result:{state:"available",value:0,unit:"SP"},points:[{label:"S1",value:null}]}).state,"no-history");
 assert.equal(resolveVisualization(source,"bar-horizontal",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(source,"bar-horizontal",{result:{state:"error"}}).state,"error");
});
test("SMN-391 AC3: axis has a zero origin and negative / zero / positive geometry",()=>{
 const g=horizontalBarGeometry([-6,0,12,null],420);
 assert.ok(g.xZero>g.xLeft&&g.xZero<g.xRight);
 assert.ok(g.bars[0]&&g.bars[0].x<g.xZero&&g.bars[0].width>0);
 assert.deepEqual(g.bars[1],{x:g.xZero,width:0});
 assert.ok(g.bars[2]&&g.bars[2].x===g.xZero&&g.bars[2].width>0);
 assert.equal(g.bars[3],null);
 assert.equal(horizontalBarGeometry([0,0],420).bars[0]?.width,0);
 assert.ok(horizontalBarGeometry([-4,-2],420).xZero>horizontalBarGeometry([-4,-2],420).xLeft);
});
test("SMN-391 AC4: long labels clipped in visible chart but preserved in tooltip",()=>{
 assert.equal(shortCycleLabel("Sprint de livraison numéro douze",14).length<=14,true);
 assert.equal(shortCycleLabel("Sprint 1",14),"Sprint 1");
 const renderer=read("app/app/dashboard-builder/dashboard-visualization.tsx");
 const css=read("app/app/dashboard-builder/dashboard-dimensions.module.css");
 assert.match(renderer,/className=\{styles\.horizontalBarChart\}/);
 assert.match(renderer,/<title>\{p\.label\}/);
 assert.match(renderer,/<figcaption className="visually-hidden">/);
 assert.match(css,/\.horizontalBarChart\{/);
 assert.match(css,/overflow-x:hidden/);
});
test("SMN-391 AC2/5: same historical producer and distinct wizard choice",()=>{
 const sources=read("server/dashboard-builder/sources.ts");
 const batch=read("server/dashboard-builder/batch.ts");
 const consultation=read("app/app/dashboard-builder/dashboard-consultation.tsx");
 const wizard=read("app/app/dashboard-builder/slot-wizard.tsx");
 assert.match(sources,/"bar-horizontal"/);
 assert.match(batch,/r\.view==="bar-horizontal"/);
 assert.match(batch,/loadHistoricalResolver/);
 assert.match(consultation,/\["line","bar","bar-horizontal"\]/);
 assert.match(wizard,/Histogramme horizontal/);
 assert.match(wizard,/Horizontal bar chart/);
 assert.match(wizard,/view==="bar-horizontal"/);
});
