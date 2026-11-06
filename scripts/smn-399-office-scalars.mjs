import {readZip,writeZip} from "./smn-397-office-poc.mjs";

const TOKEN=/\{\{([A-Z][A-Z0-9_]*)([^{}]*)\}\}/g;
const XML_ENTITY=/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g;
const VALID_NAME=/^[A-Z][A-Z0-9_]*$/;
const esc=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");

function decode(value){
 return value.replace(XML_ENTITY,(_all,entity)=>{
  if(entity==="amp")return "&";
  if(entity==="lt")return "<";
  if(entity==="gt")return ">";
  if(entity==="quot")return '"';
  if(entity==="apos")return "'";
  const code=entity[1]?.toLowerCase()==="x"?parseInt(entity.slice(2),16):Number(entity.slice(1));
  if(!Number.isInteger(code)||code<=0||code>0x10ffff||(code>=0xd800&&code<=0xdfff))throw Error("Entité XML invalide");
  return String.fromCodePoint(code);
 });
}
export const SCALAR_NAMES=Object.freeze(["TEAM_NAME","SPRINT_NAME","SPRINT_START","SPRINT_END","SPRINT_STATUS"]);

export function buildScalarValues(input){
 const values=Object.create(null);
 for(const key of SCALAR_NAMES)values[key]=input[key]??null;
 for(const indicator of input.indicators??[]){
  if(typeof indicator.tag!=="string")continue;
  const tag=indicator.tag.toUpperCase().replace(/[^A-Z0-9_]/g,"_");
  if(!VALID_NAME.test(tag))continue;
  const name="INDICATOR_"+tag;
  if(Object.hasOwn(values,name))throw Error("Collision de tag");
  values[name]=indicator.available?indicator.value??null:null;
 }
 return values;
}

export function replaceScalarXml(xml,values){
 if(typeof xml!=="string")throw Error("Contenu XML invalide");
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error("Déclaration XML non prise en charge");
 const paragraphs=/<(?:w:p|a:p)(?:\s[^>]*)?>[\s\S]*?<\/(?:w:p|a:p)>/g;
 let replacements=0;
 const output=xml.replace(paragraphs,block=>{
  const nodes=[];
  const nodePattern=/<(w:t|a:t)(\s[^>]*)?>([^<]*)<\/\1>/g;
  let match;
  while((match=nodePattern.exec(block)))nodes.push({
   start:match.index,end:nodePattern.lastIndex,element:match[1],attrs:match[2]??"",text:decode(match[3])
  });
  if(!nodes.length)return block;
  const combined=nodes.map(node=>node.text).join("");
  const operations=[];
  TOKEN.lastIndex=0;
  while((match=TOKEN.exec(combined))){
   const name=match[1];
   if(!Object.hasOwn(values,name))continue;
   if(match[2])throw Error("Paramètres de tag non pris en charge : "+name);
   operations.push({start:match.index,end:match.index+match[0].length,value:String(values[name]??"N/D")});
  }
  if(!operations.length)return block;
  const bounds=[];
  let cursor=0;
  for(const node of nodes){bounds.push({from:cursor,to:cursor+node.text.length});cursor+=node.text.length;}
  const edited=nodes.map(node=>node.text);
  for(const operation of operations.reverse()){
   let first=-1;
   for(let i=0;i<nodes.length;i++){
    if(bounds[i].to<=operation.start||bounds[i].from>=operation.end)continue;
    const a=Math.max(0,operation.start-bounds[i].from);
    const b=Math.min(nodes[i].text.length,operation.end-bounds[i].from);
    if(first<0)first=i;
    edited[i]=edited[i].slice(0,a)+(i===first?operation.value:"")+edited[i].slice(b);
   }
   if(first>=0)replacements++;
  }
  let transformed=block;
  for(let i=nodes.length-1;i>=0;i--){
   const node=nodes[i];if(node.text===edited[i])continue;
   transformed=transformed.slice(0,node.start)+"<"+node.element+node.attrs+">"+esc(edited[i])+"</"+node.element+">"+transformed.slice(node.end);
  }
  return transformed;
 });
 return {xml:output,replacements};
}
export function generateScalarOffice(template,format,values){
 if(format!=="docx"&&format!=="pptx")throw Error("Format non pris en charge");
 const parts=readZip(template),main=format==="docx"?"word/document.xml":"ppt/presentation.xml";
 if(!parts.some(part=>part.name===main))throw Error("Modèle Office incomplet");
 const changes=[];
 const output=parts.map(part=>{
  const isTarget=format==="docx"
   ? /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(part.name)
   : /^ppt\/(?:slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(part.name);
  if(!isTarget)return part;
  const modified=replaceScalarXml(part.data.toString("utf8"),values);
  if(!modified.replacements)return part;
  changes.push({part:part.name,replacements:modified.replacements});
  return {...part,data:Buffer.from(modified.xml,"utf8")};
 });
 return {bytes:writeZip(output),changes};
}
