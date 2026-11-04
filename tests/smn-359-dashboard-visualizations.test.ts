import assert from "node:assert/strict";
import test from "node:test";
import {resolveVisualization,compatibleVisualizations,type DashboardVisualizationData} from "../src/server/dashboard-builder/visualizations";
import type {SourceDescriptor} from "../src/server/dashboard-builder/sources";
import {readFileSync} from "node:fs";
const source:SourceDescriptor={code:"indicator:1",name:"Points",category:"indicator",unit:"sp",scope:"cycle",permission:"read",status:"available",views:["number","card","gauge","line","bar"]};
const available=(value:number):DashboardVisualizationData=>({result:{state:"available",value,unit:"sp"}});
test("SMN-359 AC1: thumbnails only include compatible available views",()=>{
 assert.deepEqual(compatibleVisualizations(source).map(x=>x.kind),["number","card","gauge","line","bar"]);
 assert.deepEqual(compatibleVisualizations({...source,status:"unavailable"}),[]);
 assert.equal(resolveVisualization(source,"text",available(1)).state,"incompatible");
});
test("SMN-359 AC3: zero, null, missing and error are distinct",()=>{
 assert.deepEqual(resolveVisualization(source,"number",available(0)).value,0);
 assert.equal(resolveVisualization(source,"number",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(source,"number",{result:{state:"absent"}}).state,"absent");
 assert.equal(resolveVisualization(source,"number",{result:{state:"error"}}).state,"error");
});
test("SMN-359 AC4: gauges require valid bounds, including zero",()=>{
 assert.equal(resolveVisualization(source,"gauge",{...available(0),minimum:0,maximum:100}).ratio,0);
 assert.equal(resolveVisualization(source,"gauge",{...available(30),minimum:10,maximum:50}).ratio,0.5);
 for(const bounds of [{minimum:5,maximum:5},{minimum:10,maximum:0},{minimum:0,maximum:10}]){
  const value=bounds.maximum===10?11:5;
  assert.equal(resolveVisualization(source,"gauge",{...available(value),...bounds}).state,"invalid-bounds");
 }
 assert.equal(resolveVisualization(source,"gauge",available(20)).state,"invalid-bounds");
});
test("SMN-359 AC4: no history is different from partial history and snapshots survive",()=>{
 assert.equal(resolveVisualization(source,"line",available(4)).state,"no-history");
 assert.equal(resolveVisualization(source,"bar",{...available(4),points:[{label:"S1",value:null}]}).state,"no-history");
 const snapshot=resolveVisualization(source,"line",{...available(4),snapshot:true,points:[{label:"S1",value:0},{label:"S2",value:null},{label:"S3",value:4}]});
 assert.equal(snapshot.state,"ready");
 assert.equal(snapshot.snapshot,true);
 assert.deepEqual(snapshot.points?.map(p=>p.value),[0,null,4]);
});
test("SMN-359 AC2: view is part of persisted slot schema",()=>{
 const layout=readFileSync(new URL("../src/server/dashboard-builder/layout.ts",import.meta.url),"utf8");
 assert.match(layout,/view\?: string/);
 assert.match(layout,/resolveDashboardSource\(sources,slot.source,slot.view\)/);
});
test("SMN-359 AC4: theme-inheriting SVG and accessible textual data",()=>{
 const renderer=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-visualization.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-dimensions.module.css",import.meta.url),"utf8");
 assert.match(renderer,/role="img"/);
 assert.match(renderer,/aria-valuenow/);
 assert.match(renderer,/<figcaption className="visually-hidden">/);
 assert.match(renderer,/p\.value===null\?labels\.nullValue/);
 assert.match(css,/\.chartStroke\{[^}]*stroke:var\(--smn-brand\)/);
 assert.match(css,/\.chartLabel\{[^}]*fill:var\(--smn-muted\)/);
});
