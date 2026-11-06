import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";
import {generateScalarOffice} from "../scripts/smn-399-office-scalars.mjs";
import {insertOfficeTrendImages} from "../scripts/smn-402-office-chart-tags.mjs";
import {renderOfficeTrendPng} from "../scripts/smn-402-trend-png.mjs";
import {isSupportedOfficePackage} from "../src/server/reports/office-catalog";
import {inspectOfficeReport,saveOfficeReport,OfficeSaveConflict} from "../src/server/reports/office-storage";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";

const RELS='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
const mime={
 docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
 pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
};
const word='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
 '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Équipe {{TEAM_NAME}} — {{SPRINT_NAME}}</w:t></w:r></w:p>'+
 '<w:tbl><w:tblPr><w:tblStyle w:val="GridTable5Dark"/></w:tblPr>'+
 '<w:tr><w:tc><w:p><w:r><w:t>Nom</w:t></w:r></w:p></w:tc></w:tr>'+
 '<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr>'+
 '<w:p><w:r><w:t>{{ROW:MEM</w:t></w:r><w:r><w:t>BERS}}{{MEMBER_NAME}}</w:t></w:r></w:p></w:tc>'+
 '<w:tc><w:p><w:r><w:t>{{MEMBER_ROLE}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'+
 '<w:p><w:r><w:t>{{CHART:TREND}}</w:t></w:r></w:p><w:p><w:r><w:t>FIXE WORD</w:t></w:r></w:p>'+
 '</w:body></w:document>';
const ppt='<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>'+
 '<p:sp><p:nvSpPr><p:cNvPr id="6" name="Title"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>{{SPRINT_NAME}} — {{TEAM_NAME}}</a:t></a:r></a:p></p:txBody></p:sp>'+
 '<p:graphicFrame><p:xfrm><a:off x="250000" y="400000"/><a:ext cx="4800000" cy="2500000"/></p:xfrm><a:graphic><a:graphicData><a:tbl>'+
 '<a:tr h="200000"><a:tc><a:txBody><a:p><a:r><a:t>Nom</a:t></a:r></a:p></a:txBody></a:tc></a:tr>'+
 '<a:tr h="260000"><a:tc gridSpan="2"><a:txBody><a:p><a:r><a:t>{{ROW:MEMBERS}}{{MEMBER_NAME}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc hMerge="1"/><a:tc><a:txBody><a:p><a:r><a:t>{{MEMBER_ROLE}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr>'+
 '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>'+
 '<p:sp><p:nvSpPr><p:cNvPr id="7" name="Trend"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="500000" y="3000000"/><a:ext cx="4200000" cy="2200000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>{{CHART:TREND}}</a:t></a:r></a:p></p:txBody></p:sp>'+
 '<p:sp><p:nvSpPr><p:cNvPr id="8" name="Fixed"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>FIXE PPTX</a:t></a:r></a:p></p:txBody></p:sp>'+
 '</p:spTree></p:cSld></p:sld>';

