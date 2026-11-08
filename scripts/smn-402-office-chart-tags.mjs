import {readZip,writeZip} from "./smn-397-office-poc.mjs";
import {embedFreeChartTags} from "./smn-397-free-chart-poc.mjs";

const TEXT=/<(w:t|a:t)(\s[^>]*)?>([^<]*)<\/\1>/g;
const TAG=/^\{\{CHART:TREND(?:\|([^{}]*))?\}\}$/;
const CHART_START=/\{\{CHART:/;
function decode(text){return text.replace(/&(amp|lt|gt|quot|apos);/g,(_,x)=>({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"}[x]));}
function escape(text){return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
/**
 * @param {string} raw
 * @returns {{last:number,type:string,tags:string[]|null,style?:string}}
 */
export function parseOfficeChartTag(raw){
 const m=TAG.exec(raw);
 if(!m)throw Error("office-chart-invalid-tag");
 /** @type {{last:number,type:string,tags:string[]|null,style?:string}} */
 const params={last:6,type:"bar",tags:null};
 if(!m[1])return params;
 const used=new Set();
 for(const chunk of m[1].split("|")){
  const pair=/^([A-Z]+)=([A-Za-z0-9_,\-]+)$/.exec(chunk);
  if(!pair||used.has(pair[1]))throw Error("office-chart-invalid-parameter");
  used.add(pair[1]);
  if(pair[1]==="LAST"){
   if(!/^\d+$/.test(pair[2])||+pair[2]<1||+pair[2]>24)throw Error("office-chart-invalid-range");
   params.last=+pair[2];
  }else if(pair[1]==="TYPE"){
   if(!["bar","line","area","pie","donut","gauge"].includes(pair[2]))throw Error("office-chart-invalid-style");
   params.type=pair[2];
  }else if(pair[1]==="STYLE"){
   if(!/^[a-z][a-z0-9-]{2,63}$/.test(pair[2]))throw Error("office-chart-invalid-style-id");
   params.style=pair[2];
  }else if(pair[1]==="TAGS"){
   const tags=pair[2].split(",");
   if(tags.length<1||tags.length>6||new Set(tags).size!==tags.length||tags.some(s=>!/^[A-Za-z][A-Za-z0-9_]*$/.test(s)))
    throw Error("office-chart-invalid-series");
   params.tags=tags;
  }else throw Error("office-chart-invalid-parameter");
 }
 return params;
}
function chartBlocks(xml,format){
 const re=format==="docx"?/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g:/<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g;
 return [...xml.matchAll(re)].map(m=>({start:m.index,xml:m[0]}));
}
function textPieces(block){
 return [...block.matchAll(TEXT)].map(m=>({offset:m.index,body:m[0],open:"<"+m[1]+(m[2]??"")+">",tag:m[1],value:decode(m[3])}));
}
export function discoverOfficeChartTags(pkg,format){
 const requests=[];
 for(const part of readZip(pkg)){
  if(!(format==="docx"?/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name):
    /^ppt\/slides\/slide\d+\.xml$/.test(part.name)))continue;
  for(const block of chartBlocks(part.data.toString("utf8"),format)){
   const text=textPieces(block.xml).map(p=>p.value).join("");
   if(!CHART_START.test(text))continue;
   // Only a dedicated paragraph/shape is compatible. Otherwise explicitly fail.
   requests.push({part:part.name,text,params:parseOfficeChartTag(text)});
  }
 }
 return requests;
}
export function insertOfficeTrendImages(pkg,format,images){
 const parts=readZip(pkg),substitutions=[];
 let serial=0;
 const processed=parts.map(part=>{
  if(!(format==="docx"?/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name):
   /^ppt\/slides\/slide\d+\.xml$/.test(part.name)))return part;
  let xml=part.data.toString("utf8");
  for(const block of chartBlocks(xml,format).reverse()){
   const pieces=textPieces(block.xml),text=pieces.map(p=>p.value).join("");
   if(!CHART_START.test(text))continue;
   const params=parseOfficeChartTag(text);
   const png=images(serial,params);
   const tag=png?"SMN402_"+serial:"";
   let edited=block.xml;
   for(let i=pieces.length-1;i>=0;i--){
    const p=pieces[i],replacement=i===0?(png?"{{CHART:"+tag+"}}":"N/D"):"";
    edited=edited.slice(0,p.offset)+p.open+escape(replacement)+"</"+p.tag+">"+edited.slice(p.offset+p.body.length);
   }
   xml=xml.slice(0,block.start)+edited+xml.slice(block.start+block.xml.length);
   if(png)substitutions.push({tag,png});
   serial++;
  }
  return {...part,data:Buffer.from(xml)};
 });
 if(serial===0)return {bytes:pkg,changes:[]};
 const mapping=Object.fromEntries(substitutions.map(s=>[s.tag,s.png]));
 const result=embedFreeChartTags(writeZip(processed),format,mapping);
 if(result.changed.length!==substitutions.length)throw Error("office-chart-embed-incomplete");
 return {bytes:result.output,changes:result.changed};
}
