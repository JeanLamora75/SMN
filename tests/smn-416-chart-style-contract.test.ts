import test from "node:test";
import assert from "node:assert/strict";
import {
 CHART_TYPES,PREDEFINED_CHART_STYLES,DEFAULT_STYLE_ID,ChartStyleError,
 validChartStyleConfig,validChartStyleId,parseChartStyleCommand
} from "../src/server/reports/chart-style-contract";

const preset=()=>structuredClone(PREDEFINED_CHART_STYLES[0].config);
test("global catalog defines three named presets and exactly six types",()=>{
 assert.deepEqual(CHART_TYPES,["bar","line","area","pie","donut","gauge"]);
 assert.equal(PREDEFINED_CHART_STYLES.length,3);
 assert.deepEqual(PREDEFINED_CHART_STYLES.map(s=>s.id),["cockpit-agile","corporate","minimal"]);
 assert.equal(DEFAULT_STYLE_ID,"cockpit-agile");
 assert.ok(PREDEFINED_CHART_STYLES.every(s=>validChartStyleConfig(s.config)));
 assert.equal(new Set(PREDEFINED_CHART_STYLES.map(s=>s.id)).size,3);
});
test("strict schema rejects injection, unknown keys, extreme numbers and malformed colors",()=>{
 const bad=[
  (c:ReturnType<typeof preset>)=>{(c.common as Record<string,unknown>).svg='<svg onload="evil()">';},
  (c:ReturnType<typeof preset>)=>{c.common.palette=["javascript:alert(1)"];},
  (c:ReturnType<typeof preset>)=>{c.common.title="<script>alert(1)</script>";},
  (c:ReturnType<typeof preset>)=>{c.common.labels.decimals=5;},
  (c:ReturnType<typeof preset>)=>{c.types.gauge.min=50;c.types.gauge.max=20;},
  (c:ReturnType<typeof preset>)=>{c.types.donut.innerRadiusPercent=99;},
  (c:ReturnType<typeof preset>)=>{c.types.area.opacity=Infinity;},
  (c:ReturnType<typeof preset>)=>{(c.types.line as Record<string,unknown>).rawSvg='<circle />';},
  (c:ReturnType<typeof preset>)=>{c.types.gauge.thresholds=[80,50];}
 ];
 for(const change of bad){const c=preset();change(c);assert.equal(validChartStyleConfig(c),false);}
 assert.equal(validChartStyleConfig({schemaVersion:2,common:{},types:{}}),false);
 assert.equal(validChartStyleConfig(null),false);
});
test("create, update, delete and per-type defaults use a strict revision contract",()=>{
 const config=preset();
 const created=parseChartStyleCommand({action:"create",id:"custom-blue",name:" Bleu ",description:"",config});
 assert.equal(created.action,"create");if(created.action==="create")assert.equal(created.name,"Bleu");
 const updated=parseChartStyleCommand({action:"update",id:"custom-blue",name:"Bleu",description:"A",config,revision:1});
 assert.equal(updated.action,"update");
 const deleted=parseChartStyleCommand({action:"delete",id:"custom-blue",revision:2});
 assert.equal(deleted.action,"delete");
 const choice=parseChartStyleCommand({action:"set-default",type:"line",styleId:"custom-blue",revision:0});
 assert.equal(choice.action,"set-default");
 for(const input of [
  {action:"create",id:"corporate",name:"Duplicate",description:"",config},
  {action:"create",id:"custom-blue",name:"X",description:"",config,role:"admin"},
  {action:"delete",id:"custom-blue",revision:-1},
  {action:"set-default",type:"heatmap",styleId:"custom-blue",revision:0},
  {action:"set-default",type:"line",styleId:"<svg>",revision:0},
  {action:"update",id:"custom-blue",name:"X",description:"",config,revision:1.5}
 ])assert.throws(()=>parseChartStyleCommand(input),(e:unknown)=>e instanceof ChartStyleError&&e.code==="invalid-input");
 assert.equal(validChartStyleId("custom-blue"),true);
 assert.equal(validChartStyleId("A!"),false);
});
