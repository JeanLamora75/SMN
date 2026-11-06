import test from "node:test";
import assert from "node:assert/strict";
import { probeOfficePackage, readZip, replaceOfficeXml, writeZip } from "../scripts/smn-397-office-poc.mjs";

const word='<w:document><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{{SPR</w:t></w:r><w:r><w:t>INT}}</w:t></w:r><w:r><w:t> inchangé</w:t></w:r></w:p><w:p><w:r><w:t>{{UNKNOWN}}</w:t></w:r></w:p></w:document>';
const powerpoint='<p:sld><p:sp><a:p><a:r><a:rPr b="1"/><a:t>{{CAP</a:t></a:r><a:r><a:t>ACITY}}</a:t></a:r></a:p></p:sp><p:sp><a:p><a:r><a:t>{{UNKNOWN}}</a:t></a:r></a:p></p:sp></p:sld>';

function fixture(type, xml) {
  const entries=[
    {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
    {name:type==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(type==="docx"?xml:"<Presentation/>")},
    {name:"unrelated/theme.xml",data:Buffer.from("<theme>NO CHANGE</theme>")}
  ];
  if(type==="pptx")entries.push({name:"ppt/slides/slide1.xml",data:Buffer.from(xml)});
  return writeZip(entries);
}

test("SMN-397 DOCX: fragmented known tag, unknown tag and unrelated content",()=>{
  const src=fixture("docx",word);
  const {output,modified}=probeOfficePackage(src,{SPRINT:"Sprint & <12>"},"docx");
  const before=new Map(readZip(src).map(p=>[p.name,p.data]));
  const after=new Map(readZip(output).map(p=>[p.name,p.data]));
  assert.deepEqual(modified,[{file:"word/document.xml",replacements:1}]);
  assert.match(after.get("word/document.xml").toString(),/Sprint &amp; &lt;12&gt;/);
  assert.match(after.get("word/document.xml").toString(),/<w:b\/>/);
  assert.match(after.get("word/document.xml").toString(),/\{\{UNKNOWN\}\}/);
  assert.deepEqual(after.get("unrelated/theme.xml"),before.get("unrelated/theme.xml"));
});

test("SMN-397 PPTX: zero is preserved and theme is untouched",()=>{
  const src=fixture("pptx",powerpoint);
  const {output,modified}=probeOfficePackage(src,{CAPACITY:0},"pptx");
  const original=new Map(readZip(src).map(p=>[p.name,p.data]));
  const after=new Map(readZip(output).map(p=>[p.name,p.data]));
  assert.deepEqual(modified,[{file:"ppt/slides/slide1.xml",replacements:1}]);
  assert.match(after.get("ppt/slides/slide1.xml").toString(),/<a:t>0<\/a:t>/);
  assert.match(after.get("ppt/slides/slide1.xml").toString(),/<a:rPr b="1"\/>/);
  assert.match(after.get("ppt/slides/slide1.xml").toString(),/\{\{UNKNOWN\}\}/);
  assert.deepEqual(after.get("unrelated/theme.xml"),original.get("unrelated/theme.xml"));
});

test("SMN-397: missing data is N/D and tags never cross paragraph boundaries",()=>{
  const xml='<w:p><w:r><w:t>{{KNOWN}}</w:t></w:r></w:p><w:p><w:r><w:t>{{UN</w:t></w:r></w:p><w:p><w:r><w:t>KNOWN}}</w:t></w:r></w:p>';
  const result=replaceOfficeXml(xml,{KNOWN:null,UNKNOWN:"should not be inserted"});
  assert.equal(result.count,1);
  assert.match(result.xml,/<w:t>N\/D<\/w:t>/);
  assert.match(result.xml,/<w:t>\{\{UN<\/w:t>/);
});

test("SMN-397: corrupted ZIP and incomplete packages are rejected",()=>{
  assert.throws(()=>probeOfficePackage(Buffer.from("not a ZIP"),{},"docx"));
  assert.throws(()=>probeOfficePackage(writeZip([{name:"word/document.xml",data:Buffer.from("<w:document/>")}]),{},"docx"));
  const bytes=fixture("pptx",powerpoint);
  const offset=bytes.readUInt32LE(bytes.length-6);
  bytes[offset+16]^=0xff;
  assert.throws(()=>readZip(bytes));
});
