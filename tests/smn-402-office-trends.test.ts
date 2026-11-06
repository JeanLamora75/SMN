import test from "node:test";
import assert from "node:assert/strict";
import {writeZip,readZip} from "../scripts/smn-397-office-poc.mjs";
import {parseOfficeChartTag,discoverOfficeChartTags,insertOfficeTrendImages} from "../scripts/smn-402-office-chart-tags.mjs";
import {renderOfficeTrendPng} from "../scripts/smn-402-trend-png.mjs";
import {renderOfficeIndicatorChart} from "../src/server/reports/office-indicator-charts";

const columns=[
 {id:"a",tag:"SP_DONE",name:"Story Points",unit:"SP",style:"line",order:0},
 {id:"b",tag:"SP_INIT",name:"Points initiaux",unit:"SP",style:"line",order:1},
 {id:"c",tag:"CAPACITY",name:"Capacité",unit:"JH",style:"line",order:2}
];
const cycles=[
 {id:"c1",name:"Sprint 1",status:"closed",values:{a:"12",b:"17",c:"10"}},
 {id:"c2",name:"Sprint 2",status:"closed",values:{a:null,b:"0",c:"11"}},
 {id:"c3",name:"Sprint 3",status:"active",values:{a:"20",b:"21",c:"12"}}
];
const report={columns,cycles};
const docx='<w:document><w:body><w:p><w:r><w:t>{{CHART:TRE</w:t></w:r><w:r><w:t>ND|TAGS=SP_DONE,SP_INIT|LAST=3|TYPE=line}}</w:t></w:r></w:p><w:p><w:r><w:t>Contenu fixe</w:t></w:r></w:p></w:body></w:document>';
const pptx='<p:sld><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="5" name="Texte"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="111" y="222"/><a:ext cx="5000000" cy="2700000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>{{CHART:TREND}}</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="6" name="Autre"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>FIXE</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>';
function packageOf(format:"docx"|"pptx",xml:string){
 const parts=[
  {name:"[Content_Types].xml",data:Buffer.from('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>')},
  {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(format==="docx"?xml:"<p:presentation/>")},
  {name:format==="docx"?"word/_rels/document.xml.rels":"ppt/slides/_rels/slide1.xml.rels",data:Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')},
  {name:"docProps/core.xml",data:Buffer.from("<core>UNCHANGED</core>")}
 ];
 if(format==="pptx")parts.push({name:"ppt/slides/slide1.xml",data:Buffer.from(xml)});
 return writeZip(parts);
}
test("SMN-402: options par défaut et paramètres optionnels vérifiés",()=>{
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND}}"),{last:6,type:"bar",tags:null});
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND|TAGS=SP_DONE,SP_INIT|LAST=3|TYPE=line}}"),{last:3,type:"line",tags:["SP_DONE","SP_INIT"]});
 for(const token of ["{{CHART:TREND|LAST=0}}","{{CHART:TREND|LAST=25}}","{{CHART:TREND|TYPE=donut}}","{{CHART:TREND|LAST=2|LAST=4}}","{{CHART:TREND|TAGS=A,A}}","{{CHART:OTHER}}"])
  assert.throws(()=>parseOfficeChartTag(token));
});
test("SMN-402: projection v33 multiseries 3 cycles, zéros et absences",()=>{
 const options=parseOfficeChartTag("{{CHART:TREND|TAGS=SP_DONE,SP_INIT|LAST=3|TYPE=line}}") as {last:number;type:"line"|"bar"|"area";tags:string[]|null};
 const png=renderOfficeIndicatorChart(report,"c3",options,"fr");
 assert.ok(png&&png.length>2000);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.readUInt32BE(16),960);
 assert.equal(png.readUInt32BE(20),560);
});
test("SMN-402: mêmes unités obligatoires et sélection d'indicateurs valide",()=>{
 assert.throws(()=>renderOfficeIndicatorChart(report,"c3",{last:6,type:"line",tags:["SP_DONE","CAPACITY"]},"fr"),/mixed-unit/);
 assert.throws(()=>renderOfficeIndicatorChart(report,"c3",{last:6,type:"line",tags:["UNKNOWN"]},"fr"),/unavailable/);
});
test("SMN-402: aucune valeur exploitable produit N/D, jamais un zéro fictif",()=>{
 const missing={columns:[columns[0]],cycles:cycles.map(c=>({...c,values:{a:null}}))};
 assert.equal(renderOfficeIndicatorChart(missing,"c3",{last:6,type:"line",tags:null},"fr"),null);
});
test("SMN-402: styles ligne, barres et aire produisent des PNG distincts",()=>{
 const a=renderOfficeIndicatorChart(report,"c3",{last:3,type:"line",tags:["SP_DONE"]},"fr");
 const b=renderOfficeIndicatorChart(report,"c3",{last:3,type:"bar",tags:["SP_DONE"]},"fr");
 const c=renderOfficeIndicatorChart(report,"c3",{last:3,type:"area",tags:["SP_DONE"]},"fr");
 assert.notDeepEqual(a,b);
 assert.ok(c&&c.length>1000);
});
for(const [format,xml] of [["docx",docx],["pptx",pptx]] as const){
 test("SMN-402 "+format+": balise libre crée nouveau dessin PNG avec relations",()=>{
  const original=packageOf(format,xml),found=discoverOfficeChartTags(original,format);
  assert.equal(found.length,1);
  const updated=insertOfficeTrendImages(original,format,(_n:number,options:any)=>
   renderOfficeIndicatorChart(report,"c3",options,"fr"));
  assert.equal(updated.changes.length,1);
  const parts=new Map(readZip(updated.bytes).map(part=>[part.name,part.data]));
  const core=readZip(original).find(p=>p.name==="docProps/core.xml")!.data;
  assert.deepEqual(parts.get("docProps/core.xml"),core);
  assert.ok([...parts.keys()].some(name=>name.endsWith(".png")));
  const target=parts.get(format==="docx"?"word/document.xml":"ppt/slides/slide1.xml")!.toString();
  assert.match(target,/<a:blip/);
  assert.doesNotMatch(target,/CHART:TREND/);
  if(format==="pptx"){assert.match(target,/cx="5000000"/);assert.match(target,/FIXE/);}
  else assert.match(target,/Contenu fixe/);
 });
 test("SMN-402 "+format+": aucune donnée rend N/D dans la zone",()=>{
  const original=packageOf(format,xml);
  const result=insertOfficeTrendImages(original,format,()=>null);
  assert.deepEqual(result.changes,[]);
  const part=readZip(result.bytes).find(p=>p.name===(format==="docx"?"word/document.xml":"ppt/slides/slide1.xml"))!;
  assert.match(part.data.toString(),/N\/D/);
 });
}
test("SMN-402: tag graphique mélangé avec du texte fixe est refusé",()=>{
 const bad=docx.replace("{{CHART:TRE","voir {{CHART:TRE");
 assert.throws(()=>discoverOfficeChartTags(packageOf("docx",bad),"docx"),/invalid-tag/);
});

test("SMN-402: plusieurs graphiques Word possèdent des IDs de dessin distincts",()=>{
 const xml=docx.replace("</w:body>","<w:p><w:r><w:t>{{CHART:TREND}}</w:t></w:r></w:p></w:body>");
 const original=packageOf("docx",xml);
 const result=insertOfficeTrendImages(original,"docx",(_index:number,options:any)=>
  renderOfficeIndicatorChart(report,"c3",options,"fr"));
 assert.equal(result.changes.length,2);
 const doc=readZip(result.bytes).find(p=>p.name==="word/document.xml")!.data.toString();
 const ids=[...doc.matchAll(/<wp:docPr[^>]*id="(\d+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,2);
 assert.equal(new Set(ids).size,2);
});
