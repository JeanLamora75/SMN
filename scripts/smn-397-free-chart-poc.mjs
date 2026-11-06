// Isolated feasibility proof for chart images from free {{CHART:NAME}} text tags.
// Not a production Open XML engine: complex layouts require an XML-aware parser.
import {readZip,writeZip} from "./smn-397-office-poc.mjs";

const URI="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const esc=v=>String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const textNodes=(block,type)=>[...block.matchAll(new RegExp("<"+type+"(?:\\s[^>]*)?>([^<]*)</"+type+">","g"))].map(m=>m[1]).join("");
const relationshipPath=name=>name.replace(/^(.*)\/([^/]+)$/,"$1/_rels/$2.rels");

function addRelation(map,path,media){
  const relPath=relationshipPath(path);
  const existing=map.get(relPath)?.data.toString()||'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  if(!existing.includes("</Relationships>"))throw Error("Relations invalides");
  const ids=[...existing.matchAll(/\bId="rId(\d+)"/g)].map(m=>+m[1]);
  const id="rId"+(Math.max(0,...ids)+1);
  const target=path.startsWith("word/")?"media/"+media.split("/").at(-1):"../media/"+media.split("/").at(-1);
  const extra='<Relationship Id="'+id+'" Type="'+URI+'/image" Target="'+target+'"/>';
  map.set(relPath,{name:relPath,method:8,data:Buffer.from(existing.replace("</Relationships>",extra+"</Relationships>"))});
  return id;
}
function contentType(map){
  const item=map.get("[Content_Types].xml");
  if(!item)throw Error("Content types absents");
  let xml=item.data.toString();
  if(!/\bExtension="png"/i.test(xml)){
    if(!xml.includes("</Types>"))throw Error("Content types invalides");
    xml=xml.replace("</Types>",'<Default Extension="png" ContentType="image/png"/></Types>');
    map.set(item.name,{...item,data:Buffer.from(xml)});
  }
}
function wordDrawing(id,rel,docId){
  const cx=3200400,cy=1828800;
  return '<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+docId+'" name="'+esc(id)+'"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="'+esc(id)+'"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="'+URI+'" r:embed="'+rel+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}
function pptDrawing(id,rel,shape){
  const xfrm=shape.match(/<a:xfrm(?:\s[^>]*)?>[\s\S]*?<\/a:xfrm>/)?.[0]||'<a:xfrm><a:off x="457200" y="457200"/><a:ext cx="3200400" cy="1828800"/></a:xfrm>';
  const idNum=shape.match(/<p:cNvPr\b[^>]*\bid="(\d+)"/)?.[1]||"77";
  return '<p:pic><p:nvPicPr><p:cNvPr id="'+idNum+'" name="Graphique '+esc(id)+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip xmlns:r="'+URI+'" r:embed="'+rel+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>'+xfrm+'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
}

// The entire text of a single paragraph/textbox must be the marker.
// A plain text object is NOT a preconfigured graphic/image placeholder.
export function embedFreeChartTags(source,format,images){
  if(!["docx","pptx"].includes(format))throw Error("Format Office inconnu");
  for(const bytes of Object.values(images))
    if(!Buffer.isBuffer(bytes)||bytes.length<45||bytes.length>8*1024*1024||!bytes.subarray(0,8).equals(signature))throw Error("PNG invalide");
  const parts=readZip(source),map=new Map(parts.map(p=>[p.name,{...p}]));
  const changed=[];
  for(const part of parts){
    const docx=format==="docx"&&/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name);
    const pptx=format==="pptx"&&/^ppt\/slides\/slide\d+\.xml$/.test(part.name);
    if(!docx&&!pptx)continue;
    const pattern=docx?/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g:/<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g;
    const original=part.data.toString();
    let docId=Math.max(0,...[...original.matchAll(/<wp:docPr\b[^>]*\bid="(\d+)"/g)].map(m=>Number(m[1])))+1;
    const xml=original.replace(pattern,block=>{
      const marker=textNodes(block,docx?"w:t":"a:t").match(/^\{\{CHART:([A-Z][A-Z0-9_]*)\}\}$/);
      if(!marker||!Object.hasOwn(images,marker[1]))return block;
      const id=marker[1],dir=docx?"word/media":"ppt/media";
      let index=1,media=dir+"/smn397-"+id.toLowerCase()+"-"+index+".png";
      while(map.has(media)){index++;media=dir+"/smn397-"+id.toLowerCase()+"-"+index+".png";}
      const rel=addRelation(map,part.name,media);
      map.set(media,{name:media,data:images[id],method:8});
      changed.push({part:part.name,media,tag:id,relationship:rel});
      if(docx){
        const pPr=block.match(/<w:pPr(?:\s[^>]*)?>[\s\S]*?<\/w:pPr>/)?.[0]||"";
        return "<w:p>"+pPr+wordDrawing(id,rel,docId++)+"</w:p>";
      }
      return pptDrawing(id,rel,block);
    });
    if(xml!==original)map.set(part.name,{...part,data:Buffer.from(xml)});
  }
  if(changed.length)contentType(map);
  return {output:writeZip([...map.values()]),changed};
}
