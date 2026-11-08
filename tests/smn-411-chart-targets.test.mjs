import test from "node:test";
import assert from "node:assert/strict";
import {writeZip,readZip} from "../scripts/smn-397-office-poc.mjs";
import {discoverOfficeChartTags,parseOfficeChartTag} from "../scripts/smn-402-office-chart-tags.mjs";
import {
 EMU_PER_INCH,OfficeChartTargetError,discoverPowerPointChartTargets,emuToPixels
} from "../scripts/smn-411-chart-targets.mjs";

const wrap=(body)=>'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>'+body+'</p:spTree></p:cSld></p:sld>';
function shape(id,{tag="{{CHART:TREND}}",x=111,y=222,cx=5486400,cy=3086100,transform="",group=false,missing=false}={}){
 const xfrm=missing?"":'<a:xfrm'+transform+'><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm>';
 const body='<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Chart '+id+'"/></p:nvSpPr><p:spPr>'+xfrm+'</p:spPr><p:txBody><a:p><a:r><a:t>'+tag+'</a:t></a:r></a:p></p:txBody></p:sp>';
 return group?'<p:grpSp>'+body+'</p:grpSp>':body;
}
const pkg=(...slides)=>writeZip([
 {name:"[Content_Types].xml",data:Buffer.from('<Types/>')},
 {name:"ppt/presentation.xml",data:Buffer.from('<p:presentation/>')},
 ...slides.map((s,i)=>({name:"ppt/slides/slide"+(i+1)+".xml",data:Buffer.from(wrap(s))})),
 {name:"ppt/media/keep.png",data:Buffer.from("unchanged")}
]);
const error=(fn,code,part,shapeId=null)=>assert.throws(fn,e=>
 e instanceof OfficeChartTargetError&&e.code===code&&e.part===part&&e.shapeId===shapeId
);

test("read-only discoverer finds four independent chart frames and multiple slides",()=>{
 const input=pkg(
  shape(11,{cx:5486400,cy:3086100})+
  shape(12,{tag:"{{CHART:TREND|LAST=6|TYPE=line}}",cx:3657600,cy:3657600})+
  shape(13,{tag:"{{CHART:TREND|TAGS=SP_DONE|TYPE=bar}}",cx:1905000,cy:3429000})+
  shape(14,{tag:"FIXE"}),
  shape(11,{x:900000,y:123,cx:2743200,cy:1543050})
 );
 const before=readZip(input).map(p=>({name:p.name,bytes:p.data.toString("hex")}));
 const targets=discoverPowerPointChartTargets(input);
 assert.equal(targets.length,4);
 assert.deepEqual(targets.map(t=>[t.slide,t.shapeId]),[[1,"11"],[1,"12"],[1,"13"],[2,"11"]]);
 assert.equal(targets[0].xEmu,111);
 assert.equal(targets[0].yEmu,222);
 assert.equal(targets[0].widthEmu,5486400);
 assert.equal(targets[0].heightEmu,3086100);
 assert.equal(targets[0].ratio,16/9);
 assert.equal(targets[1].ratio,1);
 assert.ok(targets[2].ratio<1);
 assert.deepEqual(targets[1].options,{last:6,type:"line",tags:null});
 assert.deepEqual(targets[2].options.tags,["SP_DONE"]);
 assert.ok(Object.isFrozen(targets));
 assert.ok(Object.isFrozen(targets[2]));
 assert.ok(Object.isFrozen(targets[2].options));
 assert.ok(Object.isFrozen(targets[2].options.tags));
 assert.deepEqual(readZip(input).map(p=>({name:p.name,bytes:p.data.toString("hex")})),before);
});
test("converts 914400 EMU/inch to pixels at chosen density with correct aspect",()=>{
 assert.equal(EMU_PER_INCH,914400);
 assert.deepEqual(emuToPixels(5486400,3086100,300),{width:1800,height:1013,dpi:300});
 assert.deepEqual(emuToPixels(914400,914400,300),{width:300,height:300,dpi:300});
 assert.deepEqual(emuToPixels(914400,1828800,300),{width:300,height:600,dpi:300});
 for(const v of [[0,1],[1,-1],[1,0],[NaN,200],[Infinity,1],[1,1,0],[1,1,700]])
  assert.throws(()=>emuToPixels(...v),/office-chart-invalid-geometry/);
 assert.throws(()=>emuToPixels(20*EMU_PER_INCH,EMU_PER_INCH,300),/office-chart-target-over-budget/);
});
test("rejects nested grouped shapes with precise part and shape identifier",()=>{
 error(()=>discoverPowerPointChartTargets(pkg(shape(7,{group:true}))),
  "office-chart-unsupported-group","ppt/slides/slide1.xml","7");
});
test("rejects unsupported rotations and flips",()=>{
 for(const transform of [' rot="5400000"',' flipH="1"',' flipV="1"'])
  error(()=>discoverPowerPointChartTargets(pkg(shape(5,{transform}))),
   "office-chart-unsupported-transform","ppt/slides/slide1.xml","5");
});
test("refuses missing/zero/negative/invalid geometry without guessing fallback dimensions",()=>{
 const cases=[
  shape(8,{missing:true}),
  shape(8,{cx:0}),
  shape(8,{cx:-1}),
  shape(8,{cy:0}),
  shape(8,{cx:"9999999999999999999"})
 ];
 for(const body of cases)
  error(()=>discoverPowerPointChartTargets(pkg(body)),
   "office-chart-invalid-geometry","ppt/slides/slide1.xml","8");
});
test("rejects ambiguous text, invalid options, or extra paragraphs",()=>{
 for(const tag of ["{{CHART:TREND}} Texte","{{CHART:TREND|LAST=0}}","{{CHART:TREND|LAST=25}}",
  "{{CHART:TREND}}{{CHART:TREND}}","Avant {{CHART:TREND}}"]){
  const code=tag==="{{CHART:TREND|LAST=0}}"||tag==="{{CHART:TREND|LAST=25}}"?
   "office-chart-invalid-range":"office-chart-ambiguous-tag";
  error(()=>discoverPowerPointChartTargets(pkg(shape(9,{tag}))),
   code,"ppt/slides/slide1.xml","9");
 }
});
test("preserves fragmented legacy CHART tag syntax and SMN-402 independent discovery",()=>{
 const fragmented=shape(4,{tag:"{{CHART:TRE</a:t></a:r><a:r><a:t>ND|TAGS=SP_DONE|TYPE=line|LAST=3}}"});
 const data=pkg(fragmented);
 const newResults=discoverPowerPointChartTargets(data);
 const legacy=discoverOfficeChartTags(data,"pptx");
 assert.equal(newResults.length,1);
 assert.equal(legacy.length,1);
 assert.deepEqual(newResults[0].options,legacy[0].params);
 assert.deepEqual(parseOfficeChartTag(newResults[0].tag),legacy[0].params);
});
test("ignores simple non-chart text and returns immutable empty target array",()=>{
 const targets=discoverPowerPointChartTargets(pkg(shape(2,{tag:"Membres actifs"})));
 assert.deepEqual(targets,[]);
 assert.ok(Object.isFrozen(targets));
});
