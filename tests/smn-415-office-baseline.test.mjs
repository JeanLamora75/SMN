import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync,readFileSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {readZip} from "../scripts/smn-397-office-poc.mjs";
import {CHART_STYLES} from "../scripts/smn-412-adaptive-chart.mjs";
import {baselineCases,stressCases,syntheticOfficeTemplate,packageScenario,
 inspectBaselinePng,renderBaselineCase,benchmarkCase,runBaseline} from "../scripts/poc/smn-415-office-baseline.mjs";

const sha=buffer=>createHash("sha256").update(buffer).digest("hex");

test("baseline matrix covers all six types, 3 PPTX ratios, both locales and legacy Word",()=>{
 const cases=baselineCases();
 assert.equal(cases.length,48);
 assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
 for(const type of CHART_STYLES){
  for(const locale of ["fr","en"]){
   assert.equal(cases.filter(c=>c.type===type&&c.locale===locale&&c.format==="docx").length,1);
   assert.equal(cases.filter(c=>c.type===type&&c.locale===locale&&c.format==="pptx").length,3);
  }
 }
 const stress=stressCases();
 assert.equal(stress.length,36);
 for(const format of ["docx","pptx"]){
  for(const count of ["one","standard","dense"]){
   for(const type of CHART_STYLES){
    const c=stress.find(x=>x.format===format&&x.count===count&&x.type===type);
    assert.ok(c);
    assert.equal(c.args.cycles.length,{one:1,standard:6,dense:24}[count]);
    assert.equal(c.args.series.length,type==="gauge"?1:{one:1,standard:2,dense:6}[count]);
   }
  }
 }
});

test("same fixture renders deterministic image digest with correct legacy dimensions",()=>{
 const c=baselineCases().find(x=>x.id==="docx-line-fr");
 const first=renderBaselineCase(c),second=renderBaselineCase(c);
 assert.equal(sha(first),sha(second));
 const meta=inspectBaselinePng(first);
 assert.equal(meta.width,960);
 assert.equal(meta.height,560);
 assert.equal(meta.sha256,sha(first));
 const measured=benchmarkCase(c,2);
 assert.equal(measured.result.durationMs.samples.length,2);
 assert.ok(measured.result.durationMs.median>=0);
 assert.equal(measured.result.rssObservedMaxBytes>0,true);
});

test("PNG inspector rejects invalid data and measurement rejects invalid repeats",()=>{
 assert.throws(()=>inspectBaselinePng(Buffer.alloc(100)),/baseline-invalid-png/);
 const c=baselineCases()[0];
 assert.throws(()=>benchmarkCase(c,0),/baseline-invalid-repeats/);
 assert.throws(()=>benchmarkCase(c,21),/baseline-invalid-repeats/);
});

test("synthetic documents keep independent tags and 1/3/6 image slots",()=>{
 for(const format of ["docx","pptx"]){
  for(const count of [1,3,6]){
   const input=syntheticOfficeTemplate(format,count);
   const before=readZip(input);
   const xml=before.find(p=>p.name===(format==="docx"?"word/document.xml":"ppt/slides/slide1.xml")).data.toString();
   assert.equal((xml.match(/\{\{CHART:TREND/g)||[]).length,count);
   const produced=packageScenario(format,count);
   assert.equal(produced.metadata.changes,count);
   assert.ok(produced.output.length>produced.input.length);
   assert.ok(readZip(produced.output).length>before.length);
   assert.equal(produced.metadata.unchangedParts.includes("docProps/core.xml"),true);
  }
 }
});

test("smoke runner records machine manifest, image digests, synthetic fixtures and pending manual review",()=>{
 const root=mkdtempSync(join(tmpdir(),"smn-415-baseline-"));
 try{
  const report=runBaseline({output:root,repeats:1,smoke:true});
  assert.equal(report.configuration.images,2);
  assert.equal(report.configuration.stressCases,2);
  assert.equal(report.configuration.packages,2);
  assert.equal(report.proofLevel.includes("manual Microsoft Office validation is pending"),true);
  assert.ok(existsSync(join(root,"RECETTE-MANUELLE.md")));
  const saved=JSON.parse(readFileSync(join(root,"baseline.json"),"utf8"));
  assert.equal(saved.cases.length,2);
  assert.ok(saved.cases.every(c=>/^[0-9a-f]{64}$/.test(c.sha256)));
  assert.ok(saved.cases.every(c=>c.durationMs.samples.length===1));
  for(const entry of saved.cases){
   const png=readFileSync(join(root,"images",entry.id+".png"));
   assert.equal(sha(png),entry.sha256);
  }
  for(const format of ["docx","pptx"]){
   assert.ok(existsSync(join(root,"packages",format+"-1-charts-source."+format)));
   assert.ok(existsSync(join(root,"packages",format+"-1-charts-generated."+format)));
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
