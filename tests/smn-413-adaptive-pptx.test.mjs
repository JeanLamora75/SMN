import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {insertAdaptivePowerPointCharts,OfficePowerPointInsertionError} from "../scripts/smn-413-adaptive-pptx.mjs";
import {discoverPowerPointChartTargets} from "../scripts/smn-411-chart-targets.mjs";
import {renderAdaptiveChartPng} from "../scripts/smn-412-adaptive-chart.mjs";

const sig=Buffer.from([137,80,78,71,13,10,26,10]);
const part=(name,data)=>({name,data:Buffer.from(data),method:8});
const shape=(id,text,x="457200",y="457200",cx="4572000",cy="2743200")=>
 '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Chart"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
 '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm></p:spPr>'+
 '<p:txBody><a:p><a:r><a:t>'+text+'</a:t></a:r></a:p></p:txBody></p:sp>';
const slide=shapes=>'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>'+shapes+'</p:spTree></p:cSld></p:sld>';
const rels='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="urn:existing" Target="../media/logo.png"/></Relationships>';
const type='<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>';
function presentation(slides){
 return writeZip([
  part("[Content_Types].xml",type),
  part("ppt/presentation.xml","<p:presentation/>"),
  part("ppt/slides/_rels/slide1.xml.rels",rels),
  part("ppt/media/logo.png","logo data unchanged"),
  part("ppt/theme/theme1.xml","<a:theme>unchanged</a:theme>"),
  ...slides.map((body,i)=>part("ppt/slides/slide"+(i+1)+".xml",slide(body)))
 ]);
}
const cycles=Array.from({length:6},(_,i)=>({name:"Sprint "+(101+i)}));
const series=[{name:"Vélocité réalisée",unit:"SP",values:[10,20,null,35,0,48]}];
const raster=target=>renderAdaptiveChartPng({target,cycles,series,type:target.options.type,locale:"fr"});
const zipMap=pkg=>new Map(readZip(pkg).map(part=>[part.name,part.data.toString("hex")]));
const error=(callback,code)=>assert.throws(callback,e=>e instanceof OfficePowerPointInsertionError&&e.code===code);

test("preserves three untouched cards, logo, theme and shape geometry",()=>{
 const before=presentation([shape(3,"{{CHART:TREND|TYPE=line}}")+shape(4,"Cadre 2")+shape(5,"Cadre 3")+shape(6,"Cadre 4")]);
 const result=insertAdaptivePowerPointCharts(before,raster);
 assert.equal(result.changes.length,1);
 const {media,relationship}=result.changes[0];
 assert.equal(relationship,"rId2");
 const files=new Map(readZip(result.bytes).map(item=>[item.name,item.data]));
 const xml=files.get("ppt/slides/slide1.xml").toString();
 assert.equal((xml.match(/<p:pic>/g)||[]).length,1);
 assert.equal((xml.match(/<p:sp>/g)||[]).length,3);
 for(const phrase of ["Cadre 2","Cadre 3","Cadre 4"])assert.ok(xml.includes(phrase));
 assert.ok(xml.includes('<a:off x="457200" y="457200"/>'));
 assert.ok(xml.includes('<a:ext cx="4572000" cy="2743200"/>'));
 assert.ok(xml.includes('<p:cNvPr id="3"'));
 assert.ok(xml.includes('r:embed="rId2"'));
 assert.ok(files.get(media).subarray(0,8).equals(sig));
 const rel=files.get("ppt/slides/_rels/slide1.xml.rels").toString();
 assert.ok(rel.includes('Id="rId1"'));assert.ok(rel.includes('Id="rId2"'));
 assert.equal((rel.match(/<Relationship\b/g)||[]).length,2);
 assert.ok(files.get("[Content_Types].xml").toString().includes('Extension="png"'));
 const original=zipMap(before),generated=zipMap(result.bytes);
 for(const key of ["ppt/media/logo.png","ppt/theme/theme1.xml","ppt/presentation.xml"])
  assert.equal(generated.get(key),original.get(key));
 assert.equal(generated.get("ppt/media/logo.png"),original.get("ppt/media/logo.png"));
 assert.equal(discoverPowerPointChartTargets(result.bytes).length,0);
});

