import {inflateRawSync} from "node:zlib";

/**
 * Bounded OOXML text-layer extractor for positive impact candidates.
 * It neither executes macros nor expands embedded documents. Images,
 * custom XML, tracked content and non-text objects must be reviewed.
 */
const MAX_ZIP=20*1024*1024,MAX_FILES=600,MAX_TOTAL=32*1024*1024,MAX_PART=2*1024*1024;
const textPart=/^(?:word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml|ppt\/(?:slides\/slide\d+|notesSlides\/notesSlide\d+|comments\/comment\d+)\.xml)$/;
const str=(bytes:Buffer,start:number,size:number)=>bytes.subarray(start,start+size).toString("utf8");
const validRange=(buf:Buffer,offset:number,length:number)=>
 Number.isSafeInteger(offset)&&Number.isSafeInteger(length)&&offset>=0&&length>=0&&
 offset+length<=buf.length;
const crcTable=Array.from({length:256},(_,i)=>{
 let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function crc32(bytes:Buffer):number{
 let c=0xffffffff;
 for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
const xmlUnescape=(value:string)=>value.replace(/&(?:amp|lt|gt|quot|apos|#(?:x[0-9a-f]+|[0-9]+));/gi,entity=>{
 switch(entity.toLowerCase()){
  case "&amp;":return "&";case "&lt;":return "<";case "&gt;":return ">";
  case "&quot;":return '"';case "&apos;":return "'";
 }
 const hex=entity[2]?.toLowerCase()==="x";
 const code=Number.parseInt(entity.slice(hex?3:2,-1),hex?16:10);
 return Number.isInteger(code)&&code>=0&&code<=0x10ffff&&!(
  code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):"";
});
export type OoxmlExtraction=Readonly<{
 state:"extracted"|"unsupported";text:string|null;parts:number;
 imagesPresent:boolean;reason:string;
}>;
export function extractOoxmlText(bytes:Buffer):OoxmlExtraction{
 const reject=(reason:string):OoxmlExtraction=>({
  state:"unsupported",text:null,parts:0,imagesPresent:true,reason
 });
 if(!Buffer.isBuffer(bytes)||bytes.length>MAX_ZIP||bytes.length<22)
  return reject("archive-invalid");
 let eocd=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)
  if(bytes.readUInt32LE(p)===0x06054b50&&validRange(bytes,p,22)&&
   p+22+bytes.readUInt16LE(p+20)===bytes.length){eocd=p;break;}
 if(eocd<0)return reject("zip-directory-missing");
 const fileCount=bytes.readUInt16LE(eocd+10);
 const offset=bytes.readUInt32LE(eocd+16),size=bytes.readUInt32LE(eocd+12);
 if(fileCount>MAX_FILES||fileCount===0||fileCount===65535||offset===0xffffffff||
  !validRange(bytes,offset,size)||offset+size>eocd||
  bytes.readUInt16LE(eocd+4)!==0||bytes.readUInt16LE(eocd+6)!==0||
  bytes.readUInt16LE(eocd+8)!==fileCount)return reject("zip-unsupported");
 let cursor=offset,total=0,parts=0;let imagesPresent=false;
 const words:string[]=[];
 for(let i=0;i<fileCount;i++){
  if(!validRange(bytes,cursor,46)||bytes.readUInt32LE(cursor)!==0x02014b50)
   return reject("zip-directory-corrupt");
  const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10);
  const expectedCrc=bytes.readUInt32LE(cursor+16);
  const compressed=bytes.readUInt32LE(cursor+20),uncompressed=bytes.readUInt32LE(cursor+24);
  const filenameLen=bytes.readUInt16LE(cursor+28),extraLen=bytes.readUInt16LE(cursor+30);
  const commentLen=bytes.readUInt16LE(cursor+32),local=bytes.readUInt32LE(cursor+42);
  if(!validRange(bytes,cursor+46,filenameLen+extraLen+commentLen)||
   !validRange(bytes,local,30)||bytes.readUInt32LE(local)!==0x04034b50||
   flags&1||compressed===0xffffffff||uncompressed===0xffffffff||
   compressed>MAX_ZIP||uncompressed>MAX_PART||
   (method!==0&&method!==8))return reject("zip-entry-invalid");
  const name=str(bytes,cursor+46,filenameLen);
  if(name.includes("..")||name.startsWith("/")||name.includes("\\"))return reject("zip-entry-path");
  const nameLen=bytes.readUInt16LE(local+26),localExtra=bytes.readUInt16LE(local+28);
  const start=local+30+nameLen+localExtra;
  if(!validRange(bytes,start,compressed))return reject("zip-entry-range");
  const relevant=textPart.test(name);
  if(/\/(?:media|embeddings)\//.test(name))imagesPresent=true;
  if(relevant){
   let plain:Buffer;
   try{
    const data=bytes.subarray(start,start+compressed);
    plain=method===0?Buffer.from(data):inflateRawSync(data,{maxOutputLength:MAX_PART});
   }catch{return reject("zip-entry-compression");}
   if(plain.length!==uncompressed||crc32(plain)!==expectedCrc)return reject("zip-entry-crc");
   total+=plain.length;if(total>MAX_TOTAL)return reject("zip-text-limit");
   const xml=new TextDecoder("utf-8",{fatal:false}).decode(plain);
   const pieces=[...xml.matchAll(/<(?:w:t|a:t)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:w:t|a:t)>/g)]
    .map(match=>xmlUnescape(match[1]));
   words.push(pieces.join(" "));
   words.push(pieces.join(""));
   parts++;
  }
  cursor+=46+filenameLen+extraLen+commentLen;
 }
 if(cursor!==offset+size||parts===0)return reject("zip-no-usable-text");
 return {state:"extracted",text:words.join(" "),parts,imagesPresent,reason:"text-layer-only"};
}
