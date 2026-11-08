import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {readZip} from "../scripts/smn-397-office-poc.mjs";
import {insertOfficeTrendImages} from "../scripts/smn-402-office-chart-tags.mjs";
import {insertAdaptivePowerPointCharts} from "../scripts/smn-413-adaptive-pptx.mjs";
import {syntheticOfficeTemplate} from "../scripts/poc/smn-415-office-baseline.mjs";
import {composeAdaptiveChart,renderAdaptiveChartPng,CHART_STYLES} from "../scripts/smn-412-adaptive-chart.mjs";
import {PREDEFINED_CHART_STYLES,type ChartType} from "../src/server/reports/chart-style-contract";
import {createOfficeStyleSnapshot,createOfficeChartStyleResolver} from "../src/server/reports/office-chart-style-resolver";

const snap=createOfficeStyleSnapshot({styles:PREDEFINED_CHART_STYLES.map(s=>({
 id:s.id,revision:0,source:"builtin" as const,config:s.config
})),defaults:Object.fromEntries(CHART_STYLES.map(type=>[type,{styleId:"corporate",revision:1}]))});
const resolve=createOfficeChartStyleResolver(snap);
const target=(w:number,h:number)=>({widthEmu:w*3048,heightEmu:h*3048});
const cycles=Array.from({length:6},(_,i)=>({name:"Sprint "+(i+1)}));
const positiveSeries=[{name:"Terminé",unit:"SP",values:[1,0,4,7,3,9]},
 {name:"Initial",unit:"SP",values:[2,3,6,8,9,10]}];
const pngInfo=(bytes:Buffer)=>({
 png:bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
 width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)
});
test("one shared SVG/resvg function renders all six styles in Word and PowerPoint formats",()=>{
 for(const format of ["docx","pptx"] as const){
  for(const type of CHART_STYLES){
   const selected=resolve({type:type as ChartType});
   assert.equal(selected.id,"corporate");
   const series=type==="gauge"?positiveSeries.slice(0,1):positiveSeries;
   const dimensions=format==="docx"?target(960,560):target(1600,900);
   const scene=composeAdaptiveChart({target:dimensions,cycles,series,type,locale:"fr",style:selected.config});
   assert.ok(scene);
   assert.equal(scene.width,format==="docx"?960:1600);
   assert.ok(scene.svg.includes("#17345f"),"Corporate palette must be used");
   const png=renderAdaptiveChartPng({target:dimensions,cycles,series,type,locale:"fr",style:selected.config});
   assert.ok(png);
   assert.deepEqual(pngInfo(png),{png:true,width:format==="docx"?960:1600,height:format==="docx"?560:900});
  }
 }
});
test("custom chart styling changes SVG but does not alter the input data or legacy scene",()=>{
 const style=structuredClone(PREDEFINED_CHART_STYLES[0].config);
 style.common.title="Graphique personnalisé";
 style.common.palette[0]="#ff0000";
 style.common.labels.visible=true;
 style.types.line.marker="square";
 const input={target:target(1600,900),cycles,series:positiveSeries,type:"line" as const,locale:"fr" as const};
 const before=JSON.stringify(input);
 const legacy=composeAdaptiveChart(input);
 const customized=composeAdaptiveChart({...input,style});
 assert.ok(customized?.svg.includes("Graphique personnalisé"));
 assert.ok(customized?.svg.includes("#ff0000"));
 assert.ok(customized?.svg.includes("<rect"));
 assert.notEqual(customized?.svg,legacy?.svg);
 assert.equal(JSON.stringify(input),before);
});
test("styled grouped, horizontal and stacked bars handle negative values without modifying series",()=>{
 const style=structuredClone(PREDEFINED_CHART_STYLES[0].config);
 const series=[{name:"A",unit:"SP",values:[-5,0,3,7,8,6]},
  {name:"B",unit:"SP",values:[1,2,4,5,null,8]}];
 const reference=JSON.stringify(series);
 for(const orientation of ["horizontal","vertical"] as const){
  for(const mode of ["grouped","stacked"] as const){
   style.types.bar.orientation=orientation;
   style.types.bar.mode=mode;
   const scene=composeAdaptiveChart({target:target(1600,900),cycles,series,type:"bar",locale:"en",style});
   assert.ok(scene&&scene.svg.includes("viewBox"));
   assert.equal(scene.meta.points,11);
   if(mode==="stacked")assert.equal(scene.meta.stacked,true);
   if(orientation==="horizontal")assert.equal(scene.meta.horizontal,true);
  }
 }
 assert.equal(JSON.stringify(series),reference);
});
test("styled Word/PPTX adapters insert PNG and preserve untouched OPC parts",()=>{
 for(const format of ["docx","pptx"] as const){
  const source=syntheticOfficeTemplate(format,3,"horizontal");
  const before=readZip(source);
  const original=before.find(p=>p.name==="docProps/core.xml")!.data.toString("hex");
  const result=format==="docx"?
   insertOfficeTrendImages(source,"docx",(_index,options)=>{
    const selected=resolve(options);
    return renderAdaptiveChartPng({
     target:target(960,560),type:options.type,locale:"fr",cycles,
     series:options.type==="gauge"?positiveSeries.slice(0,1):positiveSeries,
     style:selected.config
    });
   }):
   insertAdaptivePowerPointCharts(source,targetDetails=>{
    const selected=resolve(targetDetails.options);
    return renderAdaptiveChartPng({
     target:targetDetails,type:targetDetails.options.type,locale:"fr",cycles,
     series:targetDetails.options.type==="gauge"?positiveSeries.slice(0,1):positiveSeries,
     style:selected.config
    });
   });
  assert.equal(result.changes.length,3);
  const output=readZip(result.bytes);
  assert.equal(output.find(p=>p.name==="docProps/core.xml")!.data.toString("hex"),original);
  assert.equal(output.filter(p=>p.name.endsWith(".png")).length,3);
  assert.ok(output.filter(p=>p.name.endsWith(".png")).every(p=>pngInfo(p.data).png));
  assert.deepEqual(readZip(source).find(p=>p.name==="docProps/core.xml")!.data,before.find(p=>p.name==="docProps/core.xml")!.data);
 }
});
test("legacy no-catalog path and report-archive source remain available",()=>{
 const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 const module=readFileSync("src/server/reports/office-indicator-charts.ts","utf8");
 assert.match(route,/loadOfficeStyleSnapshot/);
 assert.match(route,/resolveChartStyle\(target\.options\)/);
 assert.match(route,/resolveChartStyle\(options\)/);
 assert.match(route,/isSupportedOfficePackage/);
 assert.match(module,/renderOfficeIndicatorChart\(report,cycleId,options,locale\)/);
 assert.match(module,/renderOfficeIndicatorAdaptiveChart\(report,cycleId,options,locale,target\)/);
});