test("multiple different cards and slides have independent media and relations",()=>{
 const input=presentation([
  shape(9,"{{CHART:TREND}}")+shape(10,"{{CHART:TREND|TYPE=bar}}"),
  shape(9,"{{CHART:TREND|TYPE=area}}")
 ]);
 const output=insertAdaptivePowerPointCharts(input,raster);
 assert.equal(output.changes.length,3);
 assert.equal(new Set(output.changes.map(c=>c.media)).size,3);
 assert.equal(new Set(output.changes.map(c=>c.part+"|"+c.relationship)).size,3);
 const map=new Map(readZip(output.bytes).map(x=>[x.name,x.data.toString("utf8")]));
 assert.equal((map.get("ppt/slides/slide1.xml").match(/<p:pic>/g)||[]).length,2);
 assert.equal((map.get("ppt/slides/slide2.xml").match(/<p:pic>/g)||[]).length,1);
 assert.ok(map.get("ppt/slides/_rels/slide2.xml.rels").includes('Id="rId1"'));
 for(const change of output.changes)assert.ok(map.has(change.media));
});

test("all missing produces N/D and no image relation, no false graph",()=>{
 const input=presentation([shape(3,"{{CHART:TREND}}")]);
 const output=insertAdaptivePowerPointCharts(input,()=>null);
 assert.equal(output.changes.length,1);
 assert.equal(output.changes[0].empty,true);
 const map=zipMap(output.bytes);
 assert.ok(Buffer.from(map.get("ppt/slides/slide1.xml"),"hex").toString().includes("<a:t>N/D</a:t>"));
 assert.equal(map.get("ppt/slides/_rels/slide1.xml.rels"),zipMap(input).get("ppt/slides/_rels/slide1.xml.rels"));
 assert.equal(readZip(output.bytes).filter(p=>p.name.startsWith("ppt/media/")).length,1);
});

test("invalid geometry, groups and rendering exceptions abort without modifying input",()=>{
 const input=presentation([shape(3,"{{CHART:TREND}}")]);
 const before=zipMap(input);
 assert.throws(()=>insertAdaptivePowerPointCharts(input,()=>{throw Error("rendering failed");}),/rendering failed/);
 assert.deepEqual(zipMap(input),before);
 const grouped=presentation(["<p:grpSp>"+shape(3,"{{CHART:TREND}}")+"</p:grpSp>"]);
 assert.throws(()=>insertAdaptivePowerPointCharts(grouped,raster),/office-chart-unsupported-group/);
});

test("reject PNG ratio mismatch and over-sized raster instead of embedding corrupted media",()=>{
 const input=presentation([shape(3,"{{CHART:TREND}}")]);
 const png=raster(discoverPowerPointChartTargets(input)[0]);
 const invalid=Buffer.from(png);invalid.writeUInt32BE(400,20);
 error(()=>insertAdaptivePowerPointCharts(input,()=>invalid),"office-chart-ratio-mismatch");
 error(()=>insertAdaptivePowerPointCharts(input,()=>Buffer.alloc(8*1024*1024+1)),"office-chart-invalid-png");
});

test("old and new chart detector support unchanged CHART:TREND grammar",()=>{
 const input=presentation([shape(3,"{{CHART:TREND|TYPE=bar|TAGS=SP_DONE|LAST=6}}")]);
 assert.deepEqual(discoverPowerPointChartTargets(input)[0].options,
  {last:6,type:"bar",tags:["SP_DONE"]});
});


test("PowerPoint non-self-closing cNvPr with child elements is preserved as chart picture",()=>{
 const source=presentation([shape(3,"{{CHART:TREND|TYPE=line}}")]);
 const parts=readZip(source).map(p=>{
  if(p.name!=="ppt/slides/slide1.xml")return p;
  const xml=p.data.toString("utf8").replace(
   '<p:cNvPr id="3" name="Chart"/>',
   '<p:cNvPr id="3" name="Chart"><a:hlinkClick r:id="rIdExternal"/></p:cNvPr>');
  return {...p,data:Buffer.from(xml)};
 });
 const input=writeZip(parts);
 const result=insertAdaptivePowerPointCharts(input,raster);
 assert.equal(result.changes.length,1);
 const updated=readZip(result.bytes).find(p=>p.name==="ppt/slides/slide1.xml").data.toString("utf8");
 assert.match(updated,/<p:pic>/);
 assert.match(updated,/<p:cNvPr id="3"/);
 assert.equal(discoverPowerPointChartTargets(result.bytes).length,0);
});

test("PowerPoint self-closing empty Relationships can receive a new image rId",()=>{
 const source=presentation([shape(3,"{{CHART:TREND|TYPE=line}}")]);
 const parts=readZip(source).map(p=>p.name==="ppt/slides/_rels/slide1.xml.rels"?
  {...p,data:Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>')}:p);
 const result=insertAdaptivePowerPointCharts(writeZip(parts),raster);
 assert.equal(result.changes.length,1);
 assert.equal(result.changes[0].relationship,"rId1");
 const xml=readZip(result.bytes).find(p=>p.name==="ppt/slides/_rels/slide1.xml.rels").data.toString();
 assert.match(xml,/<Relationship Id="rId1"/);
 assert.match(xml,/<\/Relationships>/);
});
