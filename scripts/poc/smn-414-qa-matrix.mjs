// Automated preflight and visual samples, not a substitute for Microsoft PowerPoint review.
import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {EMU_PER_INCH} from "../smn-411-chart-targets.mjs";
import {CHART_STYLES,renderAdaptiveChartPng,composeAdaptiveChart} from "../smn-412-adaptive-chart.mjs";
import {insertAdaptivePowerPointCharts} from "../smn-413-adaptive-pptx.mjs";
import {readZip,writeZip} from "../smn-397-office-poc.mjs";

const sha=b=>createHash("sha256").update(b).digest("hex");
export const RATIOS=Object.freeze([
 {id:"horizontal",width:1600,height:900},
 {id:"carre",width:1200,height:1200},
 {id:"vertical",width:900,height:1600},
]);
export const CASES=Object.freeze([
 {id:"one",cycles:1,series:1},
 {id:"standard",cycles:6,series:2},
 {id:"dense",cycles:24,series:6},
]);
const makeCycles=n=>Array.from({length:n},(_,i)=>({name:"Itération de production très longue — Sprint "+(101+i)}));
const values=(n,si,style)=>Array.from({length:n},(_,i)=>{
 if(["pie","donut","gauge"].includes(style))return style==="gauge"?Math.round((i+1)/n*73):10+(i+si*2)%40;
 if(i%11===4)return null;
 if(i%7===3)return 0;
 return i%5===2?-(i+si+1):Math.round((i+1)*(si+1)*1.3);
});
const makeSeries=(n,s,style)=>Array.from({length:s},(_,si)=>({
 name:"Vélocité réalisée / Équipe "+(si+1),tag:"TEST_"+(si+1),unit:style==="gauge"?"%":"SP",
 values:values(n,si,style)
}));
export const toTarget=(width,height)=>({
 widthEmu:Math.round(width/300*EMU_PER_INCH),
 heightEmu:Math.round(height/300*EMU_PER_INCH)
});
export function makeScenario({format="horizontal",style="line",locale="fr",count="standard"}={}){
 const ratio=RATIOS.find(x=>x.id===format),scenario=CASES.find(x=>x.id===count);
 if(!ratio||!scenario)throw Error("invalid-qa-case");
 const n=scenario.cycles,s=style==="gauge"?1:scenario.series;
 return {type:style,locale,target:toTarget(ratio.width,ratio.height),
  cycles:makeCycles(n),series:makeSeries(n,s,style)};
}
const part=(name,data)=>({name,data:Buffer.isBuffer(data)?data:Buffer.from(data),method:8});
const node=(id,text,x,y,cx,cy)=>
 '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Cadre '+id+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
 '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm></p:spPr>'+
 '<p:txBody><a:p><a:r><a:t>'+text+'</a:t></a:r></a:p></p:txBody></p:sp>';
