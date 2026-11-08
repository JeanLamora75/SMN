import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {expandPowerPointTextBoxesXml,expandPowerPointTablesXml} from "../scripts/smn-401-powerpoint-tables.mjs";
import {embedMemberFlagPictures,OfficeMemberFlagError} from "../scripts/smn-415-office-flag-images.mjs";

const PNG=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64");
const paragraph=(v)=>'<a:p><a:r><a:t>'+v+'</a:t></a:r></a:p>';
const slide=body=>'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:spPr/><p:txBody>'+body+'</p:txBody></p:sp></p:spTree></p:cSld></p:sld>';
const item=(name,data)=>({name,data:Buffer.isBuffer(data)?data:Buffer.from(data),method:8});
const makeZip=(text,rels='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>')=>writeZip([
 item("[Content_Types].xml",'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'),
 item("ppt/presentation.xml","<p:presentation/>"),
 item("ppt/slides/slide1.xml",slide(text)),
 item("ppt/slides/_rels/slide1.xml.rels",rels),
 item("ppt/media/logo.png","original logo")
]);
const byName=zip=>new Map(readZip(zip).map(p=>[p.name,p.data]));
const memberRows=[
 {MEMBER_FLAG:"SMN_FLAG_FR",MEMBER_NAME:"Member One",MEMBER_CITY:"Paris",MEMBER_FUNCTION:"Consultant"},
 {MEMBER_FLAG:"SMN_FLAG_IN",MEMBER_NAME:"Member Two",MEMBER_CITY:"Chennai",MEMBER_FUNCTION:"Développeur"},
 {MEMBER_FLAG:"SMN_FLAG_IN",MEMBER_NAME:"Member Three",MEMBER_CITY:"Pune",MEMBER_FUNCTION:"Lead Tech"}
];
test("repeat active-member paragraphs, replace code with PNG bullet, preserve names functions and cities",()=>{
 const src=makeZip(paragraph("{{ROW:MEMBERS_ACTIVE}}{{MEMBER_FLAG}} {{MEMBER_NAME}} — {{MEMBER_FUNCTION}} — {{MEMBER_CITY}}"));
 const xml=byName(src).get("ppt/slides/slide1.xml").toString();
 const expanded=expandPowerPointTextBoxesXml(xml,{MEMBERS_ACTIVE:memberRows}).xml;
 const pkg=writeZip(readZip(src).map(part=>part.name==="ppt/slides/slide1.xml"?{...part,data:Buffer.from(expanded)}:part));
 let loaded=0;
 const out=embedMemberFlagPictures(pkg,country=>{loaded++;assert.ok(["FR","IN"].includes(country));return PNG;});
 const after=byName(out.bytes);
 const slide=after.get("ppt/slides/slide1.xml").toString();
 assert.equal(out.changes.length,3);
 assert.equal(loaded,2);
 assert.equal((slide.match(/<a:buBlip>/g)||[]).length,3);
 assert.ok(!slide.includes("SMN_FLAG_"));
 for(const value of ["Paris","Chennai","Pune","Consultant","Développeur","Lead Tech","Member One"])
  assert.ok(slide.includes(value),value);
 const relationships=after.get("ppt/slides/_rels/slide1.xml.rels").toString();
 assert.equal((relationships.match(/<Relationship\b/g)||[]).length,2);
 assert.ok(relationships.includes("smn-member-flag-in.png"));
 assert.ok(relationships.includes("smn-member-flag-fr.png"));
 assert.ok(after.get("ppt/media/smn-member-flag-in.png").equals(PNG));
 assert.equal(after.get("ppt/media/logo.png").toString(),"original logo");
});
test("text table rows support picture bullets in each member cell without altering other columns",()=>{
 const table='<a:tbl><a:tr h="304800"><a:tc>'+paragraph("{{ROW:MEMBERS_ACTIVE}}{{MEMBER_FLAG}}")+'</a:tc><a:tc>'+paragraph("{{MEMBER_NAME}}")+'</a:tc><a:tc>'+paragraph("{{MEMBER_FUNCTION}}")+'</a:tc><a:tc>'+paragraph("{{MEMBER_CITY}}")+'</a:tc></a:tr></a:tbl>';
 const src=makeZip(table);
 const xml=byName(src).get("ppt/slides/slide1.xml").toString();
 const expanded=expandPowerPointTablesXml(xml,{MEMBERS_ACTIVE:memberRows}).xml;
 const pkg=writeZip(readZip(src).map(p=>p.name==="ppt/slides/slide1.xml"?{...p,data:Buffer.from(expanded)}:p));
 const out=embedMemberFlagPictures(pkg,()=>PNG);
 const after=byName(out.bytes).get("ppt/slides/slide1.xml").toString();
 assert.equal(out.changes.length,3);
 assert.equal((after.match(/<a:buBlip>/g)||[]).length,3);
 assert.ok(after.includes("Chennai"));
 assert.ok(after.includes("Développeur"));
});
test("can insert image relationship when existing relation nodes occupy rId1",()=>{
 const src=makeZip(paragraph("SMN_FLAG_IN "+ "Member"),
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="urn:existing" Target="../media/logo.png"/></Relationships>');
 const out=embedMemberFlagPictures(src,()=>PNG);
 const slide=byName(out.bytes).get("ppt/slides/slide1.xml").toString();
 assert.match(slide,/r:embed="rId2"/);
});
test("no markers keeps original bytes unchanged",()=>{
 const src=makeZip(paragraph("No member flag"));
 const out=embedMemberFlagPictures(src,()=>{throw Error("should-not-load");});
 assert.equal(out.bytes,src);
 assert.equal(out.changes.length,0);
});
test("invalid and missing assets fail rather than rendering country code",()=>{
 const src=makeZip(paragraph("SMN_FLAG_IN"));
 assert.throws(()=>embedMemberFlagPictures(src,()=>null),e=>e instanceof OfficeMemberFlagError&&e.code==="office-member-flag-asset-missing");
 assert.throws(()=>embedMemberFlagPictures(src,()=>Buffer.from("IN")),e=>e.code==="office-member-flag-asset-missing");
});
test("flag appears only as first paragraph element; midline flags are rejected",()=>{
 const src=makeZip(paragraph("Already text ")+paragraph("SMN_FLAG_IN"));
 assert.equal(embedMemberFlagPictures(src,()=>PNG).changes.length,1);
 const bad=makeZip(paragraph("Name SMN_FLAG_IN"));
 assert.throws(()=>embedMemberFlagPictures(bad,()=>PNG),e=>e.code==="office-member-flag-not-first");
});
