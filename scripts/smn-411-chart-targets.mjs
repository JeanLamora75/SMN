// Read-only geometry discovery for chart placeholders in Office PowerPoint packages.
// Production insertion and rasterization remain owned by later stories.
import {readZip} from "./smn-397-office-poc.mjs";
import {parseOfficeChartTag} from "./smn-402-office-chart-tags.mjs";

export const EMU_PER_INCH=914400;
const SLIDE=/^ppt\/slides\/slide([1-9]\d*)\.xml$/;
const TOKEN=/<\/?(?:p:sp|p:grpSp)\b[^>]*>/g;
const TEXT=/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;
const CHART=/\{\{CHART:/;
const FULL_TAG=/^\{\{CHART:TREND(?:\|[^{}]*)?\}\}$/;

export class OfficeChartTargetError extends Error{
 constructor(code,part,shapeId=null){
  super(code);this.name="OfficeChartTargetError";
  this.code=code;this.part=part;this.shapeId=shapeId;
 }
}
const decodeXml=value=>value.replace(/&(?:amp|lt|gt|quot|apos|#x[0-9a-fA-F]+|#\d+);/g,entity=>{
 const k=entity.slice(1,-1);
 const named={amp:"&",lt:"<",gt:">",quot:'"',apos:"'"};
 if(Object.hasOwn(named,k))return named[k];
 const n=k.startsWith("#x")?parseInt(k.slice(2),16):parseInt(k.slice(1),10);
 if(!Number.isInteger(n)||n<0||n>0x10ffff||(n>=0xd800&&n<=0xdfff))
  throw Error("office-chart-invalid-xml-entity");
 return String.fromCodePoint(n);
});
const attribute=(tag,name)=>{
 const matched=new RegExp("(?:\\s)"+name+"\\s*=\\s*([\"'])(.*?)\\1").exec(tag);
 return matched?decodeXml(matched[2]):null;
};
const number=(s,part,id)=>{
 if(s===null||!/^-?\d+$/.test(s))throw new OfficeChartTargetError("office-chart-invalid-geometry",part,id);
 const value=Number(s);
 if(!Number.isSafeInteger(value))throw new OfficeChartTargetError("office-chart-invalid-geometry",part,id);
 return value;
};
const exactlyOne=(parent,re,part,id)=>{
 const matches=[...parent.matchAll(re)];
 if(matches.length!==1)throw new OfficeChartTargetError("office-chart-invalid-geometry",part,id);
 return matches[0][0];
};
function readShape(block,part,grouped){
 const content=[...block.matchAll(TEXT)].map(m=>decodeXml(m[1])).join("");
 if(!CHART.test(content))return null;
 const idTag=block.match(/<p:cNvPr\b[^>]*\/?>/)?.[0];
 const shapeId=idTag?attribute(idTag,"id"):null;
 if(!FULL_TAG.test(content))
  throw new OfficeChartTargetError("office-chart-ambiguous-tag",part,shapeId);
 let options;
 try{options=parseOfficeChartTag(content);}
 catch(e){throw new OfficeChartTargetError(e.message||"office-chart-invalid-tag",part,shapeId);}
 if(grouped)throw new OfficeChartTargetError("office-chart-unsupported-group",part,shapeId);
 if(!shapeId||!/^\d+$/.test(shapeId))
  throw new OfficeChartTargetError("office-chart-invalid-shape",part,shapeId);
 const props=block.match(/<p:spPr(?:\s[^>]*)?>([\s\S]*?)<\/p:spPr>/)?.[1];
 if(!props)throw new OfficeChartTargetError("office-chart-invalid-geometry",part,shapeId);
 const transform=exactlyOne(props,/<a:xfrm\b[^>]*>[\s\S]*?<\/a:xfrm>/g,part,shapeId);
 const open=transform.match(/^<a:xfrm\b[^>]*>/)?.[0]??"";
 if(attribute(open,"rot")!==null||attribute(open,"flipH")!==null||attribute(open,"flipV")!==null)
  throw new OfficeChartTargetError("office-chart-unsupported-transform",part,shapeId);
 const offset=exactlyOne(transform,/<a:off\b[^>]*\/>/g,part,shapeId);
 const extent=exactlyOne(transform,/<a:ext\b[^>]*\/>/g,part,shapeId);
 const xEmu=number(attribute(offset,"x"),part,shapeId);
 const yEmu=number(attribute(offset,"y"),part,shapeId);
 const widthEmu=number(attribute(extent,"cx"),part,shapeId);
 const heightEmu=number(attribute(extent,"cy"),part,shapeId);
 if(widthEmu<=0||heightEmu<=0)
  throw new OfficeChartTargetError("office-chart-invalid-geometry",part,shapeId);
 const frozenOptions=Object.freeze({...options,tags:options.tags?Object.freeze([...options.tags]):null});
 return Object.freeze({
  partName:part,slide:Number(SLIDE.exec(part)[1]),shapeId,
  xEmu,yEmu,widthEmu,heightEmu,
  ratio:widthEmu/heightEmu,tag:content,options:frozenOptions
 });
}
export function emuToPixels(widthEmu,heightEmu,dpi=300){
 if(!Number.isSafeInteger(widthEmu)||!Number.isSafeInteger(heightEmu)||
    widthEmu<=0||heightEmu<=0||!Number.isFinite(dpi)||dpi<=0||dpi>600)
  throw Error("office-chart-invalid-geometry");
 const width=Math.max(1,Math.round(widthEmu/EMU_PER_INCH*dpi));
 const height=Math.max(1,Math.round(heightEmu/EMU_PER_INCH*dpi));
 if(width>4096||height>4096||width*height>16_000_000)
  throw Error("office-chart-target-over-budget");
 if(Math.abs(width/height/(widthEmu/heightEmu)-1)>0.01)
  throw Error("office-chart-ratio-precision");
 return Object.freeze({width,height,dpi});
}
export function discoverPowerPointChartTargets(pkg){
 const targets=[];
 for(const part of readZip(pkg)){
  if(!SLIDE.test(part.name))continue;
  const xml=part.data.toString("utf8"),stack=[];
  for(const m of xml.matchAll(TOKEN)){
   const token=m[0],closing=token.startsWith("</"),group=token.startsWith("<p:grpSp")||token.startsWith("</p:grpSp");
   if(!closing){
    stack.push({kind:group?"group":"shape",start:m.index,grouped:stack.some(s=>s.kind==="group")});
    continue;
   }
   const top=stack.pop();
   if(!top||top.kind!==(group?"group":"shape"))
    throw new OfficeChartTargetError("office-chart-invalid-xml",part.name);
   if(!group){
    const target=readShape(xml.slice(top.start,m.index+token.length),part.name,top.grouped);
    if(target)targets.push(target);
   }
  }
  if(stack.length)throw new OfficeChartTargetError("office-chart-invalid-xml",part.name);
 }
 return Object.freeze(targets);
}
