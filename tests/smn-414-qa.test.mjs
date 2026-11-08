import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,readdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {readZip} from "../scripts/smn-397-office-poc.mjs";
import {discoverPowerPointChartTargets} from "../scripts/smn-411-chart-targets.mjs";
import {insertAdaptivePowerPointCharts} from "../scripts/smn-413-adaptive-pptx.mjs";
import {OfficeChartLayoutError,CHART_STYLES,composeAdaptiveChart} from "../scripts/smn-412-adaptive-chart.mjs";
import {
 RATIOS,CASES,syntheticFourSlotTemplate,makeScenario,runFourSlotIntegrity,generateQAEvidence
} from "../scripts/poc/smn-414-qa-matrix.mjs";

test("matrix: every type, ratio and locale yields a target-sized readable PNG header",()=>{
 for(const ratio of RATIOS){
  for(const type of CHART_STYLES){
   for(const locale of ["fr","en"]){
    const args=makeScenario({format:ratio.id,style:type,locale});
    const chart=composeAdaptiveChart(args);
    assert.ok(chart,ratio.id+" "+type+" "+locale);
    assert.equal(chart.width,ratio.width);assert.equal(chart.height,ratio.height);
    assert.equal(chart.meta.style,type);
    assert.ok(!chart.svg.includes("Tendances des indicateurs"));
    assert.ok(chart.svg.includes('viewBox="0 0 '+ratio.width+" "+ratio.height+'"'));
   }
  }
 }
});
test("1/2/6 series, 1/6/24 cycles; negative, null and zero remain semantically distinct",()=>{
 for(const scenario of CASES){
  for(const type of CHART_STYLES){
   const args=makeScenario({style:type,count:scenario.id});
   assert.equal(args.cycles.length,scenario.cycles);
   assert.equal(args.series.length,type==="gauge"?1:scenario.series);
   assert.ok(composeAdaptiveChart(args),type+" "+scenario.id);
  }
 }
 for(const type of ["bar","line","area"]){
  const args=makeScenario({style:type,count:"dense"});
  assert.ok(args.series.flatMap(s=>s.values).includes(null));
  assert.ok(args.series.flatMap(s=>s.values).includes(0));
  assert.ok(args.series.flatMap(s=>s.values).some(v=>v<0));
 }
});
test("four-slot synthetic fixture preserves untouched media and text while replacing only one tag",()=>{
 const src=syntheticFourSlotTemplate();
 assert.equal(discoverPowerPointChartTargets(src).length,1);
 const summary=runFourSlotIntegrity();
 assert.equal(summary.changes.length,1);
 assert.equal(summary.untouchedParts.length,4);
 const slide=readZip(src).find(p=>p.name==="ppt/slides/slide1.xml").data.toString();
 assert.ok(slide.includes("ENTÊTE ROUGE"));
 assert.equal((slide.match(/CADRE VIDE/g)||[]).length,3);
});
test("unsupported rotation and group abort before output, minimum size is explicit",async()=>{
 const source=syntheticFourSlotTemplate();
 const original=readZip(source).find(p=>p.name==="ppt/slides/slide1.xml").data.toString();
 const withRotation=original.replace("<a:xfrm>","<a:xfrm rot=\"600000\">");
 const bad=readZip(source).map(p=>p.name==="ppt/slides/slide1.xml"?{...p,data:Buffer.from(withRotation)}:p);
 const {writeZip}=await import("../scripts/smn-397-office-poc.mjs");
 assert.throws(()=>insertAdaptivePowerPointCharts(writeZip(bad),()=>Buffer.alloc(64)),/office-chart-unsupported-transform/);
 const args=makeScenario();
 args.target={widthEmu:10000,heightEmu:10000};
 assert.throws(()=>composeAdaptiveChart(args),e=>e instanceof OfficeChartLayoutError);
});
test("evidence bundle has 36 PNG samples, stress grid and manual acceptance gates",()=>{
 const temp=mkdtempSync(path.join(tmpdir(),"smn414-"));
 try{
  const report=generateQAEvidence(temp);
  assert.equal(report.pngCases,36);
  assert.equal(report.stressCases,18);
  assert.equal(readdirSync(temp).filter(x=>x.endsWith(".png")).length,36);
  assert.equal(report.manualRequired.length,8);
  const manifest=JSON.parse(readFileSync(path.join(temp,"matrix.json"),"utf8"));
  assert.equal(manifest.results.length,36);
  assert.ok(manifest.results.every(x=>x.bytes>500&&/^[a-f0-9]{64}$/.test(x.sha256)));
  const checklist=readFileSync(path.join(temp,"RECETTE-MANUELLE.md"),"utf8");
  assert.match(checklist,/PowerPoint Windows 11/);
  assert.match(checklist,/Sally/);
  assert.match(checklist,/Winston/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
