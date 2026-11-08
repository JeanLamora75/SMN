import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {writeZip,readZip} from "../scripts/smn-397-office-poc.mjs";
import {parseOfficeChartTag,discoverOfficeChartTags} from "../scripts/smn-402-office-chart-tags.mjs";
import {discoverPowerPointChartTargets} from "../scripts/smn-411-chart-targets.mjs";
import {PREDEFINED_CHART_STYLES,CHART_TYPES,type ChartStyleConfig} from "../src/server/reports/chart-style-contract";
import {
 createOfficeStyleSnapshot,createOfficeChartStyleResolver,legacyOfficeStyleSnapshot,
 loadOfficeStyleSnapshot,OfficeChartStyleResolutionError
} from "../src/server/reports/office-chart-style-resolver";

const builtin=PREDEFINED_CHART_STYLES.map(s=>({
 id:s.id,revision:0,source:"builtin" as const,config:structuredClone(s.config)
}));
const custom={id:"my-company",revision:7,source:"custom" as const,
 config:structuredClone(PREDEFINED_CHART_STYLES[1].config) as ChartStyleConfig};
function snapshot(){
 return createOfficeStyleSnapshot({styles:[...builtin,custom],
  defaults:Object.fromEntries(CHART_TYPES.map(t=>[t,{styleId:"cockpit-agile",revision:3}]))});
}
const expects=(callback:()=>unknown,code:string)=>assert.throws(callback,
 (e:unknown)=>e instanceof OfficeChartStyleResolutionError&&e.code===code);

test("historical chart tag grammar remains byte-compatible, STYLE is optional",()=>{
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND}}"),{last:6,type:"bar",tags:null});
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6}}"),
  {last:6,type:"line",tags:["SP_DONE"]});
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND|STYLE=corporate|TYPE=line|LAST=4}}"),
  {last:4,type:"line",tags:null,style:"corporate"});
 for(const invalid of [
  "{{CHART:TREND|STYLE=A}}","{{CHART:TREND|STYLE=<svg>}}",
  "{{CHART:TREND|STYLE=-bad}}","{{CHART:TREND|STYLE=corporate|STYLE=minimal}}",
  "{{CHART:TREND|STYLE=a}}","{{CHART:TREND|STYLE=hello.world}}"
 ])assert.throws(()=>parseOfficeChartTag(invalid));
});

test("all six types obey tag > report > default > legacy priority",()=>{
 const catalog=snapshot();
 for(const type of CHART_TYPES){
  const report=createOfficeChartStyleResolver(catalog,"minimal");
  assert.deepEqual([report({type,style:"corporate"}).id,report({type,style:"corporate"}).source],
   ["corporate","tag"]);
  assert.deepEqual([report({type}).id,report({type}).source],["minimal","report"]);
  const defaults=createOfficeChartStyleResolver(catalog);
  assert.deepEqual([defaults({type}).id,defaults({type}).source],["cockpit-agile","default"]);
  const legacy=createOfficeChartStyleResolver(legacyOfficeStyleSnapshot());
  assert.deepEqual([legacy({type,style:"legacy"}).id,legacy({type,style:"legacy"}).source],
   ["legacy","legacy"]);
  assert.deepEqual([legacy({type}).id,legacy({type}).source],[null,"legacy"]);
  assert.equal(legacy({type,style:"corporate"}).source,"tag");
 }
});

test("custom styles and immutable snapshots survive concurrent catalog edits",()=>{
 const input={
  styles:[...builtin,custom],
  defaults:{line:{styleId:"my-company",revision:4}}
 };
 const catalog=createOfficeStyleSnapshot(input);
 const original=JSON.stringify(catalog);
 custom.config.common.palette[0]="#ff0000";
 input.defaults.line.styleId="corporate";
 assert.equal(JSON.stringify(catalog),original);
 assert.equal(Object.isFrozen(catalog),true);
 assert.equal(Object.isFrozen(catalog.styles[3].config.common.palette),true);
 assert.equal(createOfficeChartStyleResolver(catalog)({type:"line"}).id,"my-company");
 assert.equal(createOfficeChartStyleResolver(catalog)({type:"bar"}).source,"legacy");
});

