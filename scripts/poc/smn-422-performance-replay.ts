/**
 * SMN-422 — same-process reproducible performance replay on the user machine.
 * Pure in-memory renderers; never connects to PostgreSQL, archives or templates.
 * Reports process CPU microseconds and sampled RSS, not peak machine memory.
 *
 * pnpm exec tsx scripts/poc/smn-422-performance-replay.ts --out <new-dir> --repeats 3
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {performance} from "node:perf_hooks";
import {createHash} from "node:crypto";
import {baselineCases,stressCases,renderBaselineCase,inspectBaselinePng} from "./smn-415-office-baseline.mjs";
import {renderAdaptiveChartPng} from "../smn-412-adaptive-chart.mjs";
import {PREDEFINED_CHART_STYLES} from "../../src/server/reports/chart-style-contract";

type Mode="before"|"after";
type Case={id:string;type:string;format:string;locale:string;ratio:string;args:{
 target?:{widthEmu:number;heightEmu:number};
 cycles:Array<{name:string}>;series:Array<{name:string;unit:string;values:Array<number|null>}>
}};
function parseArgs(argv:string[]){
 let out="",repeats=3,smoke=false,style="cockpit-agile";
 for(let i=0;i<argv.length;i++){
  const key=argv[i];
  if(key==="--out")out=argv[++i]??"";
  else if(key==="--repeats")repeats=Number(argv[++i]);
  else if(key==="--style")style=argv[++i]??"";
  else if(key==="--smoke")smoke=true;
  else throw Error("Unknown argument: "+key);
 }
 if(!out||!Number.isInteger(repeats)||repeats<1||repeats>20||
  !PREDEFINED_CHART_STYLES.some(p=>p.id===style))
  throw Error("Usage: --out <new-dir> [--repeats 3] [--smoke] [--style cockpit-agile|corporate|minimal]");
 return {out:resolve(out),repeats,smoke,style};
}
const median=(items:number[])=>{
 const sorted=[...items].sort((a,b)=>a-b),i=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2;
};
function makeStyled(c:Case,styleId:string){
 const style=PREDEFINED_CHART_STYLES.find(p=>p.id===styleId)!.config;
 const target=c.format==="docx"?
  {widthEmu:960*3048,heightEmu:560*3048}:
  c.args.target??{widthEmu:1600*3048,heightEmu:900*3048};
 return renderAdaptiveChartPng({
  target,cycles:c.args.cycles,series:c.args.series,type:c.type,locale:c.locale,
  style
 });
}
function measure(c:Case,mode:Mode,repeats:number,styleId:string){
 const elapsed:number[]=[],cpuMs:number[]=[],rss:number[]=[];
 let last:Buffer|null=null;
 for(let i=0;i<repeats;i++){
  rss.push(process.memoryUsage().rss);
  const startCpu=process.cpuUsage(),start=performance.now();
  const bytes=mode==="before"?renderBaselineCase(c):makeStyled(c,styleId);
  const cpu=process.cpuUsage(startCpu);
  elapsed.push(Number((performance.now()-start).toFixed(3)));
  cpuMs.push(Number(((cpu.user+cpu.system)/1000).toFixed(3)));
  rss.push(process.memoryUsage().rss);
  if(!bytes)throw Error("Missing image "+c.id+" "+mode);
  last=bytes;
 }
 if(!last)throw Error("Missing PNG "+c.id);
 const info=inspectBaselinePng(last);
 return {mode,timeMsMedian:median(elapsed),cpuMsMedian:median(cpuMs),
  rssSampledMaxBytes:Math.max(...rss),width:info.width,height:info.height,
  sha256:createHash("sha256").update(last).digest("hex")};
}
export function runReplay(input:{out:string;repeats:number;smoke:boolean;style:string}){
 const cases=(input.smoke?baselineCases().filter(c=>c.type==="line"&&c.locale==="fr"):baselineCases()) as Case[];
 const stress=(input.smoke?stressCases().filter(c=>c.type==="line"&&c.count==="one"):stressCases()) as Case[];
 const results=[];
 for(const c of [...cases,...stress]){
  const before=measure(c,"before",input.repeats,input.style);
  const after=measure(c,"after",input.repeats,input.style);
  if(before.width!==after.width||before.height!==after.height)
   throw Error("Geometry changed for "+c.id);
  const ratio=(a:number,b:number)=>a===0?null:Number(((b/a-1)*100).toFixed(2));
  results.push({id:c.id,group:cases.includes(c)?"matrix":"stress",type:c.type,
   format:c.format,locale:c.locale,ratio:c.ratio,before,after,
   wallDeltaPercent:ratio(before.timeMsMedian,after.timeMsMedian),
   cpuDeltaPercent:ratio(before.cpuMsMedian,after.cpuMsMedian)});
 }
 const slow=results.filter(r=>r.wallDeltaPercent!==null&&r.wallDeltaPercent>10);
 const manifest={version:1,created:new Date().toISOString(),environment:{
  platform:process.platform,arch:process.arch,node:process.version,
  logicalCpus:typeof navigator!=="undefined"?navigator.hardwareConcurrency:null
 },configuration:{style:input.style,repeats:input.repeats,smoke:input.smoke,
  matrixCases:cases.length,stressCases:stress.length},
  measurement:"Same Node process. Medians of elapsed wall time and process user+system CPU per render; RSS sampled before/after each render, not guaranteed peak. Different image hashes are expected for intentional style changes.",
  threshold:{wallRegressionPercent:10,exceededCaseIds:slow.map(r=>r.id),
   status:slow.length?"review-required":"no-wall-time-exceedance-observed"},
  realMicrosoftOfficeReview:"not-executed",results};
 mkdirSync(input.out,{recursive:true});
 writeFileSync(join(input.out,"replay.json"),JSON.stringify(manifest,null,2)+"\n");
 return manifest;
}
if(process.argv[1]?.endsWith("smn-422-performance-replay.ts")){
 try{
  const config=parseArgs(process.argv.slice(2)),result=runReplay(config);
  console.log(JSON.stringify({output:config.out,caseCount:result.results.length,
   exceededTarget:result.threshold.exceededCaseIds.length,
   realMicrosoftOfficeReview:result.realMicrosoftOfficeReview},null,2));
 }catch(error){
  console.error(error instanceof Error?error.message:"SMN-422 replay failed");
  process.exitCode=1;
 }
}
