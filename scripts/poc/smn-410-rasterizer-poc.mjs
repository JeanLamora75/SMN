// Standalone benchmark; this file is not imported by the production Office engine.
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {performance} from "node:perf_hooks";
import {mkdirSync,writeFileSync} from "node:fs";
import {renderOfficeTrendPng} from "../smn-402-trend-png.mjs";

export const LIMITS=Object.freeze({maxPngBytes:8*1024*1024,maxAxis:4096,maxPixels:16_000_000});
export const TARGETS=Object.freeze([
 {id:"wide",width:1600,height:900},
 {id:"square",width:1200,height:1200},
 {id:"portrait",width:900,height:1600},
]);
export const FIXTURE=Object.freeze({
 cycles:Array.from({length:6},(_,i)=>({name:"Sprint "+(101+i)})),
 series:[{name:"Vélocité réalisée",tag:"SP_DONE",values:[34,48,null,59,0,63]},
         {name:"Capacité prévue",tag:"CAPACITY",values:[52,57,54,60,61,62]}]
});
const escapeXml=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
 .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export function validateTarget(width,height){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||
    width>LIMITS.maxAxis||height>LIMITS.maxAxis||width*height>LIMITS.maxPixels)
  throw Error("office-poc-invalid-target");
 return {width,height};
}
export function inspectPng(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<24||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
  throw Error("office-poc-invalid-png");
 if(bytes.length>LIMITS.maxPngBytes)throw Error("office-poc-png-too-large");
 return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};
}
export function svgForTarget(width,height,locale="fr"){
 validateTarget(width,height);
 if(!["fr","en"].includes(locale))throw Error("office-poc-invalid-locale");
 const f=width/1600,fh=height/900,pad=Math.max(32,Math.round(width*.065));
 const title=locale==="fr"?"Vélocité réalisée – Équipe à Paris":"Completed velocity – Team in Paris";
 const x0=pad+85*f,x1=width-pad,y0=Math.round(height*.16),y1=Math.round(height*.80);
 const max=80,n=FIXTURE.cycles.length;
 const point=(value,i)=>({x:x0+(i+.5)*(x1-x0)/n,y:y1-value/max*(y1-y0)});
 const series=FIXTURE.series.map((s,si)=>{
  const chunks=[];let current=[],marks="";
  s.values.forEach((v,i)=>{
   if(v===null){if(current.length>1)chunks.push(current);current=[];return;}
   const p=point(v,i);
   current.push(p.x.toFixed(1)+","+p.y.toFixed(1));
   marks+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+Math.max(4,6*f).toFixed(1)+'" fill="'+(si?"#b45638":"#1b508d")+'"/>';
  });
  if(current.length>1)chunks.push(current);
  return chunks.map(c=>'<polyline fill="none" stroke="'+(si?"#b45638":"#1b508d")+'" stroke-width="'+Math.max(3,4*f)+'" stroke-linecap="round" stroke-linejoin="round" points="'+c.join(" ")+'"/>').join("")+marks;
 }).join("");
 const ticks=Array.from({length:5},(_,i)=>{
  const v=i*20,y=y1-v/max*(y1-y0);
  return '<line x1="'+x0+'" y1="'+y+'" x2="'+x1+'" y2="'+y+'" stroke="#e3eaf1" stroke-width="1"/><text x="'+(x0-20*f)+'" y="'+(y+6*fh)+'" text-anchor="end" font-size="'+Math.max(17,23*f)+'" fill="#526375">'+v+'</text>';
 }).join("");
 const sprints=FIXTURE.cycles.map((c,i)=>{
  const p=point(0,i);
  return '<text x="'+p.x+'" y="'+(y1+45*fh)+'" font-size="'+Math.max(15,22*f)+'" text-anchor="middle" fill="#35445a">S'+(101+i)+'</text>';
 }).join("");
 const legend=FIXTURE.series.map((s,i)=>{
  const x=pad+i*Math.max(210,450*f),label=locale==="fr"?s.name:i?"Planned capacity":"Completed velocity";
  return '<circle cx="'+x+'" cy="'+(height-40*fh)+'" r="'+Math.max(6,9*f)+'" fill="'+(i?"#b45638":"#1b508d")+'"/><text x="'+(x+18*f)+'" y="'+(height-34*fh)+'" fill="#35445a" font-size="'+Math.max(16,24*f)+'">'+escapeXml(label)+'</text>';
 }).join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#ffffff"/><text x="'+pad+'" y="'+Math.max(42,70*fh)+'" font-size="'+Math.max(24,34*f)+'" font-weight="600" font-family="Arial, sans-serif" fill="#23354a">'+escapeXml(title)+'</text><g font-family="Arial, sans-serif">'+ticks+sprints+series+legend+'</g></svg>';
}
export function loadStandaloneRasterizer(root=process.cwd()){
 const require=createRequire(import.meta.url);
 const modulePath=path.resolve(root,".smn-410-poc","node_modules","@resvg","resvg-js");
 const {Resvg}=require(modulePath);
 if(typeof Resvg!=="function")throw Error("office-poc-rasterizer-missing");
 return {Resvg,modulePath};
}
export function rasterizeWithResvg(svg,root=process.cwd()){
 const {Resvg}=loadStandaloneRasterizer(root);
 return Buffer.from(new Resvg(svg,{fitTo:{mode:"original"}}).render().asPng());
}
function measure(fn){
 const before=process.memoryUsage().rss,at=performance.now(),result=fn();
 return {result,ms:Math.round((performance.now()-at)*100)/100,rssDeltaBytes:process.memoryUsage().rss-before};
}
export function compareRenderers(root=process.cwd()){
 const baseline=measure(()=>renderOfficeTrendPng({...FIXTURE,type:"line",language:"fr"}));
 const baselineMeta=inspectPng(baseline.result);
 const imageSamples=TARGETS.flatMap(target=>["fr","en"].map(locale=>{
  const run=measure(()=>rasterizeWithResvg(svgForTarget(target.width,target.height,locale),root));
  const meta=inspectPng(run.result);
  if(meta.width!==target.width||meta.height!==target.height)throw Error("office-poc-size-mismatch");
  return {target:target.id,locale,...meta,ms:run.ms,rssDeltaBytes:run.rssDeltaBytes};
 }));
 const four=measure(()=>Array.from({length:4},()=>rasterizeWithResvg(svgForTarget(1200,675,"fr"),root)));
 const fourSizes=four.result.map(b=>inspectPng(b).bytes);
 const require=createRequire(import.meta.url);
 const mod=loadStandaloneRasterizer(root);
 const pkg=require(path.join(mod.modulePath,"package.json"));
 return {
  platform:process.platform,node:process.version,
  baseline:{...baselineMeta,ms:baseline.ms,rssDeltaBytes:baseline.rssDeltaBytes,fonts:"bitmap uppercase unaccented"},
  candidate:{package:"@resvg/resvg-js",version:pkg.version,license:pkg.license,usesExternalBrowser:false,usesSystemFonts:true},
  imageSamples,fourCharts:{count:four.result.length,bytes:fourSizes,ms:four.ms,rssDeltaBytes:four.rssDeltaBytes},
  browserAlternative:{attempted:false,reason:"SMN puppeteer-core does not bundle Chromium; external browser is not a runtime prerequisite"},
  limits:LIMITS
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=compareRenderers();
 const outputIndex=process.argv.indexOf("--evidence");
 if(outputIndex!==-1){
  const dir=path.resolve(process.argv[outputIndex+1]||"smn-410-evidence");
  mkdirSync(dir,{recursive:true});
  writeFileSync(path.join(dir,"benchmark.json"),JSON.stringify(result,null,2)+"\\n");
  const baseline=renderOfficeTrendPng({...FIXTURE,type:"line",language:"fr"});
  writeFileSync(path.join(dir,"baseline-960x560.png"),baseline);
  for(const target of TARGETS)for(const locale of ["fr","en"]){
   writeFileSync(path.join(dir,"resvg-"+target.id+"-"+locale+".png"),
    rasterizeWithResvg(svgForTarget(target.width,target.height,locale)));
  }
 }
 console.log(JSON.stringify(result,null,2));
}
