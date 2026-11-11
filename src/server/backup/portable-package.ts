import {createReadStream} from "node:fs";
import {lstat} from "node:fs/promises";
import {join} from "node:path";
import {Readable} from "node:stream";
import {createGzip} from "node:zlib";
import type {BackupInventoryEntry} from "./verification";

const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const PART=/^(?:database\.pgcustom\.enc|(?:documents|report-pdfs|office-reports|office-templates)\/[0-9]{5}\.enc)$/;
const BLOCK=512;

/** Minimal USTAR writer. No plaintext or local backup key enters the transport. */
function octal(n:number,width:number):string{
 const out=n.toString(8);
 if(!Number.isSafeInteger(n)||n<0||out.length>width-1)
  throw Error("portable-tar-size-invalid");
 return out.padStart(width-1,"0")+"\0";
}
function header(name:string,size:number):Buffer{
 if(!/^[A-Za-z0-9_.\/-]{1,100}$/.test(name)||name.includes("..")||
  name.startsWith("/")||name.includes("//"))throw Error("portable-tar-name-invalid");
 const h=Buffer.alloc(BLOCK,0);
 h.write(name,0,"ascii");
 h.write(octal(0o600,8),100,"ascii");
 h.write(octal(0,8),108,"ascii");
 h.write(octal(0,8),116,"ascii");
 h.write(octal(size,12),124,"ascii");
 h.write(octal(0,12),136,"ascii");
 h.fill(32,148,156);
 h.write("0",156,"ascii");
 h.write("ustar\0",257,"ascii");
 h.write("00",263,"ascii");
 let sum=0;
 for(const b of h)sum+=b;
 h.write(sum.toString(8).padStart(6,"0")+"\0 ",148,"ascii");
 return h;
}
export function portableFileNames(item:BackupInventoryEntry):readonly string[]{
 if(!ID.test(item.id)||item.status!=="verified"||
  item.integrityVerified!==true||item.scopeComplete!==true)
  throw Error("portable-backup-unverified");
 const components=item.components.map(c=>c.path);
 if(!components.includes("database.pgcustom.enc")||
  components.some(name=>!PART.test(name))||
  new Set(components).size!==components.length)
  throw Error("portable-components-untrusted");
 return ["index.json","manifest.enc",...components].sort();
}
/**
 * Validate every regular file BEFORE opening the stream. A destination MUST
 * revalidate the authenticated manifest; streaming cannot freeze source files.
 */
export async function streamPortableBackup(root:string,item:BackupInventoryEntry):Promise<Readable>{
 const names=portableFileNames(item),base=join(root,"packages",item.id);
 const baseStat=await lstat(base);
 if(!baseStat.isDirectory()||baseStat.isSymbolicLink())
  throw Error("portable-folder-untrusted");
 const declared=new Map(item.components.map(c=>[c.path,c.encryptedSize]));
 const files: {name:string;path:string;size:number}[]=[];
 for(const name of names){
  const path=join(base,...name.split("/"));
  if(name.includes("/")){
   const parent=await lstat(join(base,name.split("/")[0]));
   if(!parent.isDirectory()||parent.isSymbolicLink())
    throw Error("portable-parent-untrusted");
  }
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||
   stat.size>8*1024*1024*1024||
   (declared.has(name)&&declared.get(name)!==stat.size))
   throw Error("portable-file-untrusted");
  files.push({name,path,size:stat.size});
 }
 async function* tar(){
  for(const file of files){
   yield header(file.name,file.size);
   let total=0;
   for await(const chunk of createReadStream(file.path)){
    total+=(chunk as Buffer).length;
    if(total>file.size)throw Error("portable-file-changed");
    yield chunk as Buffer;
   }
   if(total!==file.size)throw Error("portable-file-changed");
   const pad=(BLOCK-file.size%BLOCK)%BLOCK;
   if(pad)yield Buffer.alloc(pad);
  }
  yield Buffer.alloc(BLOCK*2);
 }
 return Readable.from(tar()).pipe(createGzip({level:6}));
}
