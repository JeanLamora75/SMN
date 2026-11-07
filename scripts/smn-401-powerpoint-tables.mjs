import {readZip,writeZip} from "./smn-397-office-poc.mjs";
import {replaceScalarXml} from "./smn-399-office-scalars.mjs";

const SOURCES=new Set(["MEMBERS","INDICATORS","RISKS","OBSTACLES","DEPENDENCIES","NOTES","CEREMONIES","GOALS","ACTIONS","DECISIONS"]);
const TEXT=/<a:t(?:\s[^>]*)?>[^<]*<\/a:t>/g;
const MARKER=/\{\{ROW:([A-Z][A-Z0-9_]*)\}\}/g;

function decodeXml(text) {
 return text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,entity=>{
  const known={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'"};
  if(Object.hasOwn(known,entity))return known[entity];
  const hex=entity.startsWith("&#x"),code=parseInt(entity.slice(hex?3:2,-1),hex?16:10);
  if(!Number.isInteger(code)||code<=0||code>0x10ffff||(code>=0xd800&&code<=0xdfff))
   throw Error("office-pptx-invalid-entity");
  return String.fromCodePoint(code);
 });
}
function escapeXml(text) {
 return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function nodesOf(row) {
 return [...row.matchAll(TEXT)].map(match=>{
  const raw=match[0],open=raw.slice(0,raw.indexOf(">")+1);
  return {start:match.index,end:match.index+raw.length,open,text:decodeXml(raw.slice(open.length,-6))};
 });
}
function editRow(row,nodes,edits) {
 let xml=row;
 for(let i=nodes.length-1;i>=0;i--){
  if(edits[i]===nodes[i].text)continue;
  xml=xml.slice(0,nodes[i].start)+nodes[i].open+escapeXml(edits[i])+"</a:t>"+xml.slice(nodes[i].end);
 }
 return xml;
}
function readMarker(row){
 const combined=nodesOf(row).map(n=>n.text).join("");
 const all=[...combined.matchAll(MARKER)];
 if(!all.length)return null;
 if(all.length!==1||!SOURCES.has(all[0][1]))throw Error("office-pptx-invalid-row-marker");
 return {source:all[0][1],start:all[0].index,end:all[0].index+all[0][0].length};
}
function removeMarker(row,marker){
 const nodes=nodesOf(row),edits=nodes.map(n=>n.text);
 let cursor=0,found=false;
 for(let i=0;i<nodes.length;i++){
  const left=cursor,right=left+nodes[i].text.length;cursor=right;
  if(right<=marker.start||left>=marker.end)continue;
  const a=Math.max(0,marker.start-left),b=Math.min(nodes[i].text.length,marker.end-left);
  edits[i]=nodes[i].text.slice(0,a)+nodes[i].text.slice(b);
  found=true;
 }
 if(!found)throw Error("office-pptx-invalid-row-marker");
 return editRow(row,nodes,edits);
}
function ensureSupported(row){
 // Horizontal merges (gridSpan/hMerge) are copied verbatim, but vertical merges
 // cannot safely be cloned without a full table layout engine.
 if(/\browSpan\s*=\s*["'](?:[2-9]|\d{2,})["']|<a:tc\b[^>]*\bvMerge\s*=\s*["']1["']/.test(row))
  throw Error("office-pptx-vertical-merge-unsupported");
 if(/<a:tbl(?:\s|>|\/)/.test(row))
  throw Error("office-pptx-nested-table-unsupported");
 if(/<!DOCTYPE|<!ENTITY/i.test(row))
  throw Error("office-pptx-invalid-xml");
}
export function expandPowerPointTablesXml(xml,datasets){
 if(typeof xml!=="string"||/<!DOCTYPE|<!ENTITY/i.test(xml))
  throw Error("office-pptx-invalid-xml");
 if(!datasets||typeof datasets!=="object"||Array.isArray(datasets))
  throw Error("office-pptx-invalid-data");
 const tableRegex=/<a:tbl(?:\s[^>]*)?>[\s\S]*?<\/a:tbl>/g;
 const tables=[...xml.matchAll(tableRegex)];
 let result=xml,expanded=0;
 for(const match of tables.reverse()){
  const body=match[0];
  if(/<a:tbl(?:\s[^>]*)?>/.test(body.slice(body.indexOf(">")+1)))
   throw Error("office-pptx-nested-table-unsupported");
  const rowRegex=/<a:tr(?:\s[^>]*)?>[\s\S]*?<\/a:tr>/g;
  let count=0;
  const replaced=body.replace(rowRegex,row=>{
   const marker=readMarker(row);
   if(!marker)return row;
   ensureSupported(row);
   const records=datasets[marker.source];
   if(!Array.isArray(records))throw Error("office-pptx-source-unavailable");
   // Technical safeguard, not a business cap. Never silently truncate.
   if(records.length>10000)throw Error("office-pptx-resource-limit");
   count++;
   const clean=removeMarker(row,marker);
   const render=record=>replaceScalarXml(clean,record).xml;
   if(records.length===0){
    const fields=[...nodesOf(clean).map(n=>n.text).join("").matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)]
     .map(m=>m[1]);
    return render(Object.fromEntries(fields.map(key=>[key,"N/D"])));
   }
   return records.map(render).join("");
  });
  if(count){
   expanded+=count;
   result=result.slice(0,match.index)+replaced+result.slice(match.index+body.length);
  }
 }
 return {xml:result,tableRows:expanded};
}
const EMPTY_TEXT={
 fr:{RISKS:"Aucun risque identifié",OBSTACLES:"Aucun obstacle identifié",DEPENDENCIES:"Aucune dépendance identifiée"},
 en:{RISKS:"No risks identified",OBSTACLES:"No obstacles identified",DEPENDENCIES:"No dependencies identified"}
};
const PARAGRAPH=/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g;
const SHAPE=/<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g;

/** Repeat paragraphs only inside text shapes; all surrounding PowerPoint geometry remains untouched. */
export function expandPowerPointTextBoxesXml(xml,datasets,language="fr"){
 if(typeof xml!=="string"||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error("office-pptx-invalid-xml");
 if(!["fr","en"].includes(language))throw Error("office-pptx-invalid-language");
 if(!datasets||typeof datasets!=="object"||Array.isArray(datasets))throw Error("office-pptx-invalid-data");
 let expanded=0;
 const output=xml.replace(SHAPE,shape=>{
  const bodyPattern=/<p:txBody(?:\s[^>]*)?>[\s\S]*?<\/p:txBody>/g;
  return shape.replace(bodyPattern,body=>{
   const converted=body.replace(PARAGRAPH,paragraph=>{
    const marker=readMarker(paragraph);
    if(!marker)return paragraph;
    const records=datasets[marker.source];
    if(!Array.isArray(records))throw Error("office-pptx-source-unavailable");
    if(records.length>10000)throw Error("office-pptx-resource-limit");
    expanded++;
    const clean=removeMarker(paragraph,marker);
    if(!records.length){
     const message=EMPTY_TEXT[language][marker.source]??"N/D";
     const nodes=nodesOf(clean);
     if(!nodes.length)throw Error("office-pptx-empty-text-shape");
     // Keep the paragraph properties and first run style, but remove placeholders,
     // separators and stale example text when there are no business records.
     return editRow(clean,nodes,nodes.map((_node,index)=>index===0?message:""));
    }
    return records.map(record=>replaceScalarXml(clean,record).xml).join("");
   });
   // A marker split across paragraphs or placed outside supported runs must not be ignored.
   if(nodesOf(converted).map(n=>n.text).join("").includes("{{ROW:"))
    throw Error("office-pptx-unsupported-text-marker");
   return converted;
  });
 });
 return {xml:output,textRows:expanded};
}

export function generatePowerPointTables(packageBytes,datasets,language="fr"){
 const parts=readZip(packageBytes),changes=[];
 if(!parts.some(part=>part.name==="ppt/presentation.xml"))
  throw Error("office-pptx-presentation-missing");
 const updated=parts.map(part=>{
  if(!/^ppt\/slides\/slide\d+\.xml$/.test(part.name))return part;
  const result=expandPowerPointTablesXml(part.data.toString("utf8"),datasets);
  const text=expandPowerPointTextBoxesXml(result.xml,datasets,language);
  if(!result.tableRows&&!text.textRows)return part;
  changes.push({part:part.name,count:result.tableRows+text.textRows});
  return {...part,data:Buffer.from(text.xml,"utf8")};
 });
 return {bytes:writeZip(updated),changes};
}
