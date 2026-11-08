import {readZip,writeZip} from "./smn-397-office-poc.mjs";

const NS="http://schemas.openxmlformats.org/package/2006/relationships";
const HYPER="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
 .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function safeUrl(value){
 if(typeof value!=="string"||value.length>2048||/[\s\u0000-\u001f\u007f\\]/u.test(value))throw Error("office-link-invalid-url");
 let url;
 try{url=new URL(value)}catch{throw Error("office-link-invalid-url")}
 if(!["http:","https:"].includes(url.protocol)||!url.hostname||url.username||url.password)
  throw Error("office-link-invalid-url");
 return value;
}
function relPath(part){
 const i=part.lastIndexOf("/");
 return part.slice(0,i+1)+"_rels/"+part.slice(i+1)+".rels";
}
function addRelation(xml,id,url){
 const item='<Relationship Id="'+id+'" Type="'+HYPER+'" Target="'+esc(url)+'" TargetMode="External"/>';
 if(!xml)return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+NS+'">'+item+'</Relationships>';
 if(/<Relationships\b[^>]*\/>/.test(xml))return xml.replace(/<Relationships\b([^>]*)\/>/,
  '<Relationships$1>'+item+'</Relationships>');
 if(!/<\/Relationships>/.test(xml))throw Error("office-link-invalid-relationships");
 return xml.replace("</Relationships>",item+"</Relationships>");
}
function nextId(xml,used){
 let n=1;
 while(used.has("rId"+n)||xml.includes('Id="rId'+n+'"'))n++;
 const id="rId"+n;used.add(id);return id;
}
function replaceWord(xml,token,label,id){
 const pattern=/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
 let count=0;
 const updated=xml.replace(pattern,run=>{
  if(!run.includes(token))return run;
  if(!/<w:t(?:\s[^>]*)?>[^<]*SMN_LINK_\d{6}_LABEL[^<]*<\/w:t>/.test(run))
   throw Error("office-link-unsupported-run");
  if(run.split(token).length!==2)throw Error("office-link-ambiguous-label");
  if(/<w:hyperlink\b/.test(run))throw Error("office-link-nested-hyperlink");
  count++;
  return '<w:hyperlink r:id="'+id+'" w:history="1">'+run.replace(token,esc(label))+'</w:hyperlink>';
 });
 return {xml:updated,count};
}
function replacePpt(xml,token,label,id){
 const pattern=/<a:r(?:\s[^>]*)?>[\s\S]*?<\/a:r>/g;
 let count=0;
 const updated=xml.replace(pattern,run=>{
  if(!run.includes(token))return run;
  if(!/<a:t(?:\s[^>]*)?>[^<]*SMN_LINK_\d{6}_LABEL[^<]*<\/a:t>/.test(run))
   throw Error("office-link-unsupported-run");
  if(run.split(token).length!==2)throw Error("office-link-ambiguous-label");
  if(/<a:hlinkClick\b/.test(run))throw Error("office-link-existing-hyperlink");
  count++;
  let updatedRun=run.replace(token,esc(label));
  const click='<a:hlinkClick r:id="'+id+'"/>';
  if(/<a:rPr\b[^>]*\/>/.test(updatedRun))
   updatedRun=updatedRun.replace(/<a:rPr\b([^>]*)\/>/,'<a:rPr$1>'+click+'</a:rPr>');
  else if(/<a:rPr\b[^>]*>/.test(updatedRun))
   updatedRun=updatedRun.replace(/<\/a:rPr>/,click+"</a:rPr>");
  else updatedRun=updatedRun.replace(/<a:r(?:\s[^>]*)?>/,match=>match+"<a:rPr>"+click+"</a:rPr>");
  return updatedRun;
 });
 return {xml:updated,count};
}
/**
 * Converts synthetic LINK_LABEL placeholders to real external relationships.
 * Adds only required .rels parts; preserves all other zipped Office parts.
 * Called after expanding ROW tables and before scalar/flag/chart processing.
 */
export function activateOfficeLinkLabels(bytes,format,labels){
 if(!["docx","pptx"].includes(format)||!Array.isArray(labels))
  throw Error("office-link-invalid-input");
 const lookup=new Map();
 for(const entry of labels){
  if(!/^SMN_LINK_\d{6}_LABEL$/.test(entry.token)||lookup.has(entry.token)||
   typeof entry.label!=="string"||!entry.label.trim())throw Error("office-link-invalid-label");
  lookup.set(entry.token,{url:safeUrl(entry.url),label:entry.label});
 }
 const parts=readZip(bytes),byName=new Map(parts.map(part=>[part.name,part]));
 const modified=new Map(),usedCount=new Map([...lookup.keys()].map(token=>[token,0]));
 for(const part of parts){
  const isTarget=format==="docx"?
   /^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name):
   /^ppt\/slides\/slide\d+\.xml$/.test(part.name);
  if(!isTarget)continue;
  let xml=part.data.toString("utf8");
  const tokens=[...xml.matchAll(/SMN_LINK_\d{6}_LABEL/g)].map(m=>m[0]);
  if(!tokens.length)continue;
  const path=relPath(part.name);
  let rels=modified.get(path)??byName.get(path)?.data.toString("utf8")??"";
  const ids=new Set([...rels.matchAll(/\bId="([^"]+)"/g)].map(match=>match[1]));
  for(const token of [...new Set(tokens)]){
   const item=lookup.get(token);
   if(!item)throw Error("office-link-unresolved-label");
   const id=nextId(rels,ids);
   const result=format==="docx"?
    replaceWord(xml,token,item.label,id):replacePpt(xml,token,item.label,id);
   if(!result.count)throw Error("office-link-unresolved-label");
   xml=result.xml;rels=addRelation(rels,id,item.url);
   usedCount.set(token,usedCount.get(token)+result.count);
  }
  modified.set(part.name,xml);
  modified.set(path,rels);
 }
 // A selected link may be unused when no matching collection is present; this is fine.
 // No placeholder is allowed to survive in any expanded supported text part.
 for(const [name,xml] of modified)if(/\.xml$/.test(name)&&/SMN_LINK_\d{6}_LABEL/.test(xml))
  throw Error("office-link-unresolved-label");
 const output=parts.map(part=>modified.has(part.name)?
  {...part,data:Buffer.from(modified.get(part.name),"utf8")}:part);
 for(const [name,xml] of modified)if(!byName.has(name))output.push({name,data:Buffer.from(xml,"utf8")});
 return {bytes:writeZip(output),hyperlinks:[...usedCount.values()].reduce((a,b)=>a+b,0)};
}
