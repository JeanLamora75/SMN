// Produce reproducible visual review artifacts from isolated synthetic data.
import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {renderAdaptiveChartPng,CHART_STYLES} from "../smn-412-adaptive-chart.mjs";
import {EMU_PER_INCH} from "../smn-411-chart-targets.mjs";
const targets=[["wide",1600,900],["square",1200,1200],["portrait",900,1600]];
const cycles=Array.from({length:6},(_,i)=>({name:"Sprint de réalisation "+(101+i)}));
const source=[
 {name:"Vélocité réalisée",unit:"SP",values:[25,38,null,0,57,42]},
 {name:"Objectifs atteints",unit:"SP",values:[19,24,30,28,54,61]}
];
const output=path.resolve(process.argv[2]||"smn-412-evidence");
mkdirSync(output,{recursive:true});
const results=[];
for(const [form,width,height] of targets){
 const target={widthEmu:Math.round(width/300*EMU_PER_INCH),heightEmu:Math.round(height/300*EMU_PER_INCH)};
 for(const locale of ["fr","en"]){
  for(const type of CHART_STYLES){
   const series=type==="gauge"?[{name:"Taux réalisé",unit:"%",values:[25,35,48,57,68,74]}]:source;
   const png=renderAdaptiveChartPng({target,cycles,series,type,locale});
   const name=[form,locale,type].join("-")+".png";
   writeFileSync(path.join(output,name),png);
   results.push({name,type,locale,form,width,height,bytes:png.length,sha256:createHash("sha256").update(png).digest("hex")});
  }
 }
}
writeFileSync(path.join(output,"manifest.json"),JSON.stringify({results,node:process.version,os:process.platform,notes:"Synthetic dataset; PNG review only, not proof of PowerPoint fidelity."},null,2)+"\n");
console.log(JSON.stringify({sampleCount:results.length,output,bytes:results.reduce((n,r)=>n+r.bytes,0)}));
