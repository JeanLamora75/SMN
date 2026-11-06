import {readZip,writeZip} from "./smn-397-office-poc.mjs";
import {replaceScalarXml} from "./smn-399-office-scalars.mjs";

const SOURCES=new Set(["MEMBERS","INDICATORS"]);
const textRegex=/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g;
const tokenRegex=/\{\{ROW:([A-Z][A-Z0-9_]*)\}\}/g;

function escapeXml(value){
 return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function decodeXml(value){
 return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,entity=>{
  const known={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'"};
  if(Object.hasOwn(known,entity))return known[entity];
  const hex=entity.startsWith("&#x");
  const n=Number.parseInt(entity.slice(hex?3:2,-1),hex?16:10);
  if(!Number.isInteger(n)||n<=0||n>0x10ffff||(n>=0xd800&&n<=0xdfff))
   throw Error("office-table-invalid-entity");
  return String.fromCodePoint(n);
 });
}
function rowNodes(row){
 return [...row.matchAll(textRegex)].map(match=>{
  const raw=match[0],opening=raw.slice(0,raw.indexOf(">")+1);
  return {start:match.index,end:match.index+raw.length,opening,
   text:decodeXml(raw.slice(opening.length,-6))};
 });
}
function editNodes(row,nodes,edits){
 let xml=row;
 for(let i=nodes.length-1;i>=0;i--){
  if(edits[i]===nodes[i].text)continue;
  xml=xml.slice(0,nodes[i].start)+nodes[i].opening+escapeXml(edits[i])+
   "</w:t>"+xml.slice(nodes[i].end);
 }
 return xml;
}
function removeRowMarker(row,source){
 const nodes=rowNodes(row),text=nodes.map(node=>node.text).join("");
 const matches=[...text.matchAll(tokenRegex)];
 if(matches.length!==1||matches[0][1]!==source)
  throw Error("office-table-ambiguous-marker");
 const start=matches[0].index,end=start+matches[0][0].length;
 const edits=nodes.map(node=>node.text);
 let position=0,inserted=false;
 for(let i=0;i<nodes.length;i++){
  const left=position,right=position+nodes[i].text.length;
  position=right;
  if(right<=start||left>=end)continue;
  const from=Math.max(0,start-left),to=Math.min(nodes[i].text.length,end-left);
  edits[i]=nodes[i].text.slice(0,from)+nodes[i].text.slice(to);
  inserted=true;
 }
 if(!inserted)throw Error("office-table-missing-marker");
 return editNodes(row,nodes,edits);
}
function markerInRow(row){
 const found=[...rowNodes(row).map(node=>node.text).join("").matchAll(tokenRegex)];
 if(found.length===0)return null;
 if(found.length!==1||!SOURCES.has(found[0][1]))
  throw Error("office-table-invalid-source");
 return found[0][1];
}
function ensureSupportedRow(row){
 if(/<w:vMerge\b|<w:tbl\b|<w:tblHeader\b/.test(row))
  throw Error("office-table-unsupported-structure");
 // Horizontal grid spans are preserved. Vertical merges and nested tables require a dedicated layout engine.
 if(/<w:trPr\b[^>]*\b(?:rowSpan|vMerge)\b/i.test(row))
  throw Error("office-table-unsupported-structure");
 if(/<!DOCTYPE|<!ENTITY/i.test(row))
  throw Error("office-table-invalid-xml");
}
function tableSegments(xml){
 // This deliberately rejects nested tables; a broad regex cannot safely reproduce their hierarchy.
 const re=/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g;
 return [...xml.matchAll(re)].map(x=>({index:x.index,text:x[0]}));
}
export function expandWordTablesXml(xml,datasets){
 if(typeof xml!=="string"||/<!DOCTYPE|<!ENTITY/i.test(xml))
  throw Error("office-table-invalid-xml");
 if(!datasets||typeof datasets!=="object")throw Error("office-table-invalid-data");
 const segments=tableSegments(xml),changes=[];
 let result=xml;
 for(const part of segments.reverse()){
  if(/<w:tbl(?:\s[^>]*)?>/.test(part.text.slice(part.text.indexOf(">")+1)))
   throw Error("office-table-nested-not-supported");
  const rowPattern=/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g;
  let count=0;
  const converted=part.text.replace(rowPattern,row=>{
   const source=markerInRow(row);
   if(!source)return row;
   ensureSupportedRow(row);
   const records=datasets[source];
   if(!Array.isArray(records))throw Error("office-table-source-unavailable");
   // Resource guard, not a business row limit: reject explicitly, never truncate.
   if(records.length>10000)throw Error("office-table-resource-limit");
   count++;
   const clean=removeRowMarker(row,source);
   const render=(record)=>replaceScalarXml(clean,record).xml;
   if(!records.length){
    const fieldTags=[...rowNodes(clean).map(x=>x.text).join("").matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)]
     .map(x=>x[1]);
    return render(Object.fromEntries(fieldTags.map(key=>[key,"N/D"])));
   }
   return records.map(record=>render(record)).join("");
  });
  if(count>0){
   changes.push({sourceCount:count});
   result=result.slice(0,part.index)+converted+result.slice(part.index+part.text.length);
  }
 }
 return {xml:result,tableRows:changes.reduce((sum,item)=>sum+item.sourceCount,0)};
}

export function generateWordTables(source,datasets){
 const parts=readZip(source),changes=[];
 if(!parts.some(part=>part.name==="word/document.xml"))
  throw Error("office-table-document-missing");
 const modified=parts.map(part=>{
  if(!/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name))return part;
  const result=expandWordTablesXml(part.data.toString("utf8"),datasets);
  if(result.tableRows===0)return part;
  changes.push({part:part.name,count:result.tableRows});
  return {...part,data:Buffer.from(result.xml,"utf8")};
 });
 return {bytes:writeZip(modified),changes};
}
