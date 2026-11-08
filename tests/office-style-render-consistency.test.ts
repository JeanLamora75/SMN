import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {CHART_TYPES,PREDEFINED_CHART_STYLES,type ChartType} from "../src/server/reports/chart-style-contract";
import {createOfficeStyleSnapshot,createOfficeChartStyleResolver} from "../src/server/reports/office-chart-style-resolver";
import {composeAdaptiveChart,renderAdaptiveChartPng} from "../scripts/smn-412-adaptive-chart.mjs";
import {syntheticOfficeTemplate} from "../scripts/poc/smn-415-office-baseline.mjs";
import {readZip} from "../scripts/smn-397-office-poc.mjs";
import {insertOfficeTrendImages} from "../scripts/smn-402-office-chart-tags.mjs";
import {insertAdaptivePowerPointCharts} from "../scripts/smn-413-adaptive-pptx.mjs";

const snapshot=createOfficeStyleSnapshot({
 styles:PREDEFINED_CHART_STYLES.map(item=>({
  id:item.id,source:"builtin" as const,revision:0,config:item.config
 })),
 defaults:Object.fromEntries(CHART_TYPES.map(type=>[type,{styleId:"cockpit-agile",revision:1}]))
});
const cycles=Array.from({length:6},(_,i)=>({name:"S"+(i+1)}));
const series=[{name:"Done",unit:"SP",values:[8,12,10,16,14,19]},
 {name:"Planned",unit:"SP",values:[13,14,16,18,17,21]}];
const target={widthEmu:960*3048,heightEmu:560*3048};
const digest=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");
const png=(styleId:string,dimension=target)=>{
 const selected=createOfficeChartStyleResolver(snapshot,styleId)({type:"bar"});
 assert.ok(selected.config);
 const bytes=renderAdaptiveChartPng({
  type:"bar",cycles,series,target:dimension,locale:"fr",style:selected.config
 });
 assert.ok(bytes);
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 return bytes;
};
test("preview and export use the same SVG/resvg render function and palette",()=>{
 const gallery=readFileSync("src/app/app/admin/settings/reports/charts/style-gallery.tsx","utf8");
 const preview=readFileSync("src/app/api/admin/reports/chart-styles/preview/route.ts","utf8");
 const exportRoute=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 const shared=readFileSync("src/server/reports/office-indicator-charts.ts","utf8");
 assert.match(gallery,/fetch\("\/api\/admin\/reports\/chart-styles\/preview"/);
 assert.match(preview,/renderAdaptiveChartPng/);
 assert.match(shared,/renderAdaptiveChartPng/);
 assert.match(exportRoute,/resolveChartStyle\(options\)/);
 assert.match(exportRoute,/resolveChartStyle\(target\.options\)/);
 for(const style of PREDEFINED_CHART_STYLES){
  const scene=composeAdaptiveChart({
   type:"bar",cycles,series,target,locale:"fr",style:style.config
  });
  assert.ok(scene);
  assert.ok(scene.svg.includes(style.config.common.palette[0]));
 }
});
test("style selection produces different actual PNG pixels, not just different labels",()=>{
 const corporate=png("corporate"),minimal=png("minimal"),cockpit=png("cockpit-agile");
 assert.notEqual(digest(corporate),digest(minimal));
 assert.notEqual(digest(cockpit),digest(corporate));
 assert.notEqual(digest(cockpit),digest(minimal));
 const again=png("corporate");
 assert.equal(digest(corporate),digest(again),"render must be deterministic");
});
test("Word and PowerPoint embeds preserve different selected style PNG images",()=>{
 for(const format of ["docx","pptx"] as const){
  const source=syntheticOfficeTemplate(format,1,"horizontal");
  const output=(styleId:string)=>{
   const resolver=createOfficeChartStyleResolver(snapshot,styleId);
   return format==="docx"?
    insertOfficeTrendImages(source,"docx",(_index:number,options:{
     type:ChartType;last:number;tags:string[]|null;style?:string
    })=>{
     const resolved=resolver(options);
     assert.ok(resolved.config);
     return renderAdaptiveChartPng({target,cycles,series,type:options.type,locale:"fr",style:resolved.config});
    }).bytes:
    insertAdaptivePowerPointCharts(source,(data:{options:{
     type:ChartType;last:number;tags:string[]|null;style?:string
    };widthEmu:number;heightEmu:number})=>{
     const resolved=resolver(data.options);
     assert.ok(resolved.config);
     return renderAdaptiveChartPng({target:data,cycles,series,type:data.options.type,locale:"fr",style:resolved.config});
    }).bytes;
  };
  const images=(id:string)=>readZip(output(id)).filter(x=>x.name.endsWith(".png")).map(x=>x.data);
  const a=images("corporate"),b=images("minimal");
  assert.equal(a.length,1);
  assert.equal(b.length,1);
  assert.notEqual(digest(a[0]),digest(b[0]),format+" must embed selected style pixels");
 }
});
test("explicit tag style takes precedence over optional export style",()=>{
 for(const type of CHART_TYPES){
  const resolver=createOfficeChartStyleResolver(snapshot,"corporate");
  const chosen=resolver({type,style:"minimal"});
  assert.equal(chosen.id,"minimal");
  assert.equal(chosen.source,"tag");
  assert.deepEqual(chosen.config,PREDEFINED_CHART_STYLES.find(s=>s.id==="minimal")?.config);
 }
});
