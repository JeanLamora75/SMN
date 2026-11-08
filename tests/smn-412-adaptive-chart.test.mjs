import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {composeAdaptiveChart,renderAdaptiveChartPng,OfficeChartLayoutError,CHART_STYLES} from "../scripts/smn-412-adaptive-chart.mjs";
import {EMU_PER_INCH} from "../scripts/smn-411-chart-targets.mjs";
import {inspectPng} from "../scripts/poc/smn-410-rasterizer-poc.mjs";

const target=(width,height)=>({widthEmu:Math.round(width/300*EMU_PER_INCH),heightEmu:Math.round(height/300*EMU_PER_INCH)});
const cycles=Array.from({length:6},(_,i)=>({name:"Sprint de la vélocité "+(i+101)}));
const series=[{name:"Vélocité réalisée",tag:"SP_DONE",values:[12,35,null,0,57,30]},
 {name:"Capacité prévue",tag:"CAPACITY",values:[18,40,32,20,60,45]}];
const fixture=(width=1600,height=900,type="line",s=series,c=cycles)=>({target:target(width,height),cycles:c,series:s,type,locale:"fr"});
const isError=(f,code)=>assert.throws(f,e=>e instanceof OfficeChartLayoutError&&e.code===code);

test("6 chart types render valid PNGs at wide, square, portrait dimensions in both locales",()=>{
 for(const [w,h] of [[1600,900],[1200,1200],[900,1600]]){
  for(const type of CHART_STYLES){
   for(const locale of ["fr","en"]){
    const args={...fixture(w,h,type,type==="gauge"?[{name:"Taux réalisé",values:[20,55,null,0,73,68]}]:series),locale};
    const scene=composeAdaptiveChart(args);
    assert.ok(scene);
    assert.ok(Object.isFrozen(scene)&&Object.isFrozen(scene.meta));
    assert.equal(scene.width,w);assert.equal(scene.height,h);
    assert.ok(scene.svg.startsWith("<svg"));
    assert.ok(!scene.svg.includes("TENDANCES DES INDICATEURS"));
    assert.ok(!scene.svg.includes("INDICATOR TRENDS"));
    assert.ok(!scene.svg.includes("<script"));
    const png=renderAdaptiveChartPng(args);
    assert.deepEqual(inspectPng(png).width,w);
    assert.equal(inspectPng(png).height,h);
    assert.ok(png.length<8*1024*1024);
   }
  }
 }
});

test("null stays absent, zero is genuine, deterministic scene and no repeated internal header",()=>{
 const args=fixture();
 const a=composeAdaptiveChart(args),b=composeAdaptiveChart(args);
 assert.equal(createHash("sha256").update(a.svg).digest("hex"),createHash("sha256").update(b.svg).digest("hex"));
 assert.equal(a.meta.points,11);
 assert.match(a.svg,/Vélocité réalisée/);
 assert.equal((a.svg.match(/<circle/g)||[]).length,11);
 assert.ok(!a.svg.includes("Tendances des indicateurs"));
 assert.ok(!a.svg.includes(">Série 1<"));
});

test("one and six compatible series, 1 and 24 cycles, long labels, negative values",()=>{
 for(const count of [1,6]){
  const s=Array.from({length:count},(_,i)=>({name:"Équipe "+(i+1),values:[-10+i,0,8+i,11+i,null,19+i]}));
  for(const type of ["bar","line","area"]){
   const scene=composeAdaptiveChart(fixture(1600,900,type,s));
   assert.ok(scene);
   assert.equal(scene.meta.points,5*count);
   assert.ok(scene.meta.range[0]<0);
  }
 }
 const long=Array.from({length:24},(_,i)=>({name:"Iteration très longue de production "+(i+1)}));
 const s=[{name:"Qualité des livraisons",values:long.map((_,i)=>i%7===0?null:i*4)}];
 const scene=composeAdaptiveChart(fixture(2200,1300,"line",s,long));
 assert.ok(scene.meta.rotated);
 assert.equal(scene.meta.labels.length,24);
 assert.ok(scene.svg.includes('rotate(-45'));
 assert.ok(scene.meta.labels.some(x=>/^S\d+$/.test(x)));
});

test("labels are escaped safely and numeric formatting is localized",()=>{
 const s=[{name:'Équipe & "<b>"',values:[0,1.23,null,4,6,9]},
  {name:"Deuxième série",values:[1,2,3,4,5,6]}];
 const scene=composeAdaptiveChart(fixture(1600,900,"bar",s));
 assert.match(scene.svg,/Équipe &amp; &quot;&lt;b&gt;&quot;/);
 assert.match(scene.svg,/>2,25</);
 assert.ok(!scene.svg.includes("<b>"));
});

test("unsupported styles, invalid cycle lengths, mismatched series and nonfinite values fail",()=>{
 isError(()=>composeAdaptiveChart(fixture(1600,900,"heatmap")),"office-chart-invalid-style");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"line",[],cycles)),"office-chart-invalid-series");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"line",[{values:[1,2]}])),"office-chart-invalid-values");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"line",[{values:[1,2,3,4,5,Infinity]}])),"office-chart-invalid-values");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"line",series,Array.from({length:25},(_,i)=>({name:"S"+i})))),"office-chart-invalid-series");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"gauge",series)),"office-chart-gauge-one-series");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"line",[{unit:"SP",values:[1,2,3,4,5,6]},{unit:"JH",values:[2,3,4,5,6,7]}])),"office-chart-incompatible-unit");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"gauge",[{values:[1,2,3,4,5,101]}])),"office-chart-gauge-range");
 isError(()=>composeAdaptiveChart(fixture(1600,900,"pie",[{values:[1,2,3,4,5,-1]}])),"office-chart-negative-share");
});

test("missing-only series produces no image and data with real zero remains expressible",()=>{
 assert.equal(composeAdaptiveChart(fixture(1600,900,"line",[{values:[null,null,null,null,null,null]}])),null);
 assert.equal(renderAdaptiveChartPng(fixture(1600,900,"line",[{values:[null,null,null,null,null,null]}])),null);
 const gauge=composeAdaptiveChart(fixture(1600,900,"gauge",[{values:[null,0,null,0,null,0]}]));
 assert.ok(gauge&&gauge.svg.includes(">0 %</text>"));
 const zero=composeAdaptiveChart(fixture(1600,900,"bar",[{values:[null,0,null,0,null,0]}]));
 assert.ok(zero&&zero.meta.points===3);
});

test("frame too small or oversized fails explicitly without silent downsampling",()=>{
 isError(()=>composeAdaptiveChart(fixture(400,220)),"office-chart-frame-too-small");
 isError(()=>composeAdaptiveChart(fixture(4300,1000)),"office-chart-target-over-budget");
 isError(()=>composeAdaptiveChart({...fixture(),target:{widthEmu:0,heightEmu:0}}),"office-chart-invalid-geometry");
});

test("renderer does not modify legacy production export path or core chart semantics",async()=>{
 const fs=await import("node:fs");
 const production=fs.readFileSync("src/server/reports/office-indicator-charts.ts","utf8");
 assert.match(production,/renderOfficeTrendPng/);
 assert.match(production,/export function renderOfficeIndicatorChart/);
 assert.match(production,/return renderOfficeTrendPng/);
 assert.match(production,/export function renderOfficeIndicatorAdaptiveChart/);
 const source=fs.readFileSync("scripts/smn-412-adaptive-chart.mjs","utf8");
 assert.match(source,/emuToPixels/);
 assert.match(source,/rasterizeWithResvg/);
});
