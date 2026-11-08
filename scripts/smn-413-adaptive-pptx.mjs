import {readZip,writeZip} from "./smn-397-office-poc.mjs";
import {discoverPowerPointChartTargets,OfficeChartTargetError} from "./smn-411-chart-targets.mjs";

const IMAGE_REL="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const RELS_NS="http://schemas.openxmlformats.org/package/2006/relationships";
const PNG_SIG=Buffer.from([137,80,78,71,13,10,26,10]);
const attr=(text,name)=>new RegExp("\\b"+name+"\\s*=\\s*[\"']([^\"']+)[\"']").exec(text)?.[1]??null;
const xmlEsc=text=>String(text).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
export class OfficePowerPointInsertionError extends Error{
 constructor(code,slide=null,shapeId=null){
  super(code);this.name="OfficePowerPointInsertionError";
  this.code=code;this.slide=slide;this.shapeId=shapeId;
 }
}
function reject(code,target){throw new OfficePowerPointInsertionError(code,target?.slide??null,target?.shapeId??null);}
function verifyPng(png,target){
 if(!Buffer.isBuffer(png)||png.length<45||png.length>8*1024*1024||!png.subarray(0,8).equals(PNG_SIG))
  reject("office-chart-invalid-png",target);
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 if(!width||!height||Math.abs((width/height)/target.ratio-1)>.01)
  reject("office-chart-ratio-mismatch",target);
}
function replaceShape(shape,mediaRid,target){
 const transform=shape.match(/<a:xfrm\b[^>]*>[\s\S]*?<\/a:xfrm>/)?.[0];
 if(!transform)reject("office-chart-invalid-geometry",target);
 const source=shape.match(/<p:cNvPr\b[^>]*>/)?.[0];
 if(!source||attr(source,"id")!==target.shapeId)reject("office-chart-invalid-shape",target);
 return '<p:pic>'+
  '<p:nvPicPr><p:cNvPr id="'+xmlEsc(target.shapeId)+'" name="SMN chart '+xmlEsc(target.shapeId)+'"/>'+
  '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'+
  '<p:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'+mediaRid+'"/>'+
  '<a:stretch><a:fillRect/></a:stretch></p:blipFill>'+
  '<p:spPr>'+transform+'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'+
  '</p:pic>';
}
function nextRelation(map,slide,media,target){
 const name=slide.replace(/^(.*)\/([^/]+)$/,"$1/_rels/$2.rels");
 const previous=map.get(name);
 const xml=previous?.data.toString("utf8")??'<Relationships xmlns="'+RELS_NS+'"></Relationships>';
 if(!/<(?:\w+:)?Relationships\b/.test(xml))
  reject("office-chart-invalid-relationships",target);
 const used=new Set([...xml.matchAll(/<Relationship\b[^>]*\bId=["']([^"']+)["']/g)].map(m=>m[1]));
 let n=1;
 while(used.has("rId"+n))n++;
 const rid="rId"+n;
 const element='<Relationship Id="'+rid+'" Type="'+IMAGE_REL+'" Target="../media/'+media.split("/").at(-1)+'"/>';
 const revised=/<\/(?:\w+:)?Relationships>/.test(xml)?
  xml.replace(/<\/(?:\w+:)?Relationships>/,element+"const revised=xml.replace(/<\/(?:\w+:)?Relationships>/,element+"$&");"):
  xml.replace(/(<(?:\w+:)?Relationships\b[^>]*?)\s*\/>/,"$1>"+element+"</Relationships>");
 if(revised===xml)reject("office-chart-invalid-relationships",target);
 map.set(name,{name,method:previous?.method??8,data:Buffer.from(revised)});
 return rid;
}
function ensureContentType(map){
 const name="[Content_Types].xml",part=map.get(name);
 if(!part)throw new OfficePowerPointInsertionError("office-chart-missing-content-types");
 const xml=part.data.toString("utf8");
 if(/<Default\b[^>]*Extension=["']png["']/i.test(xml))return;
 if(!/<\/(?:\w+:)?Types>/.test(xml))
  throw new OfficePowerPointInsertionError("office-chart-invalid-content-types");
 const value=xml.replace(/<\/(?:\w+:)?Types>/,
  '<Default Extension="png" ContentType="image/png"/>$&');
 map.set(name,{...part,data:Buffer.from(value)});
}
function replaceTagWithNA(shape){
 const tokens=[...shape.matchAll(/<a:t(\s[^>]*)?>([\s\S]*?)<\/a:t>/g)];
 if(!tokens.length)throw new OfficePowerPointInsertionError("office-chart-invalid-tag");
 let index=0;
 return shape.replace(/<a:t(\s[^>]*)?>([\s\S]*?)<\/a:t>/g,(_,attrs="")=>
  '<a:t'+attrs+'>'+(index++===0?"N/D":"")+'</a:t>');
}
/**
 * Consume the read-only ChartTargets from SMN-411, render once per target, and
 * mutate only its own shape + necessary OPC relationship/media parts.
 * A throwing callback aborts without yielding any partial output.
 */
export function insertAdaptivePowerPointCharts(pkg,render){
 if(typeof render!=="function")throw new TypeError("renderer-required");
 let targets;
 try{targets=discoverPowerPointChartTargets(pkg);}
 catch(e){if(e instanceof OfficeChartTargetError)throw e;throw e;}
 if(!targets.length)return {bytes:pkg,changes:[]};
 const parts=readZip(pkg),map=new Map(parts.map(part=>[part.name,{...part}]));
 const bySlide=new Map();
 for(const t of targets){
  const list=bySlide.get(t.partName)??[];
  if(list.some(x=>x.shapeId===t.shapeId))reject("office-chart-duplicate-shape-id",t);
  list.push(t);bySlide.set(t.partName,list);
 }
 const changes=[];
 let serial=0;
 for(const [slide,items] of bySlide){
  const original=map.get(slide),seen=new Set();
  if(!original)throw new OfficePowerPointInsertionError("office-chart-slide-missing");
  const xml=original.data.toString("utf8");
  const updated=xml.replace(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g,shape=>{
   const id=attr(shape.match(/<p:cNvPr\b[^>]*>/)?.[0]??"","id");
   const target=items.find(t=>t.shapeId===id);
   if(!target)return shape;
   if(seen.has(target.shapeId))reject("office-chart-duplicate-shape-id",target);
   seen.add(target.shapeId);
   const png=render(target);
   if(png===null){
    changes.push({part:slide,shapeId:target.shapeId,empty:true});
    return replaceTagWithNA(shape);
   }
   verifyPng(png,target);
   const media="ppt/media/smn413-chart-"+(++serial)+".png";
   let filename=media,i=1;
   while(map.has(filename))filename=media.replace(/\.png$/,"-"+(++i)+".png");
   const rid=nextRelation(map,slide,filename,target);
   map.set(filename,{name:filename,method:8,data:png});
   changes.push({part:slide,shapeId:target.shapeId,media:filename,relationship:rid,empty:false});
   return replaceShape(shape,rid,target);
  });
  if(seen.size!==items.length)reject("office-chart-incomplete-slide",items[0]);
  if(updated!==xml)map.set(slide,{...original,data:Buffer.from(updated)});
 }
 if(changes.some(change=>!change.empty))ensureContentType(map);
 return {bytes:writeZip([...map.values()]),changes};
}
