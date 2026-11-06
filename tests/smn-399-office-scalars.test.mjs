import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {replaceScalarXml,generateScalarOffice,buildScalarValues,formatScalarNumber} from "../scripts/smn-399-office-scalars.mjs";

const w='<w:document><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bonjour {{TE</w:t></w:r><w:r><w:t>AM_NAME}} et {{SPRINT_NAME}}</w:t></w:r></w:p><w:p><w:r><w:t>{{INDICATOR_VELOCITY}}</w:t></w:r><w:r><w:t> / {{INDICATOR_NULL}}</w:t></w:r></w:p><w:p><w:r><w:t>{{OTHER}}</w:t></w:r></w:p></w:document>';
const p='<p:sld><p:sp><a:p><a:r><a:rPr b="1"/><a:t>{{TEAM_NAME}} = {{INDICATOR_VELOCITY}}</a:t></a:r></a:p></p:sp></p:sld>';
const values=buildScalarValues({TEAM_NAME:"Équipe & <Alpha>",SPRINT_NAME:"Sprint 12",indicators:[
 {tag:"VELOCITY",available:true,value:"0"},{tag:"NULL",available:false,value:"999"}
]});
function zip(format,xml){
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(format==="docx"?xml:"<p:presentation/>")},
  ...(format==="pptx"?[{name:"ppt/slides/slide1.xml",data:Buffer.from(xml)}]:[]),
  {name:"docProps/core.xml",data:Buffer.from("IMMUABLE")}
 ]);
}
test("Word: tags fragmentés, multiples, zéro, N/D et tags inconnus",()=>{
 const r=replaceScalarXml(w,values);
 assert.equal(r.replacements,4);
 assert.match(r.xml,/Équipe &amp; &lt;Alpha&gt;/);
 assert.match(r.xml,/Sprint 12/);
 assert.match(r.xml,/<w:t>0<\/w:t>/);
 assert.match(r.xml,/N\/D/);
 assert.match(r.xml,/\{\{OTHER\}\}/);
 assert.match(r.xml,/<w:b\/>/);
});
test("PowerPoint: style et texte adjacent conservés",()=>{
 const r=replaceScalarXml(p,values);
 assert.equal(r.replacements,2);
 assert.match(r.xml,/rPr b="1"/);
 assert.match(r.xml,/Équipe &amp; &lt;Alpha&gt; = 0/);
});
test("Entités XML et remplacements multiples sans double échappement",()=>{
 const r=replaceScalarXml('<w:p><w:r><w:t>Fish &amp; Chips {{TEAM_NAME}} {{TEAM_NAME}}</w:t></w:r></w:p>',values);
 assert.equal(r.replacements,2);
 assert.match(r.xml,/Fish &amp; Chips/);
 assert.doesNotMatch(r.xml,/&amp;amp;/);
 assert.equal((r.xml.match(/Équipe &amp; &lt;Alpha&gt;/g)||[]).length,2);
});
test("Tags séparés par deux paragraphes : aucune substitution",()=>{
 const xml='<w:p><w:r><w:t>{{TEAM_</w:t></w:r></w:p><w:p><w:r><w:t>NAME}}</w:t></w:r></w:p>';
 assert.equal(replaceScalarXml(xml,values).xml,xml);
});
test("Tag reconnu mal paramétré : erreur explicite",()=>{
 assert.throws(()=>replaceScalarXml('<w:p><w:r><w:t>{{TEAM_NAME|LANG=EN}}</w:t></w:r></w:p>',values),/Paramètres de tag/);
});
test("Seules les parties XML ciblées sont modifiées",()=>{
 for(const format of ["docx","pptx"]){
  const source=zip(format,format==="docx"?w:p);
  const r=generateScalarOffice(source,format,values);
  const before=new Map(readZip(source).map(x=>[x.name,x.data]));
  const after=new Map(readZip(r.bytes).map(x=>[x.name,x.data]));
  assert.equal(r.changes.length,1);
  assert.deepEqual(before.get("docProps/core.xml"),after.get("docProps/core.xml"));
  assert.deepEqual(before.get("[Content_Types].xml"),after.get("[Content_Types].xml"));
 }
});
test("Indicateurs : source indisponible N/D, zéro conservé",()=>{
 assert.equal(values.INDICATOR_NULL,null);
 assert.equal(values.INDICATOR_VELOCITY,"0");
 assert.equal(values.TEAM_NAME,"Équipe & <Alpha>");
});

test("Format des nombres selon la langue de génération",()=>{
 assert.equal(formatScalarNumber("12.345","fr"),"12,35");
 assert.equal(formatScalarNumber("12.345","en"),"12.35");
 assert.equal(formatScalarNumber(0,"fr"),"0");
 assert.equal(formatScalarNumber(null,"fr"),null);
});
