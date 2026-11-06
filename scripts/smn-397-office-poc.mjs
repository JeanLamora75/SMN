// SMN-397: isolated Open XML feasibility POC, not a production report writer.
import { inflateRawSync, deflateRawSync } from "node:zlib";

const MAX_ZIP=20*1024*1024, MAX_UNPACKED=40*1024*1024, MAX_PARTS=500;

function crc32(bytes) {
  let crc=-1;
  for(const byte of bytes) {
    crc^=byte;
    for(let n=0;n<8;n++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^-1)>>>0;
}
function safePart(name) {
  return Boolean(name)&&!name.startsWith("/")&&!name.includes("\\")&&!name.includes("\0")&&!name.split("/").includes("..");
}

export function readZip(zip) {
  if(!Buffer.isBuffer(zip)||zip.length>MAX_ZIP) throw Error("Archive invalide ou trop grande");
  let tail=-1;
  for(let p=zip.length-22;p>=Math.max(0,zip.length-65557);p--) {
    if(zip.readUInt32LE(p)===0x06054b50&&p+22+zip.readUInt16LE(p+20)===zip.length){tail=p;break;}
  }
  if(tail<0) throw Error("ZIP sans répertoire final");
  const count=zip.readUInt16LE(tail+10),size=zip.readUInt32LE(tail+12),start=zip.readUInt32LE(tail+16);
  if(count>MAX_PARTS||count!==zip.readUInt16LE(tail+8)||zip.readUInt16LE(tail+4)!==0||zip.readUInt16LE(tail+6)!==0||size===0xffffffff||start===0xffffffff||start+size>tail) throw Error("ZIP non pris en charge");
  const parts=[],names=new Set();
  let at=start,total=0;
  for(let i=0;i<count;i++) {
    if(at+46>zip.length||zip.readUInt32LE(at)!==0x02014b50) throw Error("Entrée centrale invalide");
    const flags=zip.readUInt16LE(at+8),method=zip.readUInt16LE(at+10),crc=zip.readUInt32LE(at+16);
    const packed=zip.readUInt32LE(at+20),unpacked=zip.readUInt32LE(at+24);
    const n=zip.readUInt16LE(at+28),x=zip.readUInt16LE(at+30),comment=zip.readUInt16LE(at+32);
    const pos=zip.readUInt32LE(at+42),name=zip.subarray(at+46,at+46+n).toString("utf8");
    total+=unpacked;
    if(!safePart(name)||names.has(name)||(flags&1)||![0,8].includes(method)||packed===0xffffffff||unpacked===0xffffffff||total>MAX_UNPACKED||at+46+n+x+comment>zip.length||pos+30>zip.length||zip.readUInt32LE(pos)!==0x04034b50) throw Error("Partie ZIP incompatible");
    names.add(name);
    const dataStart=pos+30+zip.readUInt16LE(pos+26)+zip.readUInt16LE(pos+28);
    if(dataStart+packed>zip.length) throw Error("Partie ZIP tronquée");
    const encoded=zip.subarray(dataStart,dataStart+packed);
    const data=method===0?Buffer.from(encoded):inflateRawSync(encoded,{maxOutputLength:Math.max(1,unpacked)});
    if(data.length!==unpacked||crc32(data)!==crc) throw Error("CRC ZIP incorrect");
    parts.push({name,method,data});
    at+=46+n+x+comment;
  }
  if(at!==start+size) throw Error("Index ZIP incohérent");
  return parts;
}

export function writeZip(parts) {
  let offset=0;
  const locals=[],centrals=[];
  for(const {name,data,method=8} of parts) {
    if(!safePart(name)||![0,8].includes(method)) throw Error("Nom ou méthode ZIP invalide");
    const label=Buffer.from(name),compressed=method===0?data:deflateRawSync(data),crc=crc32(data);
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);
    local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);
    local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(label.length,26);
    locals.push(local,label,compressed);
    const central=Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
    central.writeUInt16LE(0x0800,8);central.writeUInt16LE(method,10);
    central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(label.length,28);central.writeUInt32LE(offset,42);
    centrals.push(central,label);offset+=local.length+label.length+compressed.length;
  }
  const index=Buffer.concat(centrals),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(parts.length,8);end.writeUInt16LE(parts.length,10);
  end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,index,end]);
}
function escapeText(value) {
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function decodeText(text) {
  return text.replace(/&#x([\da-f]+);/gi,(_,v)=>String.fromCodePoint(parseInt(v,16)))
    .replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(Number(v)))
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
}

// Tags may span multiple runs but never cross paragraph, table-cell or shape boundaries.
// A known tag with null value becomes N/D; an unknown tag remains untouched.
export function replaceOfficeXml(xml,values) {
  const pattern=/<(w:t|a:t)(\s[^>]*)?>([^<]*)<\/\1>/g,nodes=[];
  let m;
  while((m=pattern.exec(xml))) nodes.push({begin:m.index,end:pattern.lastIndex,type:m[1],attrs:m[2]||"",text:decodeText(m[3])});
  const edits=new Map();
  let count=0;
  for(let begin=0;begin<nodes.length;) {
    let end=begin+1;
    while(end<nodes.length&&!/<\/(?:w:p|a:p|a:tc|p:sp)>/.test(xml.slice(nodes[end-1].end,nodes[end].begin))) end++;
    const group=nodes.slice(begin,end),combined=group.map(node=>node.text).join("");
    const matches=[...combined.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)].filter(m=>Object.hasOwn(values,m[1]));
    // Resolve replacements from right to left so original offsets remain stable.
    for(const match of matches.reverse()) {
      const left=match.index,right=left+match[0].length;
      let cursor=0;
      const spans=group.map(node=>{const from=cursor;cursor+=node.text.length;return {node,from,to:cursor};});
      const affected=spans.filter(s=>s.to>left&&s.from<right);
      for(const span of affected) {
        const lo=Math.max(0,left-span.from),hi=Math.min(span.node.text.length,right-span.from);
        const current=edits.get(span.node)??span.node.text;
        edits.set(span.node,current.slice(0,lo)+(span===affected[0]?escapeText(values[match[1]]??"N/D"):"")+current.slice(hi));
      }
      count++;
    }
    begin=end;
  }
  let result=xml;
  for(const node of [...nodes].reverse()) {
    if(!edits.has(node)) continue;
    result=result.slice(0,node.begin)+"<"+node.type+node.attrs+">"+edits.get(node)+"</"+node.type+">"+result.slice(node.end);
  }
  return {xml:result,count};
}

export function probeOfficePackage(source,values,type) {
  if(!["docx","pptx"].includes(type)) throw Error("Type Office invalide");
  const entries=readZip(source),required=["[Content_Types].xml",type==="docx"?"word/document.xml":"ppt/presentation.xml"];
  if(required.some(name=>!entries.some(e=>e.name===name))) throw Error("Package Office incomplet");
  const changed=[];
  const output=entries.map(e=>{
    const target=type==="docx"?/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(e.name):/^ppt\/slides\/slide\d+\.xml$/.test(e.name);
    if(!target)return e;
    const result=replaceOfficeXml(e.data.toString("utf8"),values);
    if(!result.count)return e;
    changed.push({file:e.name,replacements:result.count});
    return {...e,data:Buffer.from(result.xml)};
  });
  return {output:writeZip(output),modified:changed};
}
