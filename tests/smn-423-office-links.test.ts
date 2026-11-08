import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";
import {activateOfficeLinkLabels} from "../scripts/smn-423-office-link-hyperlinks.mjs";
import {generateScalarOffice} from "../scripts/smn-399-office-scalars.mjs";
import {buildOfficeLinkRows} from "../src/server/reports/office-link-rows";

const teamId="team-one";
const links=[
 {id:"1",title:"Équipe & outils",url:"https://example.org/team?x=1&y=2",description:null,
  categoryName:"Outils",scope:"EQUIPE" as const,teamId},
 {id:"2",title:"Commun",url:"https://example.org/global",description:"Guide transverse",
  categoryName:"Guides",scope:"TRANSVERSE" as const,teamId:null},
 {id:"3",title:"Interdit",url:"https://example.org/secret",description:null,
  categoryName:"Guides",scope:"EQUIPE" as const,teamId:"another-team"},
 {id:"4",title:"Alpha",url:"https://example.org/alpha",description:null,
  categoryName:"Guides",scope:"EQUIPE" as const,teamId}
];
const wr=(value:string)=>'<w:r><w:rPr><w:b/></w:rPr><w:t>'+value+'</w:t></w:r>';
const ar=(value:string)=>'<a:r><a:rPr b="1"/><a:t>'+value+'</a:t></a:r>';
function sample(format:"docx"|"pptx"){
 const parts=format==="docx"?[
  {name:"word/document.xml",data:Buffer.from('<w:document xmlns:w="x" xmlns:r="y"><w:body>'+
   '<w:p>'+wr("{{LINK_COUNT_TRANSVERSE}} / {{LINK_COUNT_TEAM}}")+'</w:p>'+
   '<w:tbl><w:tr><w:tc><w:p>'+wr("Cross-team")+'</w:p></w:tc></w:tr>'+
   '<w:tr><w:tc><w:p>'+wr("{{ROW:LINKS_TRANSVERSE}}{{LINK_TITLE}}")+'</w:p></w:tc>'+
   '<w:tc><w:p>'+wr("{{LINK_LABEL}}")+'</w:p></w:tc></w:tr></w:tbl>'+
   '<w:tbl><w:tr><w:tc><w:p>'+wr("{{ROW:LINKS_TEAM}}{{LINK_TITLE}}")+'</w:p></w:tc>'+
   '<w:tc><w:p>'+wr("{{LINK_LABEL}}")+'</w:p></w:tc></w:tr></w:tbl>'+
   '</w:body></w:document>')},
  {name:"word/styles.xml",data:Buffer.from("<styles>untouched</styles>")}
 ]:[
  {name:"ppt/presentation.xml",data:Buffer.from("<p:presentation/>")},
  {name:"ppt/slides/slide1.xml",data:Buffer.from('<p:sld xmlns:r="y"><p:sp><p:txBody><a:p>'+ar("{{LINK_COUNT_TRANSVERSE}} / {{LINK_COUNT_TEAM}}")+'</a:p></p:txBody></p:sp>'+
   '<p:graphicFrame><a:graphic><a:graphicData><a:tbl><a:tr><a:tc><a:txBody><a:p>'+ar("{{ROW:LINKS_TRANSVERSE}}{{LINK_TITLE}}")+
   '</a:p></a:txBody></a:tc><a:tc><a:txBody><a:p>'+ar("{{LINK_LABEL}}")+'</a:p></a:txBody></a:tc></a:tr></a:tbl>'+
   '</a:graphicData></a:graphic></p:graphicFrame>'+
   '<p:graphicFrame><a:graphic><a:graphicData><a:tbl><a:tr><a:tc><a:txBody><a:p>'+ar("{{ROW:LINKS_TEAM}}{{LINK_TITLE}}")+
   '</a:p></a:txBody></a:tc><a:tc><a:txBody><a:p>'+ar("{{LINK_LABEL}}")+'</a:p></a:txBody></a:tc></a:tr></a:tbl>'+
   '</a:graphicData></a:graphic></p:graphicFrame></p:sld>')},
  {name:"ppt/theme/theme1.xml",data:Buffer.from("<theme>untouched</theme>")}
 ];
 return writeZip([{name:"[Content_Types].xml",data:Buffer.from("<Types/>")},...parts]);
}
test("all accessible links are sorted within their scope; no other team's links leak",()=>{
 const x=buildOfficeLinkRows(links,teamId,"fr");
 assert.deepEqual(x.rows.LINKS_TRANSVERSE.map(r=>r.LINK_TITLE),["Commun"]);
 assert.deepEqual(x.rows.LINKS_TEAM.map(r=>r.LINK_TITLE),["Alpha","Équipe & outils"]);
 assert.equal(x.counts.LINK_COUNT_TEAM,"2");
 assert.equal(x.counts.LINK_COUNT_TRANSVERSE,"1");
 assert.equal(x.rows.LINKS_TEAM[1].LINK_DESCRIPTION,"N/D");
 assert.equal(x.rows.LINKS_TEAM[0].LINK_SCOPE,"Équipe");
 assert.equal(buildOfficeLinkRows(links,teamId,"en").rows.LINKS_TRANSVERSE[0].LINK_SCOPE,"Cross-team");
});
for(const format of ["docx","pptx"] as const){
 test(format+" repeats both independent link blocks, adds click-through relations and scalars",()=>{
  const data=buildOfficeLinkRows(links,teamId,"fr"),src=sample(format);
  const converted=format==="docx"?
   generateWordTables(src,data.rows).bytes:generatePowerPointTables(src,data.rows).bytes;
  const withHrefs=activateOfficeLinkLabels(converted,format,data.labels);
  assert.equal(withHrefs.hyperlinks,3);
  const final=generateScalarOffice(withHrefs.bytes,format,data.counts);
  const zip=new Map(readZip(final.bytes).map(p=>[p.name,p.data.toString("utf8")]));
  const part=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const rel=format==="docx"?"word/_rels/document.xml.rels":"ppt/slides/_rels/slide1.xml.rels";
  const xml=zip.get(part)!,rels=zip.get(rel)!;
  assert.match(xml,/Équipe &amp; outils/);
  assert.match(xml,/Commun/);
  assert.match(xml,/Alpha/);
  assert.doesNotMatch(xml,/Interdit|SMN_LINK_|\{\{LINK_/);
  assert.match(xml,/>1 \/ 2</);
  assert.equal((rels.match(/TargetMode="External"/g)||[]).length,3);
  assert.match(rels,/https:\/\/example.org\/team\?x=1&amp;y=2/);
  assert.match(rels,/https:\/\/example.org\/global/);
  if(format==="docx")assert.equal((xml.match(/<w:hyperlink r:id=/g)||[]).length,3);
  else assert.equal((xml.match(/<a:hlinkClick r:id=/g)||[]).length,3);
  assert.match(zip.get(format==="docx"?"word/styles.xml":"ppt/theme/theme1.xml")!,/untouched/);
 });
 test(format+" empty collections remove link rows and yield zero counters",()=>{
  const empty=buildOfficeLinkRows([],teamId,"fr"),source=sample(format);
  const rows=format==="docx"?generateWordTables(source,empty.rows):generatePowerPointTables(source,empty.rows);
  const final=generateScalarOffice(activateOfficeLinkLabels(rows.bytes,format,empty.labels).bytes,format,empty.counts);
  const target=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=readZip(final.bytes).find(p=>p.name===target)!.data.toString();
  assert.match(xml,/>0 \/ 0</);
  assert.doesNotMatch(xml,/ROW:LINKS|LINK_TITLE|LINK_LABEL|SMN_LINK_/);
 });
}
test("unsafe URLs and unresolved synthetic placeholders fail without emitting a document",()=>{
 const src=sample("docx");
 assert.throws(()=>activateOfficeLinkLabels(src,"docx",
  [{token:"SMN_LINK_000000_LABEL",label:"Malicious",url:"javascript:alert(1)"}]),/invalid-url/);
 assert.throws(()=>activateOfficeLinkLabels(src,"docx",
  [{token:"SMN_LINK_000000_LABEL",label:"Bad",url:"https://u:p@example.org"}]),/invalid-url/);
 const x=buildOfficeLinkRows(links,teamId,"fr");
 const bytes=generateWordTables(src,x.rows).bytes;
 assert.throws(()=>activateOfficeLinkLabels(bytes,"docx",[]),/unresolved-label/);
});
test("SMN-423 integration uses catalog visibility and does not use manually selected report links",()=>{
 const impl=readFileSync("src/server/reports/office-link-rows.ts","utf8");
 const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 assert.match(impl,/listLinks\(db,actor,teamId\)/);
 assert.doesNotMatch(impl,/selectedReportExportLinks|readReportLinks/);
 assert.match(route,/readOfficeLinkRows\(db/);
 assert.match(route,/activateOfficeLinkLabels\(base/);
 assert.match(route,/LINK_COUNT_TEAM|links\.counts/);
});
