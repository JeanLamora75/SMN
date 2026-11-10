// Bounded ZIP decoder for untrusted offline updates.
// Only methods STORE and DEFLATE are accepted. ZIP64, encryption, symlinks,
// NTFS path aliases and unexpected metadata are explicitly refused.
import {inflateRawSync} from "node:zlib";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {isUpdateableFile} from "./update-contract.mjs";

const MAX_ARCHIVE=120*1024*1024, MAX_FILES=20050;
const MAX_SINGLE=64*1024*1024, MAX_TOTAL=768*1024*1024;
function read32(b,i){if(i<0||i+4>b.length)throw Error("zip-invalid");return b.readUInt32LE(i);}
function read16(b,i){if(i<0||i+2>b.length)throw Error("zip-invalid");return b.readUInt16LE(i);}
function safeName(name,dir){
  if(typeof name!=="string" || name.includes("\\") || name.includes(":") ||
    name.startsWith("/") || name.includes("\0") || /[\x00-\x1f\x7f]/.test(name) ||
    name.split("/").some((p,i,a)=>!p&&i!==a.length-1 || p===".." || p==="." ||
     /[. ]$/.test(p)||/^(con|aux|prn|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))
    throw Error("zip-path-invalid");
  const relative=dir?name.slice(0,-1):name;
  if(!relative || name!==relative+(dir?"/":""))throw Error("zip-path-invalid");
  if(relative==="manifest.json" || relative==="manifest.sig")return;
  if(relative==="payload" && dir)return;
  if(relative.startsWith("payload/")){
    const target=relative.slice("payload/".length);
    // Directory names must themselves be within allowed update roots.
    if(!dir && !isUpdateableFile(target))throw Error("zip-path-restricted");
    if(target.split("/")[0]!=="app" && !["prisma","scripts"].includes(target.split("/")[0]))
      if(dir)throw Error("zip-path-restricted");
    return;
  }
  throw Error("zip-path-restricted");
}
function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
export function inspectZip(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length>MAX_ARCHIVE || bytes.length<22)
    throw Error("zip-size-invalid");
  const endMin=Math.max(0,bytes.length-65557);
  let end=-1;
  for(let i=bytes.length-22;i>=endMin;i--){
    if(read32(bytes,i)===0x06054b50 && i+22+read16(bytes,i+20)===bytes.length){end=i;break;}
  }
  if(end<0 || read16(bytes,end+4)!==0 || read16(bytes,end+6)!==0 ||
    read16(bytes,end+8)!==read16(bytes,end+10) ||
    read16(bytes,end+10)>MAX_FILES)throw Error("zip-directory-invalid");
  const count=read16(bytes,end+10),size=read32(bytes,end+12),offset=read32(bytes,end+16);
  if(size===0xffffffff||offset===0xffffffff||offset+size!==end)throw Error("zip-directory-invalid");
  const files=[],seen=new Set();
  let cursor=offset,total=0;
  for(let n=0;n<count;n++){
    if(read32(bytes,cursor)!==0x02014b50)throw Error("zip-directory-invalid");
    const platform=read16(bytes,cursor+4)>>8,flags=read16(bytes,cursor+8);
    const method=read16(bytes,cursor+10),crc=read32(bytes,cursor+16);
    const packed=read32(bytes,cursor+20),plain=read32(bytes,cursor+24);
    const nameLen=read16(bytes,cursor+28),extraLen=read16(bytes,cursor+30),commentLen=read16(bytes,cursor+32);
    const disk=read16(bytes,cursor+34),attr=read32(bytes,cursor+38),local=read32(bytes,cursor+42);
    if(nameLen<1||packed===0xffffffff||plain===0xffffffff||!([0,8].includes(method)) ||
       (flags&~0x808)!==0 || disk!==0 || plain>MAX_SINGLE || extraLen>4096 ||
       commentLen>1024 || local>=offset)throw Error("zip-entry-invalid");
    const isDir=(attr&0x10)!==0;
    const mode=(attr>>>16)&0xffff;
    if(platform===3 && ((mode&0xf000)===0xa000 || (mode&0xf000)===0x6000))
      throw Error("zip-special-file");
    const nameStart=cursor+46,nameEnd=nameStart+nameLen;
    if(nameEnd>offset+size)throw Error("zip-directory-invalid");
    const name=bytes.subarray(nameStart,nameEnd).toString("utf8");
    if(!Buffer.from(name,"utf8").equals(bytes.subarray(nameStart,nameEnd)))
      throw Error("zip-name-invalid");
    const directory=isDir||name.endsWith("/");
    safeName(name,directory);
    const key=name.toLowerCase();
    if(seen.has(key))throw Error("zip-duplicate");
    seen.add(key);
    if(read32(bytes,local)!==0x04034b50 || read16(bytes,local+8)!==method ||
       read16(bytes,local+6)!==flags)throw Error("zip-header-mismatch");
    const localNameLen=read16(bytes,local+26),localExtra=read16(bytes,local+28);
    if(localExtra>4096 || localNameLen!==nameLen ||
       !bytes.subarray(local+30,local+30+nameLen).equals(bytes.subarray(nameStart,nameEnd)))
       throw Error("zip-header-mismatch");
    const start=local+30+localNameLen+localExtra;
    if(start+packed>offset)throw Error("zip-overlap");
    if(directory && (plain!==0||packed!==0))throw Error("zip-directory-invalid");
    total+=plain;if(total>MAX_TOTAL)throw Error("zip-expanded-limit");
    files.push({name,directory,start,packed,plain,crc,method});
    cursor=nameEnd+extraLen+commentLen;
  }
  if(cursor!==offset+size || !seen.has("manifest.json") || !seen.has("manifest.sig"))
    throw Error("zip-directory-invalid");
  return files;
}
export async function unpackZip(bytes,destination){
  const entries=inspectZip(bytes);
  // A fresh destination is mandatory: never follow a planted staging symlink.
  await mkdir(destination,{mode:0o700});
  for(const entry of entries){
    const file=path.join(destination,...entry.name.split("/"));
    if(entry.directory){await mkdir(file,{recursive:true});continue;}
    await mkdir(path.dirname(file),{recursive:true});
    const source=bytes.subarray(entry.start,entry.start+entry.packed);
    const output=entry.method===0?source:inflateRawSync(source,{maxOutputLength:Math.min(MAX_SINGLE,entry.plain+1)});
    if(output.length!==entry.plain||crc32(output)!==entry.crc)throw Error("zip-content-invalid");
    await writeFile(file,output,{flag:"wx",mode:0o600});
  }
  return entries.length;
}