test("unknown explicit tag/report never falls back silently to another style",()=>{
 const catalog=snapshot();
 expects(()=>createOfficeChartStyleResolver(catalog,"does-not-exist"),"office-chart-style-not-found");
 expects(()=>createOfficeChartStyleResolver(catalog,"<svg>"),"office-chart-invalid-style-id");
 const resolve=createOfficeChartStyleResolver(catalog,"minimal");
 expects(()=>resolve({type:"line",style:"missing-style"}),"office-chart-style-not-found");
 expects(()=>resolve({type:"line",style:"invalid!"}),"office-chart-invalid-style-id");
 expects(()=>resolve({type:"heatmap" as "line"}),"office-chart-invalid-style");
 const legacy=createOfficeChartStyleResolver(null);
 expects(()=>legacy({type:"line",style:"corporate"}),"office-chart-style-not-found");
});

test("corrupt configuration, broken revision or missing default cannot be published as snapshot",()=>{
 expects(()=>createOfficeStyleSnapshot({styles:[...builtin,
  {id:"bad-style",source:"custom",revision:1,config:{schemaVersion:7}}],defaults:{}}),
  "office-chart-style-corrupt");
 expects(()=>createOfficeStyleSnapshot({styles:builtin,defaults:{
  line:{styleId:"deleted-style",revision:1}
 }}),"office-chart-style-corrupt");
 expects(()=>createOfficeStyleSnapshot({styles:[builtin[0],builtin[0]],defaults:{}}),
  "office-chart-style-corrupt");
});

function syntheticDocx(tag:string){
 const xml='<w:document><w:body><w:p><w:r><w:t>'+tag+
  '</w:t></w:r></w:p></w:body></w:document>';
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:"word/document.xml",data:Buffer.from(xml)}
 ]);
}
function syntheticPptx(tag:string){
 const xml='<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '+
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>'+
  '<p:sp><p:nvSpPr><p:cNvPr id="7" name="Chart"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
  '<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="3086100"/></a:xfrm></p:spPr>'+
  '<p:txBody><a:p><a:r><a:t>'+tag+'</a:t></a:r></a:p></p:txBody></p:sp>'+
  '</p:spTree></p:cSld></p:sld>';
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:"ppt/presentation.xml",data:Buffer.from("<p:presentation/>")},
  {name:"ppt/slides/slide1.xml",data:Buffer.from(xml)}
 ]);
}
test("DOCX and PPTX discoverers carry STYLE through without mutating input",()=>{
 const tag="{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=3|STYLE=corporate}}";
 const word=syntheticDocx(tag),ppt=syntheticPptx(tag);
 const before=readZip(word).map(p=>p.data.toString("hex"));
 const docs=discoverOfficeChartTags(word,"docx");
 assert.equal(docs.length,1);
 assert.equal(docs[0].params.style,"corporate");
 const slides=discoverPowerPointChartTargets(ppt);
 assert.equal(slides.length,1);
 assert.equal(slides[0].options.style,"corporate");
 assert.ok(Object.isFrozen(slides[0].options));
 assert.deepEqual(readZip(word).map(p=>p.data.toString("hex")),before);
});

test("load a consistent read-only catalog once, then resolve many charts without SQL",async()=>{
 const calls:string[]=[];
 const config=structuredClone(PREDEFINED_CHART_STYLES[0].config) as ChartStyleConfig;
 const fake={
  query:async(sql:string)=>{
   calls.push(sql);
   if(sql.startsWith("BEGIN"))return {rows:[],rowCount:0};
   if(sql.includes("SELECT schema_version"))return {rows:[{schema_version:33}],rowCount:1};
   if(sql.includes("to_regclass"))return {rows:[{ok:true}],rowCount:1};
   if(sql.includes("SELECT id,name,description"))return {rows:[{
    id:"custom-brand",name:"Custom Brand",description:"",revision:2,
    schema_version:1,config,created_at:new Date(),updated_at:new Date()
   }],rowCount:1};
   if(sql.includes("SELECT chart_type,style_id"))return {rows:[{
    chart_type:"line",style_id:"custom-brand",revision:1
   }],rowCount:1};
   if(sql==="COMMIT")return {rows:[],rowCount:0};
   throw Error("unexpected SQL: "+sql);
  }
 } as unknown as Client;
 const catalog=await loadOfficeStyleSnapshot(fake,{id:"admin",role:"admin"});
 assert.equal(calls.filter(c=>c.startsWith("BEGIN")).length,1);
 assert.equal(calls.filter(c=>c==="COMMIT").length,1);
 const count=calls.length,resolve=createOfficeChartStyleResolver(catalog);
 for(let i=0;i<20;i++)assert.equal(resolve({type:"line"}).id,"custom-brand");
 assert.equal(calls.length,count);
});