function template(format:"docx"|"pptx"){
 const main=format==="docx"?"word/document.xml":"ppt/presentation.xml";
 const parts=[
  {name:"[Content_Types].xml",data:Buffer.from('<Types><Override PartName="/'+main+'" ContentType="'+mime[format]+'"/></Types>')},
  {name:"_rels/.rels",data:Buffer.from(RELS.replace("word/document.xml",main))},
  {name:main,data:Buffer.from(format==="docx"?word:"<p:presentation/>")},
  {name:"docProps/core.xml",data:Buffer.from("<core><sentinel>UNTOUCHED</sentinel></core>")},
  {name:format==="docx"?"word/styles.xml":"ppt/theme/theme1.xml",data:Buffer.from("<theme><sentinel>UNTOUCHED</sentinel></theme>")}
 ];
 if(format==="docx")parts.push({name:"word/_rels/document.xml.rels",data:Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')});
 else {
  parts.push({name:"ppt/slides/slide1.xml",data:Buffer.from(ppt)});
  parts.push({name:"ppt/slides/_rels/slide1.xml.rels",data:Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')});
  parts.push({name:"ppt/notesSlides/notesSlide1.xml",data:Buffer.from("<notes><sentinel>UNTOUCHED</sentinel></notes>")});
 }
 return writeZip(parts);
}
const rows=[
 {MEMBER_NAME:"Alice & Bob",MEMBER_ROLE:"Développement"},
 {MEMBER_NAME:"Chloé",MEMBER_ROLE:null},
 {MEMBER_NAME:"Zéro",MEMBER_ROLE:"0"}
];
const png=renderOfficeTrendPng({
 cycles:[{name:"Sprint 1"},{name:"Sprint 2"},{name:"Sprint 3"}],
 series:[{name:"Vélocité",values:[0,null,12]},{name:"Points initiaux",values:[13,14,15]}],
 type:"line",language:"fr"
});
assert.ok(png);
const sha=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
const evidence:{format:string;originalSha:string;resultSha:string;partsBefore:number;partsAfter:number;protectedParts:string[];imageCount:number;rowCount:number}[]=[];

function generate(format:"docx"|"pptx",people=rows,chart:Buffer|null=png){
 const original=template(format),sets={MEMBERS:people,INDICATORS:[]};
 const withRows=format==="docx"?generateWordTables(original,sets).bytes:generatePowerPointTables(original,sets).bytes;
 const withScalar=generateScalarOffice(withRows,format,{TEAM_NAME:"Scrum & Co",SPRINT_NAME:"Sprint 45",SPRINT_STATUS:"En cours"}).bytes;
 const withCharts=insertOfficeTrendImages(withScalar,format,()=>chart);
 return {original,output:withCharts.bytes,charts:withCharts.changes};
}
for(const format of ["docx","pptx"] as const){
 test("SMN-405 "+format+": chaîne réelle tags + lignes + image + parties inchangées",async()=>{
  const {original,output,charts}=generate(format);
  assert.equal(charts.length,1);
  assert.equal(isSupportedOfficePackage(output,format),true);
  const before=new Map(readZip(original).map(p=>[p.name,p.data]));
  const after=new Map(readZip(output).map(p=>[p.name,p.data]));
  const main=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=after.get(main)!.toString("utf8");
  assert.match(xml,/Sprint 45/);
  assert.match(xml,/Scrum &amp; Co/);
  assert.match(xml,/Alice &amp; Bob/);
  assert.match(xml,/N\/D/);
  assert.match(xml,/>0<\/(?:w:t|a:t)>/);
  assert.doesNotMatch(xml,/\{\{ROW:|\{\{CHART:|\{\{TEAM_NAME\}\}/);
  assert.match(xml,format==="docx"?/FIXE WORD/:/FIXE PPTX/);
  assert.equal((xml.match(format==="docx"?/<w:tr(?:\s|>)/g:/<a:tr(?:\s|>)/g)||[]).length,4);
  assert.ok([...after.keys()].some(p=>/\/media\/.*\.png$/.test(p)));
  const protectedParts=[...before.keys()].filter(p=>p==="docProps/core.xml"||/\/(?:theme|styles|notesSlides)\//.test(p));
  protectedParts.forEach(name=>assert.deepEqual(after.get(name),before.get(name)));
  evidence.push({format,originalSha:sha(original),resultSha:sha(output),
   partsBefore:before.size,partsAfter:after.size,protectedParts,imageCount:charts.length,rowCount:4});
  const outputDir=process.env.SMN_405_EVIDENCE_DIR;
  if(outputDir){await mkdir(outputDir,{recursive:true});await writeFile(path.join(outputDir,"sample."+format),output);}
 });
 test("SMN-405 "+format+": données absentes et zéro ne se confondent pas",()=>{
  const {output}=generate(format,[],null);
  const main=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=readZip(output).find(p=>p.name===main)!.data.toString();
  assert.match(xml,/N\/D/);
  assert.doesNotMatch(xml,/\{\{CHART:TREND\}\}/);
  assert.equal((xml.match(format==="docx"?/<w:tr(?:\s|>)/g:/<a:tr(?:\s|>)/g)||[]).length,2);
 });
}
test("SMN-405: corruption ZIP, ZIP bombs and directory traversal are rejected",()=>{
 const good=template("docx");
 assert.equal(isSupportedOfficePackage(good,"docx"),true);
 assert.equal(isSupportedOfficePackage(Buffer.from("not-a-zip"),"docx"),false);
 assert.equal(isSupportedOfficePackage(Buffer.alloc(20*1024*1024+1),"docx"),false);
 const malicious=writeZip([{name:"abc/hello",data:Buffer.from("BAD")}]);
 const harmless=Buffer.from("abc/hello"),attack=Buffer.from("../escape");
 let at=0,rewritten=0;
 while((at=malicious.indexOf(harmless,at))!==-1){attack.copy(malicious,at);at+=attack.length;rewritten++;}
 assert.equal(rewritten,2);
 assert.equal(isSupportedOfficePackage(malicious,"docx"),false);
 assert.throws(()=>readZip(malicious));
 const altered=Buffer.from(good),tail=altered.length-22;
 assert.equal(altered.readUInt32LE(tail),0x06054b50);
 const centralStart=altered.readUInt32LE(tail+16);
 altered[centralStart+16]^=0xff;
 assert.throws(()=>readZip(altered),/CRC/);
});
test("SMN-405: failures and stale confirmations never modify a previous report",async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),"smn405-"));
 try{
  const {output}=generate("docx");
  const initial=await inspectOfficeReport("Bilan","docx",folder);
  const written=await saveOfficeReport(output,"Bilan","docx",initial.fingerprint,folder);
  const target=path.join(folder,"Bilan.docx");
  const untouched=await readFile(target);
  await assert.rejects(()=>saveOfficeReport(Buffer.from("OTHER"),"Bilan","docx","absent",folder),OfficeSaveConflict);
  assert.deepEqual(await readFile(target),untouched);
  const stale=written.fingerprint;
  await writeFile(target,Buffer.from("EXTERNAL UPDATE"));
  await assert.rejects(()=>saveOfficeReport(output,"Bilan","docx",stale,folder),OfficeSaveConflict);
  assert.equal((await readFile(target)).toString(),"EXTERNAL UPDATE");
 }finally{await rm(folder,{recursive:true,force:true});}
});
test("SMN-405: record hash manifest for reproducibility",async()=>{
 const dir=process.env.SMN_405_EVIDENCE_DIR;
 if(!dir)return;
 // Test files run independently from other node:test suites and share this module's state.
 await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,"manifest.json"),JSON.stringify({
  suite:"SMN-405",kind:"synthetic-openxml-contract",
  note:"Structural/byte-level proof only; not a Microsoft Office visual certification",
  evidence
 },null,2)+"\n");
});
