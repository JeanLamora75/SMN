import {open,lstat,rm} from "node:fs/promises";
import {basename} from "node:path";

/** Reader for SMN's own one-entry ZIP32 package. Fail closed for other ZIP
 * variants, encrypted members, traversal, extra fields and ZIP64. The inner
 * archive remains encrypted, and is validated separately by the backup engine.
 */
const MAX_BYTES=2*1024*1024*1024;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CRC_TABLE=Array.from({length:256},(_,i)=>{
 let n=i;for(let j=0;j<8;j++)n=(n&1)?0xedb88320^(n>>>1):(n>>>1);
 return n>>>0;
});
const checksum=(prior:number,data:Buffer)=>{
 let n=prior;for(const v of data)n=CRC_TABLE[(n^v)&255]^(n>>>8);
 return n>>>0;
};
export async function extractSmnEncryptedZip(
 archivePath:string,targetPath:string
):Promise<{archiveId:string;size:number}>{
 const info=await lstat(archivePath);
 if(!info.isFile()||info.isSymbolicLink()||info.size<150||info.size>MAX_BYTES)
  throw Error("migration-zip-invalid-size");
 const input=await open(archivePath,"r");
 let output:Awaited<ReturnType<typeof open>>|null=null,created=false;
 try{
  async function at(position:number,length:number):Promise<Buffer>{
   if(length<0||position<0||position+length>info.size)
    throw Error("migration-zip-truncated");
   const data=Buffer.alloc(length);
   let offset=0;
   while(offset<length){
    const {bytesRead}=await input.read(data,offset,length-offset,position+offset);
    if(bytesRead===0)throw Error("migration-zip-truncated");
    offset+=bytesRead;
   }
   return data;
  }
  const end=await at(info.size-22,22);
  if(end.readUInt32LE(0)!==0x06054b50||
   end.readUInt16LE(4)!==0||end.readUInt16LE(6)!==0||
   end.readUInt16LE(8)!==1||end.readUInt16LE(10)!==1||
   end.readUInt16LE(20)!==0)throw Error("migration-zip-footer-invalid");
  const cdSize=end.readUInt32LE(12),cdOffset=end.readUInt32LE(16);
  if(cdSize<46||cdSize>170||cdOffset+cdSize!==info.size-22)
   throw Error("migration-zip-directory-invalid");
  const central=await at(cdOffset,cdSize);
  if(central.readUInt32LE(0)!==0x02014b50||
   central.readUInt16LE(8)!==8||central.readUInt16LE(10)!==0||
   central.readUInt16LE(28)!==cdSize-46||
   central.readUInt16LE(30)!==0||central.readUInt16LE(32)!==0||
   central.readUInt16LE(34)!==0||central.readUInt32LE(42)!==0)
   throw Error("migration-zip-central-untrusted");
  const name=central.subarray(46).toString("ascii");
  const match=/^SMN-backup-([0-9a-f-]{36})\.tar\.gz$/.exec(name);
  if(!match||!UUID.test(match[1])||basename(name)!==name)
   throw Error("migration-zip-entry-untrusted");
  const expectedCrc=central.readUInt32LE(16);
  const length=central.readUInt32LE(20);
  if(length<40||length!==central.readUInt32LE(24)||length>MAX_BYTES)
   throw Error("migration-zip-member-size-invalid");
  const local=await at(0,30);
  if(local.readUInt32LE(0)!==0x04034b50||
   local.readUInt16LE(6)!==8||local.readUInt16LE(8)!==0||
   local.readUInt16LE(26)!==Buffer.byteLength(name,"ascii")||
   local.readUInt16LE(28)!==0)
   throw Error("migration-zip-local-untrusted");
  const head=await at(30,Buffer.byteLength(name,"ascii"));
  if(head.toString("ascii")!==name)throw Error("migration-zip-member-name-mismatch");
  const start=30+head.length;
  const descriptor=await at(start+length,16);
  if(descriptor.readUInt32LE(0)!==0x08074b50||
   descriptor.readUInt32LE(4)!==expectedCrc||
   descriptor.readUInt32LE(8)!==length||
   descriptor.readUInt32LE(12)!==length||
   start+length+16!==cdOffset)
   throw Error("migration-zip-descriptor-invalid");
  output=await open(targetPath,"wx",0o600);created=true;
  let crc=0xffffffff;
  let transferred=0;
  while(transferred<length){
   const chunk=await at(start+transferred,Math.min(1024*1024,length-transferred));
   crc=checksum(crc,chunk);
   await output.writeFile(chunk);
   transferred+=chunk.length;
  }
  await output.sync();
  if(((crc^0xffffffff)>>>0)!==expectedCrc)
   throw Error("migration-zip-checksum-invalid");
  return {archiveId:match[1],size:length};
 }catch(error){
  if(created)await rm(targetPath,{force:true}).catch(()=>undefined);
  throw error;
 }finally{
  await output?.close().catch(()=>undefined);
  await input.close();
 }
}
