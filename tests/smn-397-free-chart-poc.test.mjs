import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {expandTableRows,expandOfficeTables} from "../scripts/smn-397-office-complex-poc.mjs";
import {embedFreeChartTags} from "../scripts/smn-397-free-chart-poc.mjs";

const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(64)]);
const word='<w:document><w:body><w:p><w:r><w:t>{{CHART:</w:t></w:r><w:r><w:t>TREND}}</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:MEMBERS}}{{NAME}}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>{{DAYS}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
const ppt='<p:sld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="3" name="ChartTag"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="100" y="200"/><a:ext cx="2500" cy="1200"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>{{CHART:</a:t></a:r><a:r><a:t>TREND}}</a:t></a:r></a:p></p:txBody></p:sp><a:tbl><a:tr h="250"><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:MEMBERS}}{{NAME}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>{{DAYS}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></p:spTree></p:sld>';
const fixture=type=>writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types></Types>")},
  {name:type==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(type==="docx"?word:"<p:presentation/>")},
  ...(type==="pptx"?[{name:"ppt/slides/slide1.xml",data:Buffer.from(ppt)}]:[]),
  {name:type==="docx"?"word/_rels/document.xml.rels":"ppt/slides/_rels/slide1.xml.rels",data:Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')},
  {name:"docProps/core.xml",data:Buffer.from("<core>FIXED</core>")}
]);
for(const type of ["docx","pptx"]){
  test(type+": une balise texte fragmentée crée image et relation",()=>{
    const source=fixture(type),before=new Map(readZip(source).map(e=>[e.name,e.data]));
    const result=embedFreeChartTags(source,type,{TREND:png});
    assert.equal(result.changed.length,1);
    const changed=result.changed[0],after=new Map(readZip(result.output).map(e=>[e.name,e.data]));
    assert.deepEqual(after.get(changed.media),png);
    assert.match(after.get(changed.part).toString(),/<a:blip/);
    assert.match(after.get(changed.part).toString(),new RegExp(changed.relationship));
    assert.deepEqual(after.get("docProps/core.xml"),before.get("docProps/core.xml"));
    if(type==="pptx")assert.match(after.get(changed.part).toString(),/<a:ext cx="2500" cy="1200"\/>/);
  });
  test(type+": graphique et lignes dynamiques coexistent",()=>{
    const imageOut=embedFreeChartTags(fixture(type),type,{TREND:png});
    const tables=expandOfficeTables(imageOut.output,type,{MEMBERS:[{NAME:"Alice",DAYS:0},{NAME:"Bob",DAYS:2}]});
    assert.equal(tables.changed.length,1);
    const xml=readZip(tables.output).find(e=>e.name===tables.changed[0].part).data.toString();
    assert.match(xml,/<a:blip/);
    assert.match(xml,/Alice/);
    assert.match(xml,/>0</);
  });
}
test("DOCX: une fusion horizontale est conservée sur toutes les lignes",()=>{
  const row='<w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:t>{{ROW:PEOPLE}}{{NAME}}</w:t></w:r></w:p></w:tc></w:tr>';
  const output=expandTableRows(row,"docx",{PEOPLE:[{NAME:"A"},{NAME:"B"}]});
  assert.equal((output.xml.match(/w:gridSpan/g)||[]).length,2);
});
test("PPTX: fusion horizontale et hauteur conservées",()=>{
  const row='<a:tr h="123"><a:tc gridSpan="2"><a:txBody><a:p><a:r><a:t>{{ROW:PEOPLE}}{{NAME}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc hMerge="1"/></a:tr>';
  const output=expandTableRows(row,"pptx",{PEOPLE:[{NAME:"A"},{NAME:"B"}]});
  assert.equal((output.xml.match(/gridSpan="2"/g)||[]).length,2);
  assert.equal((output.xml.match(/h="123"/g)||[]).length,2);
});
test("Fusions verticales et tableaux imbriqués refusés",()=>{
  assert.throws(()=>expandTableRows('<w:tr><w:tc><w:vMerge/><w:t>{{ROW:PEOPLE}}</w:t></w:tc></w:tr>',"docx",{PEOPLE:[{}]}),/Fusion verticale/);
  assert.throws(()=>expandTableRows('<w:tr><w:tbl/><w:t>{{ROW:PEOPLE}}</w:t></w:tr>',"docx",{PEOPLE:[{}]}),/Tableau imbriqué/);
});
test("Une balise inconnue reste intacte et un PNG invalide est refusé",()=>{
  const source=fixture("docx");
  assert.equal(embedFreeChartTags(source,"docx",{}).changed.length,0);
  assert.throws(()=>embedFreeChartTags(source,"docx",{TREND:Buffer.from("bad")}),/PNG invalide/);
});