/** Four-slot synthetic OPC fixture only: do not present it as a PowerPoint-validated document. */
export function syntheticFourSlotTemplate(){
 const start='<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>';
 const end='</p:spTree></p:cSld></p:sld>';
 const slide=start+
  node(2,"ENTÊTE ROUGE",100,100,9000000,500000)+
  node(3,"{{CHART:TREND|TYPE=line|LAST=6}}",500000,850000,5486400,3086100)+
  node(4,"CADRE VIDE B",6100000,850000,2100000,2800000)+
  node(5,"CADRE VIDE C",500000,4300000,3657600,1800000)+
  node(6,"CADRE VIDE D",4300000,4300000,3657600,1800000)+end;
 const types='<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>';
 const rels='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/photo.png"/></Relationships>';
 return writeZip([
  part("[Content_Types].xml",types),
  part("ppt/slides/slide1.xml",slide),
  part("ppt/slides/_rels/slide1.xml.rels",rels),
  part("ppt/media/logo.png",Buffer.from("synthetic logo placeholder, not real photo")),
  part("ppt/media/photo.png",Buffer.from("synthetic photo placeholder, not real photo")),
  part("ppt/theme/theme1.xml","<a:theme>preserve-original-theme</a:theme>"),
  part("ppt/presentation.xml","<p:presentation/>")
 ]);
}
export function runFourSlotIntegrity(){
 const source=syntheticFourSlotTemplate();
 const before=new Map(readZip(source).map(p=>[p.name,sha(p.data)]));
 const render=t=>renderAdaptiveChartPng({...makeScenario({style:t.options.type}),target:t});
 const {bytes,changes}=insertAdaptivePowerPointCharts(source,render);
 const afterParts=readZip(bytes),after=new Map(afterParts.map(p=>[p.name,sha(p.data)]));
 const slide=afterParts.find(p=>p.name==="ppt/slides/slide1.xml").data.toString();
 const untouched=["ppt/media/logo.png","ppt/media/photo.png","ppt/theme/theme1.xml","ppt/presentation.xml"];
 if(changes.length!==1||changes[0].empty)throw Error("fixture-wrong-target-count");
 if(untouched.some(name=>before.get(name)!==after.get(name)))throw Error("fixture-untouched-part-changed");
 if(!["CADRE VIDE B","CADRE VIDE C","CADRE VIDE D"].every(s=>slide.includes(s)))
  throw Error("fixture-empty-slot-changed");
 if((slide.match(/<p:pic>/g)||[]).length!==1)throw Error("fixture-pic-count");
 return {changes,untouchedParts:untouched,unchangedHashes:Object.fromEntries(untouched.map(p=>[p,after.get(p)])),
  note:"Synthetic Open XML package for structural integrity testing only. Not visually validated by Microsoft PowerPoint."};
}
export function generateQAEvidence(directory){
 mkdirSync(directory,{recursive:true});
 const results=[];
 for(const ratio of RATIOS){
  for(const style of CHART_STYLES){
   for(const locale of ["fr","en"]){
    const args=makeScenario({format:ratio.id,style,locale});
    const png=renderAdaptiveChartPng(args);
    if(!png)throw Error("missing-qa-image");
    const name=[ratio.id,style,locale].join("-")+".png";
    writeFileSync(path.join(directory,name),png);
    const scene=composeAdaptiveChart(args);
    results.push({name,width:scene.width,height:scene.height,style,locale,bytes:png.length,sha256:sha(png)});
   }
  }
 }
 // Exercise stress matrix independently; tests verify data and meaningful errors.
 const stress=[];
 for(const count of CASES){
  for(const style of CHART_STYLES){
   const args=makeScenario({format:"horizontal",style,count:count.id});
   const scene=composeAdaptiveChart(args);
   stress.push({case:count.id,style,cycles:args.cycles.length,series:args.series.length,
    state:scene?"composed":"no-data",pixels:scene?[scene.width,scene.height]:null});
  }
 }
 const deck=runFourSlotIntegrity();
 const report={
  purpose:"Automated preflight; not certification of PowerPoint display or PDF",
  generatedAt:new Date().toISOString(),os:process.platform,node:process.version,
  pngCases:results.length,stressCases:stress.length,
  results,stress,structuralFixture:deck,
  manualRequired:["user-original-pptx","PowerPoint Windows 11 open","100% view","slideshow","PDF export","visual before after","Sally sign-off","Winston sign-off"]
 };
 writeFileSync(path.join(directory,"matrix.json"),JSON.stringify(report,null,2)+"\n");
 writeFileSync(path.join(directory,"RECETTE-MANUELLE.md"),
  "# SMN-414 — Recette manuelle à réaliser\n\n"+
  "Ce dossier contient **des images PNG synthétiques**, pas la preuve de la conformité au véritable modèle utilisateur.\n\n"+
  "- [ ] Ouvrir le PPTX original (en-tête rouge, logo et photographie à droite, quatre cadres)\n"+
  "- [ ] Comparer la diapositive avant/après ; trois cadres sans tag strictement inchangés\n"+
  "- [ ] PowerPoint Windows 11 : aucune réparation à l'ouverture, graphique net à 100 %\n"+
  "- [ ] Tester le diaporama et l'export PDF, sans distorsion ni recouvrement\n"+
  "- [ ] Tester trois ratios, six styles et FR/EN ; points zéro/null, négatifs et cas denses\n"+
  "- [ ] Tester erreurs zone trop petite, rotation/groupe : messages localisés, pas de rapport partiel\n"+
  "- [ ] Revue Sally (UX-CH-01 à 15), Winston (ADR) et validation utilisateur\n");
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const output=path.resolve(process.argv[2]||"smn-414-evidence");
 const report=generateQAEvidence(output);
 console.log(JSON.stringify({images:report.pngCases,stress:report.stressCases,output},null,2));
}
