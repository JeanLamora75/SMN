import {readZip,writeZip} from "./smn-397-office-poc.mjs";

/**
 * PowerPoint cannot place a p:pic inside a DrawingML text run or table cell.
 * The DrawingML picture-bullet element a:buBlip renders an image at the start
 * of an a:p paragraph, preserving the row and all neighbouring shapes.
 *
 * MEMBER_FLAG is emitted as SMN_FLAG_XX only for PPTX and replaced here, after
 * repeating business rows and before chart insertion.
 */
const FLAG=/SMN_FLAG_([A-Z]{2})/g;
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const IMAGE_REL="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const REL_NS="http://schemas.openxmlformats.org/package/2006/relationships";
const validImage=buf=>Buffer.isBuffer(buf)&&buf.length>24&&buf.length<1024*1024&&buf.subarray(0,8).equals(PNG);
export class OfficeMemberFlagError extends Error {
 constructor(code,part=null,country=null){
  super(code);this.name="OfficeMemberFlagError";this.code=code;this.part=part;this.country=country;
 }
}
const error=(code,part,country)=>{throw new OfficeMemberFlagError(code,part,country);};
function newRel(parts,slide,filename){
 const file=slide.replace(/^(.*)\/([^/]+)$/,"$1/_rels/$2.rels");
 const original=parts.get(file),xml=original?.data.toString("utf8")??'<Relationships xmlns="'+REL_NS+'"></Relationships>';
 const existing=new Set([...xml.matchAll(/<(?:\w+:)?Relationship\b[^>]*\bId=["']([^"']+)["']/g)].map(x=>x[1]));
 let n=1;
 while(existing.has("rId"+n))n++;
 const id="rId"+n;
 const tag='<Relationship Id="'+id+'" Type="'+IMAGE_REL+'" Target="../media/'+filename.split("/").at(-1)+'"/>';
 let changed;
 if(/<\/(?:\w+:)?Relationships>/.test(xml))
  changed=xml.replace(/<\/(?:\w+:)?Relationships>/,found=>tag+found);
 else
  changed=xml.replace(/<((?:\w+:)?)Relationships\b([^>]*)\/>/,(_m,prefix,attrs)=>
   "<"+prefix+"Relationships"+attrs+">"+tag+"</"+prefix+"Relationships>");
 if(changed===xml)error("office-member-flag-invalid-relationships",slide);
 parts.set(file,{name:file,method:original?.method??8,data:Buffer.from(changed)});
 return id;
}
function setPngType(parts){
 const file="[Content_Types].xml",entry=parts.get(file);
 if(!entry)error("office-member-flag-invalid-content-types");
 const xml=entry.data.toString("utf8");
 if(/<(?:\w+:)?Default\b[^>]*Extension=["']png["']/i.test(xml))return;
 const changed=xml.replace(/<\/(?:\w+:)?Types>/,
  '<Default Extension="png" ContentType="image/png"/>$&');
 if(changed===xml)error("office-member-flag-invalid-content-types");
 parts.set(file,{...entry,data:Buffer.from(changed)});
}
function withBullet(paragraph,id,part,country){
 // Must not silently move a flag from the middle of a line to its start.
 const clean=paragraph.replace(FLAG,"");
 if(!/<a:t(?:\s[^>]*)?>/.test(clean))error("office-member-flag-invalid-paragraph",part,country);
 const bullet='<a:buSzPct val="100000"/><a:buBlip><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'+id+'"/></a:buBlip>';
 const hasProps=/<a:pPr\b[^>]*>/.test(clean);
 if(!hasProps){
  return clean.replace(/<a:p\b([^>]*)>/,(_m,attrs)=>"<a:p"+attrs+"><a:pPr marL=\"160000\" indent=\"-160000\">"+bullet+"</a:pPr>");
 }
 return clean.replace(/<a:pPr\b([^>]*)>([\s\S]*?)<\/a:pPr>/,
  (_m,attrs,inner)=>{
   if(/<a:bu(?:None|AutoNum|Char|Blip)\b/.test(inner))
    error("office-member-flag-existing-bullet",part,country);
   const updated=inner.replace(/(<a:(?:tabLst|defRPr)\b)/,bullet+"$1");
   return "<a:pPr"+attrs+">"+(updated===inner?inner+bullet:updated)+"</a:pPr>";
  });
}
/**
 * Embedded media are resolved from the SMN public/flags folder by a trusted
 * callback. A country image is stored only once per slide; different slides
 * get their own image relations but can share the same asset bytes.
 */
export function embedMemberFlagPictures(pkg,loadFlag){
 if(typeof loadFlag!=="function")throw new TypeError("flag-loader-required");
 const input=readZip(pkg),parts=new Map(input.map(p=>[p.name,{...p}]));
 const changes=[];
 for(const original of input){
  if(!/^ppt\/slides\/slide\d+\.xml$/.test(original.name))continue;
  const byCountry=new Map();
  let xml=original.data.toString("utf8");
  const marked=[...xml.matchAll(FLAG)];
  if(!marked.length)continue;
  // Flag is required in a dedicated member row paragraph; at most one per row.
  xml=xml.replace(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g,paragraph=>{
   const flags=[...paragraph.matchAll(FLAG)];
   if(!flags.length)return paragraph;
   if(flags.length!==1)error("office-member-flag-multiple-in-paragraph",original.name);
   const country=flags[0][1];
   const prefix=paragraph.slice(0,flags[0].index);
   const preceding=prefix.replace(/<[^>]*>/g,"");
   // Text preceding the flag in the same paragraph must be empty/whitespace.
   if(preceding.trim())error("office-member-flag-not-first",original.name,country);
   let id=byCountry.get(country);
   if(!id){
    const bytes=loadFlag(country);
    if(!validImage(bytes))error("office-member-flag-asset-missing",original.name,country);
    const filename="ppt/media/smn-member-flag-"+country.toLowerCase()+".png";
    let out=filename,seq=1;
    while(parts.has(out))out=filename.replace(/\.png$/,"-"+(++seq)+".png");
    id=newRel(parts,original.name,out);
    parts.set(out,{name:out,data:Buffer.from(bytes),method:8});
    byCountry.set(country,id);
   }
   changes.push({slide:original.name,country,relationship:id});
   return withBullet(paragraph,id,original.name,country);
  });
  if(/SMN_FLAG_[A-Z]{2}/.test(xml))error("office-member-flag-unhandled",original.name);
  parts.set(original.name,{...original,data:Buffer.from(xml)});
 }
 if(!changes.length)return {bytes:pkg,changes:[]};
 setPngType(parts);
 return {bytes:writeZip([...parts.values()]),changes};
}
