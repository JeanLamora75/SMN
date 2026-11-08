/**
 * SMN-418 — Reproducible after-refactor PNG benchmark against SMN-415.
 * No database, report archive or production template is ever modified.
 * Run with: pnpm exec tsx scripts/poc/smn-418-compare-baseline.ts --before <SMN-415-dir> --out <dir>
 */
import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {performance} from "node:perf_hooks";
import {baselineCases,inspectBaselinePng} from "./smn-415-office-baseline.mjs";
import {renderAdaptiveChartPng} from "../smn-412-adaptive-chart.mjs";
import {PREDEFINED_CHART_STYLES} from "../../src/server/reports/chart-style-contract";

type Input={before:string;out:string;repeats:number;styleId:string;smoke:boolean};
function args(argv:string[]):Input{
 let before="",out="",repeats=3,styleId="cockpit-agile",smoke=false;
 for(let i=0;i<argv.length;i++){
  if(argv[i]==="--before")before=argv[++i]??"";
  else if(argv[i]==="--out")out=argv[++i]??"";
  else if(argv[i]==="--repeats")repeats=Number(argv[++i]);
  else if(argv[i]==="--style")styleId=argv[++i]??"";
  else if(argv[i]==="--smoke")smoke=true;
  else throw Error("Unrecognized option: "+argv[i]);
 }
 if(!before||!out||!Number.isInteger(repeats)||repeats<1||repeats>20||
  !PREDEFINED_CHART_STYLES.some(s=>s.id===styleId))
  throw Error("Usage: --before <SMN-415-dir> --out <output-dir> [--repeats 3] [--style cockpit-agile|corporate|minimal] [--smoke]");
 return {before:resolve(before),out:resolve(out),repeats,styleId,smoke};
}
const averageMedian=(data:number[])=>{
 const values=[...data].sort((a,b)=>a-b);
 return values.length%2?values[Math.floor(values.length/2)]:
  (values[values.length/2-1]+values[values.length/2])/2;
};
const sha=(png:Buffer)=>createHash("sha256").update(png).digest("hex");
export function compareBaseline(input:Input){
 if(input.before===input.out)throw Error("Baseline source and output must be different directories");
 const baseline=JSON.parse(readFileSync(join(input.before,"baseline.json"),"utf8")) as {
  configuration:{smoke:boolean};
  cases:Array<{id:string;format:string;type:string;fixtureSha256?:string;
   durationMs:{median:number};width:number;height:number}>;
 };
 if(input.smoke!==baseline.configuration.smoke)
  throw Error("Both datasets must be either full matrix or smoke; generate a matching SMN-415 baseline");
 const before=new Map(baseline.cases.map(c=>[c.id,c]));
 const style=PREDEFINED_CHART_STYLES.find(s=>s.id===input.styleId)!;
 mkdirSync(join(input.out,"images"),{recursive:true});
 const cases=input.smoke?baselineCases().filter(c=>c.type==="line"&&c.locale==="fr"):baselineCases();
 const results=[];
 for(const c of cases){
  const previous=before.get(c.id);
  if(!previous)throw Error("Baseline case missing: "+c.id);
  const target=c.format==="docx"?{widthEmu:960*3048,heightEmu:560*3048}:c.args.target;
  const parameters={...c.args,target,type:c.type,locale:c.locale};
  const durations:number[]=[];
  let image:Buffer|null=null,maximumRss=0;
  for(let i=0;i<input.repeats;i++){
   const started=performance.now();
   image=renderAdaptiveChartPng({...parameters,style:style.config});
   durations.push(Number((performance.now()-started).toFixed(3)));
   maximumRss=Math.max(maximumRss,process.memoryUsage().rss);
   if(!image)throw Error("Styled renderer did not return a PNG for "+c.id);
  }
  const png=inspectBaselinePng(image);
  if(png.width!==previous.width||png.height!==previous.height)
   throw Error("Geometry changed unexpectedly for "+c.id);
  writeFileSync(join(input.out,"images",c.id+".png"),image);
  const median=averageMedian(durations),prior=previous.durationMs.median;
  results.push({id:c.id,format:c.format,type:c.type,locale:c.locale,ratio:c.ratio,
   beforeMs:prior,afterMs:median,deltaPercent:prior?Number(((median/prior-1)*100).toFixed(2)):null,
   width:png.width,height:png.height,sha256:sha(image),bytes:png.bytes,
   oldHash:previous.fixtureSha256??null,afterRssObservedMaxBytes:maximumRss});
 }
 const targetOver10=results.filter(c=>c.deltaPercent!==null&&c.deltaPercent>10);
 const manifest={generatedAt:new Date().toISOString(),style:input.styleId,
  before:input.before,after:input.out,
  note:"Before is the historic SMN-415 renderer, after is the shared SVG/resvg composer. Do not interpret PNG hash changes as a failure.",
  timing:"Median of PNG render durations; memory is process RSS sampled at each render boundary, not a true peak.",
  manualOfficeReview:"pending",cases:results,
  performanceTarget:{maxMedianRegressionPercent:10,exceeded:targetOver10.map(c=>c.id),
   status:targetOver10.length?"requires-review":"within-preliminary-target"}};
 writeFileSync(join(input.out,"comparison.json"),JSON.stringify(manifest,null,2)+"\n");
 writeFileSync(join(input.out,"RECETTE-OFFICE.md"),
  "# SMN-418 — Comparaison Word/PPTX\n\n"+
  "Les PNG ne prouvent pas que les rapports Office réels s’ouvrent correctement.\n\n"+
  "- [ ] Ouvrir les modèles Office réels dans Word et PowerPoint Windows 11.\n"+
  "- [ ] Comparer les six types de graphiques à leur baseline historique.\n"+
  "- [ ] Contrôler 1/3/6 graphiques, logos, tableaux, positions, ratios et qualité à 100 %.\n"+
  "- [ ] Contrôler FR/EN, cycles 1/6/24, séries 1/2/6 et données manquantes.\n"+
  "- [ ] Noter les changements d’apparence intentionnels et les écarts non acceptables.\n"+
  "- [ ] Comparer CPU/temps/mémoire sur la même machine ; prévoir pic RSS instrumenté pour la recette finale.\n");
 return manifest;
}
if(process.argv[1]?.endsWith("smn-418-compare-baseline.ts")){
 try{
  const options=args(process.argv.slice(2));
  const result=compareBaseline(options);
  console.log(JSON.stringify({cases:result.cases.length,style:result.style,
   output:options.out,performanceReview:result.performanceTarget.exceeded.length,
   officeManualReview:result.manualOfficeReview},null,2));
 }catch(error){
  console.error(error instanceof Error?error.message:"SMN-418 comparison failed");
  process.exitCode=1;
 }
}
