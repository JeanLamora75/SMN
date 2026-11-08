// Reproducible Office chart baseline. Never modifies production exports or report archives.
import {createHash} from "node:crypto";
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";
import {renderOfficeTrendPng} from "../smn-402-trend-png.mjs";
import {CHART_STYLES,renderAdaptiveChartPng} from "../smn-412-adaptive-chart.mjs";
import {insertOfficeTrendImages} from "../smn-402-office-chart-tags.mjs";
import {insertAdaptivePowerPointCharts} from "../smn-413-adaptive-pptx.mjs";
import {readZip,writeZip} from "../smn-397-office-poc.mjs";
import {makeScenario,RATIOS,CASES,toTarget} from "./smn-414-qa-matrix.mjs";

const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const sha=buffer=>createHash("sha256").update(buffer).digest("hex");
const part=(name,data)=>({name,data:Buffer.isBuffer(data)?data:Buffer.from(data),method:8});
const TYPES_XML='<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>';
const RELS_XML='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
const ESCAPE=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const median=values=>{const s=[...values].sort((a,b)=>a-b);return s.length%2?s[Math.floor(s.length/2)]:(s[s.length/2-1]+s[s.length/2])/2;};
export function inspectBaselinePng(buffer){
 if(!Buffer.isBuffer(buffer)||buffer.length<45||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw Error("baseline-invalid-png");
 const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
 if(!width||!height)throw Error("baseline-invalid-dimensions");
 return {width,height,bytes:buffer.length,sha256:sha(buffer)};
}
export function baselineCases(){
 const result=[];
 for(const type of CHART_STYLES){
  for(const locale of ["fr","en"]){
   const word=makeScenario({style:type,locale,count:"standard"});
   result.push({id:"docx-"+type+"-"+locale,format:"docx",type,locale,ratio:"fixed-960x560",count:"standard",args:word});
   for(const ratio of RATIOS){
    const powerpoint=makeScenario({format:ratio.id,style:type,locale,count:"standard"});
    result.push({id:"pptx-"+ratio.id+"-"+type+"-"+locale,format:"pptx",type,locale,ratio:ratio.id,count:"standard",args:powerpoint});
   }
  }
 }
 return result;
}
export function stressCases(){
 const result=[];
 for(const count of CASES){
  for(const type of CHART_STYLES){
   for(const format of ["docx","pptx"]){
    const args=makeScenario({style:type,count:count.id,locale:"fr"});
    result.push({id:format+"-stress-"+count.id+"-"+type,format,type,locale:"fr",count:count.id,ratio:format==="docx"?"fixed-960x560":"horizontal",args});
   }
  }
 }
 return result;
}
export function renderBaselineCase(c){
 if(c.format==="docx")return renderOfficeTrendPng({cycles:c.args.cycles,series:c.args.series,type:c.type,language:c.locale});
 return renderAdaptiveChartPng(c.args);
}
export function benchmarkCase(c,repeats=3){
 if(!Number.isInteger(repeats)||repeats<1||repeats>20)throw Error("baseline-invalid-repeats");
 const durations=[],rssSamples=[];
 let png=null;
 for(let n=0;n<repeats;n++){
  rssSamples.push(process.memoryUsage().rss);
  const start=performance.now();
  const value=renderBaselineCase(c);
  durations.push(Math.round((performance.now()-start)*1000)/1000);
  if(!value)throw Error("baseline-missing-render: "+c.id);
  rssSamples.push(process.memoryUsage().rss);
  png=value;
 }
 const meta=inspectBaselinePng(png);
 const expected=c.format==="docx"?{width:960,height:560}:
  RATIOS.find(x=>x.id===c.ratio);
 if(meta.width!==expected.width||meta.height!==expected.height)throw Error("baseline-size-mismatch: "+c.id);
 const fixture=JSON.stringify({cycles:c.args.cycles,series:c.args.series,type:c.type,locale:c.locale});
 const values=c.args.series.flatMap(x=>x.values);
 return {image:png,result:{id:c.id,format:c.format,type:c.type,locale:c.locale,ratio:c.ratio,
  fixtureSha256:sha(Buffer.from(fixture)),
  valueProfile:{missing:values.filter(x=>x===null).length,zero:values.filter(x=>x===0).length,
   negative:values.filter(x=>x!==null&&x<0).length},
  longLabelCount:c.args.cycles.filter(x=>x.name.length>20).length,
  count:c.count,cycles:c.args.cycles.length,series:c.args.series.length,...meta,
  durationMs:{samples:durations,median:median(durations)},
  rssObservedMaxBytes:Math.max(...rssSamples),
  rssObservedDeltaBytes:rssSamples.at(-1)-rssSamples[0]}};
}
export function syntheticOfficeTemplate(format,number=1,ratio="horizontal"){
 if(![1,3,6].includes(number))throw Error("baseline-invalid-chart-count");
 const dimensions=RATIOS.find(r=>r.id===ratio);
 if(!dimensions)throw Error("baseline-invalid-ratio");
 const tags=Array.from({length:number},(_,i)=>"{{CHART:TREND|TYPE="+CHART_STYLES[i]+"|LAST=6}}");
 if(format==="docx"){
  const body=tags.map(tag=>'<w:p><w:r><w:t>'+ESCAPE(tag)+'</w:t></w:r></w:p>').join("");
  return writeZip([
   part("[Content_Types].xml",TYPES_XML),
   part("word/document.xml",'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>'),
   part("word/_rels/document.xml.rels",RELS_XML),
   part("docProps/core.xml","<root>unchanged</root>")
  ]);
 }
 if(format!=="pptx")throw Error("baseline-invalid-format");
 const target=toTarget(dimensions.width,dimensions.height);
 const shapes=tags.map((tag,i)=>'<p:sp><p:nvSpPr><p:cNvPr id="'+(i+2)+'" name="Chart"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
  '<p:spPr><a:xfrm><a:off x="'+(100000+i*10000)+'" y="100000"/><a:ext cx="'+target.widthEmu+'" cy="'+target.heightEmu+'"/></a:xfrm></p:spPr>'+
  '<p:txBody><a:p><a:r><a:t>'+ESCAPE(tag)+'</a:t></a:r></a:p></p:txBody></p:sp>').join("");
 return writeZip([
  part("[Content_Types].xml",TYPES_XML),
  part("ppt/presentation.xml","<p:presentation/>"),
  part("ppt/slides/slide1.xml",'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>'+shapes+'</p:spTree></p:cSld></p:sld>'),
  part("ppt/slides/_rels/slide1.xml.rels",RELS_XML),
  part("docProps/core.xml","<root>unchanged</root>")
 ]);
}
export function packageScenario(format,number=1,ratio="horizontal"){
 const input=syntheticOfficeTemplate(format,number,ratio);
 const start=performance.now();
 const render=(type,target)=>renderBaselineCase({
  format,type,locale:"fr",ratio,
  args:{...makeScenario({style:type,locale:"fr"}),...(target?{target}:{})}
 });
 const result=format==="docx"?
  insertOfficeTrendImages(input,"docx",(_index,options)=>render(options.type)):
  insertAdaptivePowerPointCharts(input,target=>render(target.options.type,target));
 const elapsedMs=Math.round((performance.now()-start)*1000)/1000;
 if(result.changes.length!==number)throw Error("baseline-chart-count-mismatch");
 const after=readZip(result.bytes),before=readZip(input);
 const unchanged=["docProps/core.xml","[Content_Types].xml"].filter(name=>name==="docProps/core.xml");
 for(const name of unchanged){
  if(!before.some(p=>p.name===name)||sha(before.find(p=>p.name===name).data)!==sha(after.find(p=>p.name===name).data))
   throw Error("baseline-untouched-part-mismatch");
 }
 return {input,output:result.bytes,metadata:{
  format,charts:number,ratio,elapsedMs,sourceBytes:input.length,outputBytes:result.bytes.length,
  sourceSha256:sha(input),outputSha256:sha(result.bytes),
  changes:result.changes.length,unchangedParts:unchanged,
  note:"Synthetic OPC structural fixture: not certified for Word/PowerPoint opening."}};
}
function parseCli(args){
 let output=null,repeats=3,smoke=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==="--out"){output=args[++i];}
  else if(args[i]==="--repeats"){repeats=Number(args[++i]);}
  else if(args[i]==="--smoke"){smoke=true;}
  else throw Error("baseline-invalid-argument: "+args[i]);
 }
 if(typeof output!=="string"||!output.trim())throw Error("Usage: node scripts/poc/smn-415-office-baseline.mjs --out <directory> [--repeats 3] [--smoke]");
 if(!Number.isInteger(repeats)||repeats<1||repeats>20)throw Error("baseline-invalid-repeats");
 return {output:resolve(output),repeats,smoke};
}
export function runBaseline({output,repeats=3,smoke=false}){
 if(!output||typeof output!=="string")throw Error("baseline-output-required");
 const root=resolve(output);
 mkdirSync(join(root,"images"),{recursive:true});
 mkdirSync(join(root,"packages"),{recursive:true});
 const cases=smoke?baselineCases().filter(c=>c.type==="line"&&c.locale==="fr"):baselineCases();
 const results=[];
 for(const c of cases){
  const {image,result}=benchmarkCase(c,repeats);
  writeFileSync(join(root,"images",c.id+".png"),image);
  results.push(result);
 }
 const stress=smoke?stressCases().filter(c=>c.type==="line"&&c.count==="one"):stressCases();
 const stressResults=[];
 for(const c of stress){
  const {result}=benchmarkCase(c,1);
  stressResults.push(result);
 }
 const packages=[];
 for(const format of ["docx","pptx"]){
  for(const number of smoke?[1]:[1,3,6]){
   const item=packageScenario(format,number);
   const name=format+"-"+number+"-charts";
   writeFileSync(join(root,"packages",name+"-source."+format),item.input);
   writeFileSync(join(root,"packages",name+"-generated."+format),item.output);
   packages.push({id:name,...item.metadata});
  }
 }
 const manifest={
  expectedRendererDifferences:[
   "DOCX historical renderer produces fixed 960x560 PNG; PPTX SVG renderer adapts to physical chart target at 300 dpi.",
   "Legacy Word raster uses built-in 5x7 bitmap glyphs and ASCII normalization; SVG PPTX uses resvg and retains accented labels.",
   "Legacy Word adds an internal title; adaptive PowerPoint does not repeat an internal report title.",
   "Axis placement, legend position, font size and line thickness intentionally differ between current Word and PowerPoint.",
   "Cross-format PNG digests and screenshots are NOT expected to match pixel-for-pixel; compare semantics and target-specific readability."
  ],
  purpose:"Baseline before a shared Office chart SVG renderer; no production files modified.",
  proofLevel:"Generated locally only; manual Microsoft Office validation is pending.",
  timestamp:new Date().toISOString(),
  environment:{platform:process.platform,arch:process.arch,node:process.version,
   versions:process.versions,cpus:(logicalCpuCount()),note:"RSS is sampled before/after each run; it is not a true process peak."},
  configuration:{repeats,smoke,images:results.length,stressCases:stressResults.length,packages:packages.length},
  renderer:{docx:"legacy 960x560 pixel renderer",pptx:"SVG with resvg 300 DPI"},
  cases:results,stress:stressResults,packages,
  manualRequired:["Word Windows 11: open/print DOCX against a REAL user template",
   "PowerPoint Windows 11: open/slide show/PDF against a REAL user template",
   "Inspect visual quality and clipping at 100% for six chart types / three ratios",
   "Review FR and EN labels and typography with Sally",
   "Compare future renderer on same hardware and workloads",
   "Review node --test regressions and pnpm typecheck/lint results"]
 };
 writeFileSync(join(root,"baseline.json"),JSON.stringify(manifest,null,2)+"\n");
 writeFileSync(join(root,"RECETTE-MANUELLE.md"),
  "# Baseline graphique Office — recette manuelle à compléter\n\n"+
  "Les packages du dossier `packages/` sont des fixtures ZIP/OpenXML **synthétiques** pour les tests structurels ; "+
  "ils ne remplacent pas un véritable modèle Word ou PowerPoint et ne constituent pas une preuve d'ouverture Office.\n\n"+
  "- [ ] Ouvrir et comparer des rapports Word réels dans Word Windows 11.\n"+
  "- [ ] Ouvrir et comparer des rapports PowerPoint réels dans PowerPoint Windows 11.\n"+
  "- [ ] Contrôler les six types, la légende, les accents FR/EN et l'absence de collisions.\n"+
  "- [ ] Vérifier 1/3/6 graphiques dans un rapport réel et les ratios applicables.\n"+
  "- [ ] Vérifier l'absence de déplacement de logos, photos, tableaux et graphiques voisins.\n"+
  "- [ ] Noter la version Node, la machine, l'OS, les résultats des tests et les anomalies.\n"+
  "- [ ] Réexécuter la même commande avant/après refonte, avec le même équipement.\n");
 return manifest;
}
// Avoid Node-only external utility dependencies; this is an observable logical CPU count.
function logicalCpuCount(){return typeof navigator!=="undefined"&&navigator.hardwareConcurrency?navigator.hardwareConcurrency:null;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=parseCli(process.argv.slice(2));
  const result=runBaseline(args);
  console.log(JSON.stringify({output:args.output,images:result.configuration.images,
   stressCases:result.configuration.stressCases,packages:result.configuration.packages,
   testsExecuted:false,officeManualReview:"pending"},null,2));
 }catch(error){console.error(error.stack||error.message);process.exitCode=1;}
}
