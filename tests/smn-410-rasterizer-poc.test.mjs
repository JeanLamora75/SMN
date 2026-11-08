import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,cpSync,mkdtempSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {
 LIMITS,TARGETS,FIXTURE,validateTarget,inspectPng,svgForTarget,rasterizeWithResvg,compareRenderers
} from "../scripts/poc/smn-410-rasterizer-poc.mjs";
import {renderOfficeTrendPng} from "../scripts/smn-402-trend-png.mjs";

test("limits refuse invalid geometry and oversized targets",()=>{
 assert.deepEqual(validateTarget(1600,900),{width:1600,height:900});
 for(const dims of [[0,900],[-1,40],[4097,50],[4096,4096],[1.5,900],[900,Infinity]]){
  assert.throws(()=>validateTarget(...dims),/office-poc-invalid-target/);
 }
 assert.deepEqual(LIMITS,{maxPngBytes:8*1024*1024,maxAxis:4096,maxPixels:16_000_000});
});
test("SVG uses physical target ratio and preserves French accents and missing data",()=>{
 for(const {width,height} of TARGETS){
  const svg=svgForTarget(width,height,"fr");
  assert.ok(svg.includes('viewBox="0 0 '+width+" "+height+'"'));
  assert.match(svg,/Vélocité réalisée – Équipe à Paris/);
  assert.match(svg,/font-family="Arial, sans-serif"/);
  assert.equal((svg.match(/<circle/g)||[]).length,13);
 }
 const en=svgForTarget(1600,900,"en");
 assert.match(en,/Completed velocity – Team in Paris/);
 assert.throws(()=>svgForTarget(200,100,"de"),/office-poc-invalid-locale/);
});
test("existing Office bitmap renderer remains untouched and provides 960 by 560 baseline",()=>{
 const png=renderOfficeTrendPng({...FIXTURE,type:"line",language:"fr"});
 const meta=inspectPng(png);
 assert.equal(meta.width,960);
 assert.equal(meta.height,560);
 const source=readFileSync("scripts/smn-402-trend-png.mjs","utf8");
 assert.match(source,/const W=960,H=560/);
});
test("standalone renderer outputs valid PNG for all three ratios and both locales",()=>{
 for(const {width,height} of TARGETS){
  for(const locale of ["fr","en"]){
   const png=rasterizeWithResvg(svgForTarget(width,height,locale));
   const meta=inspectPng(png);
   assert.equal(meta.width,width);
   assert.equal(meta.height,height);
   assert.ok(meta.bytes<LIMITS.maxPngBytes);
  }
 }
});
test("four independent images stay under budget; comparison records package and platform evidence",()=>{
 const result=compareRenderers();
 assert.equal(result.imageSamples.length,6);
 assert.equal(result.fourCharts.count,4);
 assert.ok(result.fourCharts.bytes.every(n=>n>0&&n<LIMITS.maxPngBytes));
 assert.equal(result.candidate.package,"@resvg/resvg-js");
 assert.equal(result.candidate.version,"2.6.2");
 assert.equal(result.candidate.usesExternalBrowser,false);
 assert.equal(result.baseline.width,960);
 assert.equal(result.baseline.height,560);
 assert.ok(result.candidate.license);
});
test("invalid image and over-budget buffer are refused",()=>{
 assert.throws(()=>inspectPng(Buffer.alloc(100)),/office-poc-invalid-png/);
 const oversized=Buffer.alloc(LIMITS.maxPngBytes+1);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(oversized);
 assert.throws(()=>inspectPng(oversized),/office-poc-png-too-large/);
});

test("portable candidate loads in a copied directory without npm or a downloaded browser",()=>{
 const root=mkdtempSync(join(tmpdir(),"smn-410-portable-"));
 try{
  const dir=join(root,".smn-410-poc");
  mkdirSync(dir,{recursive:true});
  cpSync(resolve(".smn-410-poc","node_modules"),join(dir,"node_modules"),{recursive:true});
  // A fresh Node process can load the copied native binary using only local files.
  const script=[
   'const {Resvg}=require("./.smn-410-poc/node_modules/@resvg/resvg-js");',
   'const svg="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"400\\" height=\\"240\\"><text x=\\"10\\" y=\\"80\\">Équipe</text></svg>";',
   'const png=new Resvg(svg).render().asPng();',
   'if(png.readUInt32BE(16)!==400||png.readUInt32BE(20)!==240)process.exit(2);',
   'console.log("portable-offline-ok");'
  ].join("\n");
  const child=spawnSync(process.execPath,["-e",script],{
   cwd:root,encoding:"utf8",timeout:20000,
   env:{...process.env,npm_config_offline:"true",HTTP_PROXY:"",HTTPS_PROXY:""}
  });
  assert.equal(child.status,0,child.stderr||child.error?.message);
  assert.match(child.stdout,/portable-offline-ok/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
