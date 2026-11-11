import {createReadStream} from "node:fs";
import {createGunzip} from "node:zlib";
import {lstat,mkdtemp,mkdir,open,readFile,rm,rename,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve,isAbsolute} from "node:path";
import {recoverKey,type RecoveryEnvelope} from "./crypto";
import {inspectBackup} from "./verification";
import {backupRootPath} from "./runner";
import {privateFolder} from "./files";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ENTRY=/^(?:index\.json|manifest\.enc|database\.pgcustom\.enc|(?:documents|report-pdfs|office-reports|office-templates)\/[0-9]{5}\.enc)$/;
const MAX_FILES=2600;
const MAX_SIZE=8*1024*1024*1024;
const BLOCK=512;

function field(bytes:Buffer,start:number,length:number){
 return bytes.subarray(start,start+length).toString("ascii").split("\0")[0];
}
function parseHeader(raw:Buffer){
 const name=field(raw,0,100);
 if(!ENTRY.test(name)||name.includes("..")||name.startsWith("/"))
  throw Error("portable-entry-untrusted");
 if(!["0",""].includes(field(raw,156,1))||field(raw,257,6)!=="ustar")
  throw Error("portable-entry-type-invalid");
 const digits=field(raw,124,12).trim(),checksum=field(raw,148,8).trim();
 if(!/^[0-7]{1,11}$/.test(digits)||!/^[0-7]{1,8}$/.test(checksum))
  throw Error("portable-tar-invalid");
 const size=parseInt(digits,8),expect=parseInt(checksum,8);
 const limit=name==="index.json"?1024*1024:
  name==="manifest.enc"?4*1024*1024:
  name==="database.pgcustom.enc"?MAX_SIZE:20*1024*1024;
 if(!Number.isSafeInteger(size)||size<1||size>limit)
  throw Error("portable-entry-size-invalid");
 const copy=Buffer.from(raw);
 copy.fill(32,148,156);
 const actual=copy.reduce((sum,b)=>sum+b,0);
 if(actual!==expect)throw Error("portable-tar-checksum-invalid");
 return {name,size};
}

async function extract(input:string,destination:string):Promise<void>{
 const stream=createReadStream(input).pipe(createGunzip());
 const iterator=stream[Symbol.asyncIterator]();
 let buffer=Buffer.alloc(0),exhausted=false,total=0;
 const read=async(length:number):Promise<Buffer>=>{
  const fragments:Buffer[]=[];
  let remaining=length;
  while(remaining>0){
   if(buffer.length===0){
    const next=await iterator.next();
    if(next.done){exhausted=true;throw Error("portable-tar-truncated");}
    buffer=Buffer.isBuffer(next.value)?next.value:Buffer.from(next.value);
   }
   const take=Math.min(buffer.length,remaining);
   fragments.push(buffer.subarray(0,take));
   buffer=buffer.subarray(take);
   remaining-=take;total+=take;
   if(total>MAX_SIZE+MAX_FILES*BLOCK*2)
    throw Error("portable-tar-over-limit");
  }
  return fragments.length===1?fragments[0]:Buffer.concat(fragments,length);
 };
 const seen=new Set<string>();
 let zeros=0;
 try{
  while(true){
   const h=await read(BLOCK);
   if(h.every(b=>b===0)){
    zeros++;
    if(zeros===2)break;
    continue;
   }
   if(zeros)throw Error("portable-tar-invalid");
   const {name,size}=parseHeader(h);
   if(seen.has(name)||seen.size>=MAX_FILES)throw Error("portable-entries-duplicate");
   seen.add(name);
   const pieces=name.split("/");
   if(pieces.length===2)await mkdir(join(destination,pieces[0]),{recursive:true,mode:0o700});
   const fd=await open(join(destination,...pieces),"wx",0o600);
   try{
    let remaining=size;
    while(remaining>0){
     const part=await read(Math.min(remaining,64*1024));
     await fd.writeFile(part);
     remaining-=part.length;
    }
    await fd.sync();
   }finally{await fd.close();}
   const padding=(BLOCK-size%BLOCK)%BLOCK;
   if(padding){
    const pad=await read(padding);
    if(!pad.every(b=>b===0))throw Error("portable-padding-invalid");
   }
  }
  if(!seen.has("index.json")||!seen.has("manifest.enc")||
   !seen.has("database.pgcustom.enc"))throw Error("portable-entries-incomplete");
  if(buffer.length||!(await iterator.next()).done)
   throw Error("portable-tar-trailing-data");
 }finally{stream.destroy();}
}

/**
 * Install only an encrypted, authenticated BACKUP into a pristine local backup
 * store. No database connection, session write, ledger mutation or cutover.
 * A migration to the live application remains separately prohibited.
 */
export async function importPortableBackup(input:string,id:string,phrase:string){
 if(!UUID.test(id)||!isAbsolute(input)||resolve(input)!==input)
  throw Error("portable-import-arguments-invalid");
 const source=await lstat(input);
 if(!source.isFile()||source.isSymbolicLink()||source.size<1||
  source.size>MAX_SIZE)throw Error("portable-import-source-untrusted");
 const root=backupRootPath();
 try{await lstat(root);throw Error("portable-destination-not-pristine");}
 catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
 const scratch=await mkdtemp(join(tmpdir(),"smn-portable-incoming-"));
 const folder=join(scratch,"packages",id);
 let key:Buffer|null=null,created=false;
 try{
  await mkdir(folder,{recursive:true,mode:0o700});
  await extract(input,folder);
  const raw=await readFile(join(folder,"index.json"),"utf8");
  if(raw.length>1024*1024)throw Error("portable-index-too-large");
  const index=JSON.parse(raw) as {id?:string;recovery?:RecoveryEnvelope};
  if(index.id!==id||!index.recovery)throw Error("portable-index-invalid");
  key=recoverKey(index.recovery,phrase);
  const result=await inspectBackup(scratch,id,key);
  if(result.status!=="verified"||result.integrityVerified!==true||
   result.scopeComplete!==true||result.schemaVersion!==33||
   !result.postgresVersion?.startsWith("18."))
   throw Error("portable-import-verification-failed");
  // Never overwrite an already initialized store; no partial import is
  // considered a success. Only a directory created by this invocation
  // may be removed on failure.
  await mkdir(root,{mode:0o700});created=true;
  await privateFolder(root);
  await mkdir(join(root,"packages"),{mode:0o700});
  await writeFile(join(root,".backup-key"),key,{flag:"wx",mode:0o600});
  await writeFile(join(root,".recovery.json"),
   JSON.stringify(index.recovery),{flag:"wx",mode:0o600});
  await rename(folder,join(root,"packages",id));
  const check=await inspectBackup(root,id,key);
  if(check.status!=="verified")throw Error("portable-import-verification-failed");
  return {mode:"encrypted-package-imported" as const,archiveId:id,
   verifiedComponents:check.components.length,restorationAuthorized:false as const};
 }catch{
  if(created)await rm(root,{recursive:true,force:true}).catch(()=>undefined);
  throw Error("portable-import-blocked");
 }finally{
  key?.fill(0);
  await rm(scratch,{recursive:true,force:true}).catch(()=>undefined);
 }
}
