import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {expandWordTablesXml,generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generateScalarOffice} from "../scripts/smn-399-office-scalars.mjs";

const row='<w:tr><w:trPr><w:cantSplit/></w:trPr>'+
 '<w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p>'+
 '<w:r><w:rPr><w:b/></w:rPr><w:t>{{ROW:MEM</w:t></w:r>'+
 '<w:r><w:t>BERS}}{{MEMBER_NAME}}</w:t></w:r></w:p></w:tc>'+
 '<w:tc><w:p><w:r><w:t>{{MEMBER_ROLE}}</w:t></w:r></w:p></w:tc></w:tr>';
const base='<w:document><w:body><w:p><w:r><w:t>{{TEAM_NAME}}</w:t></w:r></w:p>'+
 '<w:tbl><w:tblPr><w:tblStyle w:val="GridTable"/></w:tblPr>'+
 '<w:tr><w:tc><w:p><w:r><w:t>En-tête permanent</w:t></w:r></w:p></w:tc></w:tr>'+
 row+'</w:tbl><w:p><w:r><w:t>Footer text</w:t></w:r></w:p></w:body></w:document>';
const people=[{MEMBER_NAME:"Alice & Bob",MEMBER_ROLE:"Développeur"},
 {MEMBER_NAME:"Chloé",MEMBER_ROLE:null},
 {MEMBER_NAME:"David",MEMBER_ROLE:"PO"}];
function fixture(xml=base){
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:"word/document.xml",data:Buffer.from(xml)},
  {name:"word/styles.xml",data:Buffer.from("<styles>unchanged</styles>")},
  {name:"docProps/core.xml",data:Buffer.from("<core>original</core>")}
 ]);
}
test("Word tables: 3 authorized rows keep styles, bold text, spans, outside text",()=>{
 const result=expandWordTablesXml(base,{MEMBERS:people,INDICATORS:[]});
 assert.equal(result.tableRows,1);
 assert.equal((result.xml.match(/<w:tr>/g)||[]).length,4);
 assert.equal((result.xml.match(/<w:cantSplit\/>/g)||[]).length,3);
 assert.equal((result.xml.match(/<w:gridSpan w:val="2"\/>/g)||[]).length,3);
 assert.match(result.xml,/Alice &amp; Bob/);
 assert.match(result.xml,/>N\/D</);
 assert.match(result.xml,/En-tête permanent/);
 assert.match(result.xml,/Footer text/);
 assert.match(result.xml,/\{\{TEAM_NAME\}\}/);
 assert.doesNotMatch(result.xml,/\{\{ROW:MEMBERS\}\}/);
});
test("Word tables: no business rows produces N/D, without deletion of the template table",()=>{
 const result=expandWordTablesXml(base,{MEMBERS:[],INDICATORS:[]});
 assert.equal((result.xml.match(/<w:tr>/g)||[]).length,2);
 assert.match(result.xml,/>N\/D</);
 assert.match(result.xml,/GridTable/);
});
test("Word tables: indicator rows can be placed in a second independent table",()=>{
 const second=row.replace("MEMBERS","INDICATORS").replaceAll("MEMBER_NAME","INDICATOR_NAME")
  .replaceAll("MEMBER_ROLE","INDICATOR_VALUE");
 const xml=base.replace("</w:body>","<w:tbl>"+second+"</w:tbl></w:body>");
 const result=expandWordTablesXml(xml,{MEMBERS:people,INDICATORS:[
  {INDICATOR_NAME:"Vélocité",INDICATOR_VALUE:"0"},
  {INDICATOR_NAME:"Capacité",INDICATOR_VALUE:"3,25"}
 ]});
 assert.equal(result.tableRows,2);
 assert.match(result.xml,/>0<\/w:t>/);
 assert.match(result.xml,/3,25/);
 assert.equal((result.xml.match(/<w:tr>/g)||[]).length,6);
});
test("Word tables: all non-target ZIP parts remain identical",()=>{
 const source=fixture(),before=new Map(readZip(source).map(p=>[p.name,p.data]));
 const result=generateWordTables(source,{MEMBERS:people,INDICATORS:[]});
 const after=new Map(readZip(result.bytes).map(p=>[p.name,p.data]));
 assert.equal(result.changes.length,1);
 assert.deepEqual(before.get("word/styles.xml"),after.get("word/styles.xml"));
 assert.deepEqual(before.get("docProps/core.xml"),after.get("docProps/core.xml"));
 assert.deepEqual(before.get("[Content_Types].xml"),after.get("[Content_Types].xml"));
 assert.match(after.get("word/document.xml").toString(),/Chloé/);
});
test("Word tables and scalar tags coexist in one DOCX",()=>{
 const rows=generateWordTables(fixture(),{MEMBERS:people,INDICATORS:[]});
 const result=generateScalarOffice(rows.bytes,"docx",{TEAM_NAME:"Équipe Scrum"});
 const xml=readZip(result.bytes).find(p=>p.name==="word/document.xml").data.toString();
 assert.match(xml,/Équipe Scrum/);
 assert.match(xml,/Alice &amp; Bob/);
 assert.doesNotMatch(xml,/\{\{TEAM_NAME\}\}/);
});
test("Word tables: vertical merge and nested tables fail explicitly",()=>{
 const vertical=row.replace('<w:gridSpan w:val="2"/>','<w:vMerge w:val="restart"/>');
 assert.throws(()=>expandWordTablesXml("<w:tbl>"+vertical+"</w:tbl>",{MEMBERS:people}),/unsupported-structure/);
 assert.throws(()=>expandWordTablesXml("<w:tbl>"+row.replace("</w:tr>","<w:tbl/> </w:tr>")+"</w:tbl>",{MEMBERS:people}),/nested-not-supported/);
});
test("Word tables: unknown row source and ambiguous markers are rejected",()=>{
 assert.throws(()=>expandWordTablesXml("<w:tbl>"+row.replace("MEMBERS","UNKNOWN")+"</w:tbl>",{MEMBERS:people}),/invalid-source/);
 assert.throws(()=>expandWordTablesXml("<w:tbl>"+row.replace("</w:tr>","{{ROW:MEMBERS}}</w:tr>")+"</w:tbl>",{MEMBERS:people}),/invalid-source|ambiguous-marker/);
});
test("Word tables: technical resource limit rejects instead of truncating",()=>{
 const huge=Array.from({length:10001},()=>({MEMBER_NAME:"A",MEMBER_ROLE:"B"}));
 assert.throws(()=>expandWordTablesXml("<w:tbl>"+row+"</w:tbl>",{MEMBERS:huge}),/resource-limit/);
});
test("Word tables: unknown scalar tags are not rewritten",()=>{
 const xml="<w:tbl>"+row+"</w:tbl>";
 const result=expandWordTablesXml(xml,{MEMBERS:[{MEMBER_NAME:"A",MEMBER_ROLE:"B"}]});
 assert.match(result.xml,/>A<\/w:t>/);
 assert.equal(result.tableRows,1);
});
