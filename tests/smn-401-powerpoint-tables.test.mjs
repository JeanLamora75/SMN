import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {generateScalarOffice} from "../scripts/smn-399-office-scalars.mjs";
import {expandPowerPointTablesXml,generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";

const header='<a:tr h="250000"><a:tc><a:txBody><a:p><a:r><a:t>Nom</a:t></a:r></a:p></a:txBody></a:tc></a:tr>';
const model='<a:tr h="370000"><a:tc gridSpan="2"><a:txBody><a:p><a:r><a:rPr b="1"/><a:t>{{ROW:MEM</a:t></a:r><a:r><a:t>BERS}}{{MEMBER_NAME}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc hMerge="1"/><a:tc><a:txBody><a:p><a:r><a:t>{{MEMBER_ROLE}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr>';
const table='<a:tbl><a:tblPr firstRow="1"/><a:tblGrid><a:gridCol w="3500000"/></a:tblGrid>'+header+model+'</a:tbl>';
const slide='<p:sld><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Fixed"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>{{TEAM_NAME}}</a:t></a:r></a:p></p:txBody></p:sp><p:graphicFrame><p:xfrm><a:off x="100000" y="300000"/><a:ext cx="6000000" cy="1000000"/></p:xfrm><a:graphic><a:graphicData>'+table+'</a:graphicData></a:graphic></p:graphicFrame></p:spTree></p:cSld></p:sld>';
const members=[{MEMBER_NAME:"Alice & Bob",MEMBER_ROLE:"Développeur"},{MEMBER_NAME:"Chloé",MEMBER_ROLE:null},{MEMBER_NAME:"David",MEMBER_ROLE:"PO"}];
function packageOf(xml=slide){
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:"ppt/presentation.xml",data:Buffer.from("<p:presentation/>")},
  {name:"ppt/slides/slide1.xml",data:Buffer.from(xml)},
  {name:"ppt/slides/_rels/slide1.xml.rels",data:Buffer.from("<Relationships/>")},
  {name:"ppt/notesSlides/notesSlide1.xml",data:Buffer.from("<Notes>unchanged</Notes>")},
  {name:"ppt/theme/theme1.xml",data:Buffer.from("<Theme>unchanged</Theme>")}
 ]);
}
test("PPTX: 3 members, fragmented row marker, horizontal merge and style copied",()=>{
 const result=expandPowerPointTablesXml(slide,{MEMBERS:members,INDICATORS:[]});
 assert.equal(result.tableRows,1);
 assert.equal((result.xml.match(/<a:tr /g)||[]).length,4);
 assert.equal((result.xml.match(/<a:tr h="370000">/g)||[]).length,3);
 assert.equal((result.xml.match(/gridSpan="2"/g)||[]).length,3);
 assert.equal((result.xml.match(/<a:rPr b="1"\/>/g)||[]).length,3);
 assert.match(result.xml,/Alice &amp; Bob/);
 assert.match(result.xml,/N\/D/);
 assert.match(result.xml,/>Nom<\/a:t>/);
 assert.doesNotMatch(result.xml,/\{\{ROW:/);
 assert.match(result.xml,/<a:ext cx="6000000" cy="1000000"\/>/);
});
test("PPTX: no members leaves one data row with N/D",()=>{
 const result=expandPowerPointTablesXml(slide,{MEMBERS:[],INDICATORS:[]});
 assert.equal((result.xml.match(/<a:tr /g)||[]).length,2);
 assert.match(result.xml,/N\/D/);
 assert.match(result.xml,/firstRow="1"/);
});
test("PPTX: multiple independent data tables and scalar tags can coexist",()=>{
 const indicator=model.replace("{{ROW:MEM","{{ROW:INDI").replace("BERS}}","CATORS}}")
  .replaceAll("MEMBER_NAME","INDICATOR_NAME").replaceAll("MEMBER_ROLE","INDICATOR_VALUE");
 const xml=slide.replace("</p:spTree>","<p:graphicFrame><a:graphic><a:graphicData><a:tbl>"+indicator+"</a:tbl></a:graphicData></a:graphic></p:graphicFrame></p:spTree>");
 const r=expandPowerPointTablesXml(xml,{MEMBERS:members,INDICATORS:[{INDICATOR_NAME:"Vélocité",INDICATOR_VALUE:"0"},{INDICATOR_NAME:"Capacité",INDICATOR_VALUE:"3,25"}]});
 assert.equal(r.tableRows,2);
 assert.equal((r.xml.match(/<a:tr /g)||[]).length,6);
 assert.match(r.xml,/>0<\/a:t>/);
 assert.match(r.xml,/3,25/);
 const scalar=generateScalarOffice(packageOf(r.xml),"pptx",{TEAM_NAME:"Équipe Alpha"}).bytes;
 const final=readZip(scalar).find(p=>p.name==="ppt/slides/slide1.xml").data.toString();
 assert.match(final,/Équipe Alpha/);
 assert.match(final,/Chloé/);
});
test("PPTX: slide geometry, notes, relationships, theme and media not modified",()=>{
 const before=packageOf(),output=generatePowerPointTables(before,{MEMBERS:members,INDICATORS:[]});
 const a=new Map(readZip(before).map(p=>[p.name,p.data]));
 const b=new Map(readZip(output.bytes).map(p=>[p.name,p.data]));
 assert.deepEqual(output.changes,[{part:"ppt/slides/slide1.xml",count:1}]);
 for(const name of a.keys())if(name!=="ppt/slides/slide1.xml")
  assert.deepEqual(a.get(name),b.get(name));
 const xml=b.get("ppt/slides/slide1.xml").toString();
 assert.match(xml,/<a:off x="100000" y="300000"\/>/);
 assert.match(xml,/<a:ext cx="6000000" cy="1000000"\/>/);
});
test("PPTX: source unknown or ambiguous rejects explicitly",()=>{
 const unknown=slide.replace("{{ROW:MEM","{{ROW:UNKN").replace("BERS}}","OWN}}");
 assert.throws(()=>expandPowerPointTablesXml(unknown,{MEMBERS:members}),/invalid-row-marker/);
 const duplicate=slide.replace("{{MEMBER_ROLE}}","{{MEMBER_ROLE}}{{ROW:MEMBERS}}");
 assert.throws(()=>expandPowerPointTablesXml(duplicate,{MEMBERS:members}),/invalid-row-marker/);
});
test("PPTX: vertical merge, nested table and DTD explicitly rejected",()=>{
 const vertical=slide.replace('gridSpan="2"','rowSpan="2"');
 assert.throws(()=>expandPowerPointTablesXml(vertical,{MEMBERS:members}),/vertical-merge-unsupported/);
 const nested=slide.replace("{{MEMBER_ROLE}}","<a:tbl/><a:t>{{MEMBER_ROLE}}</a:t>");
 assert.throws(()=>expandPowerPointTablesXml(nested,{MEMBERS:members}),/nested-table-unsupported/);
 assert.throws(()=>expandPowerPointTablesXml("<!DOCTYPE x>"+slide,{MEMBERS:members}),/invalid-xml/);
});
test("PPTX: resource limit prevents silent truncation",()=>{
 const many=Array.from({length:10001},()=>({MEMBER_NAME:"A",MEMBER_ROLE:"B"}));
 assert.throws(()=>expandPowerPointTablesXml(slide,{MEMBERS:many}),/resource-limit/);
});
test("PPTX: row without a marker remains untouched",()=>{
 const result=expandPowerPointTablesXml(slide,{MEMBERS:members,INDICATORS:[]});
 assert.match(result.xml,header);
 assert.match(result.xml,/name="Fixed"/);
});
