import {open,lstat,rm} from "node:fs/promises";
import {dirname,join} from "node:path";

/** Strict ZIP32 reader, no path traversal, symlinks, ZIP64, extra fields,
 * compression, duplicate members, or appended payloads. The ZIP member
 * names are fixed by SMN. Each member is checksummed before acceptance.
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
type Member={name:string;size:number;crc:number;offset:number};
export type ExtractedTransferZip=Readonly<{
 archiveId:string;size:number;hasTransferEvidence:boolean;
 receiptPath:string|null;ledgerPath:string|null;
}>;
export async function extractSmnEncryptedZip(
 archivePath:string,targetPath:string
):Promise<ExtractedTransferZip>{
 const info=await lstat(archivePath);
 if(!info.isFile()||info.isSymbolicLink()||info.size<150||info.size>MAX_BYTES)
  throw Error("migration-zip-invalid-size");
 const input=await open(archivePath,"r");
 const created:string[]=[];
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
   end.readUInt16LE(8)!==end.readUInt16LE(10)||
   ![1,3].includes(end.readUInt16LE(10))||
   end.readUInt16LE(20)!==0)throw Error("migration-zip-footer-invalid");
  const count=end.readUInt16LE(10);
  const cdSize=end.readUInt32LE(12),cdOffset=end.readUInt32LE(16);
  if(cdSize<count*46||cdSize>count*180||
   cdOffset+cdSize!==info.size-22)
   throw Error("migration-zip-directory-invalid");
  const directory=await at(cdOffset,cdSize);
  const members:Member[]=[];
  let cursor=0;
  for(let i=0;i<count;i++){
   if(cursor+46>directory.length||
    directory.readUInt32LE(cursor)!==0x02014b50||
    directory.readUInt16LE(cursor+8)!==8||
    directory.readUInt16LE(cursor+10)!==0||
    directory.readUInt16LE(cursor+30)!==0||
    directory.readUInt16LE(cursor+32)!==0||
    directory.readUInt16LE(cursor+34)!==0||
    directory.readUInt32LE(cursor+38)!==0)
    throw Error("migration-zip-central-untrusted");
   const nameLength=directory.readUInt16LE(cursor+28);
   if(!nameLength||nameLength>120||cursor+46+nameLength>directory.length)
    throw Error("migration-zip-member-name-invalid");
   const name=directory.subarray(cursor+46,cursor+46+nameLength).toString("ascii");
   const size=directory.readUInt32LE(cursor+20);
   if(directory.readUInt32LE(cursor+24)!==size)
    throw Error("migration-zip-compressed-member");
   const max=name==="migration-receipt.json"?8192:
    name==="privacy-ledger.enc"?24*1024*1024:MAX_BYTES;
   if(size<1||size>max)throw Error("migration-zip-member-size-invalid");
   members.push({name,size,crc:directory.readUInt32LE(cursor+16),
    offset:directory.readUInt32LE(cursor+42)});
   cursor+=46+nameLength;
  }
  if(cursor!==directory.length)throw Error("migration-zip-central-trailing-data");
  const match=/^SMN-backup-([0-9a-f-]{36})\.tar\.gz$/.exec(members[0]?.name??"");
  if(!match||!UUID.test(match[1])||
   (count===3&&(members[1].name!=="migration-receipt.json"||
    members[2].name!=="privacy-ledger.enc"))||
   new Set(members.map(m=>m.name)).size!==count)
   throw Error("migration-zip-entry-untrusted");
  let current=0;
  for(let i=0;i<members.length;i++){
   const entry=members[i];
   if(entry.offset!==current)throw Error("migration-zip-overlapping-members");
   const header=await at(current,30);
   const nameLength=header.readUInt16LE(26);
   const extraLength=header.readUInt16LE(28);
   if(header.readUInt32LE(0)!==0x04034b50||
    header.readUInt16LE(6)!==8||header.readUInt16LE(8)!==0||
    nameLength!==Buffer.byteLength(entry.name,"ascii")||
    extraLength!==0)
    throw Error("migration-zip-local-untrusted");
   if((await at(current+30,nameLength)).toString("ascii")!==entry.name)
    throw Error("migration-zip-member-name-mismatch");
   const start=current+30+nameLength;
   const descriptor=await at(start+entry.size,16);
   if(descriptor.readUInt32LE(0)!==0x08074b50||
    descriptor.readUInt32LE(4)!==entry.crc||
    descriptor.readUInt32LE(8)!==entry.size||
    descriptor.readUInt32LE(12)!==entry.size)
    throw Error("migration-zip-descriptor-invalid");
   const outputPath=i===0?targetPath:
    join(dirname(targetPath),i===1?"transfer-receipt.tmp":"privacy-ledger.tmp");
   // Token-isolated directory must be created by the caller before unpacking.
   const output=await open(outputPath,"wx",0o600);
   created.push(outputPath);
   let crc=0xffffffff;
   try{
    let position=0;
    while(position<entry.size){
     const chunk=await at(start+position,Math.min(1024*1024,entry.size-position));
     crc=checksum(crc,chunk);
     await output.writeFile(chunk);
     position+=chunk.length;
    }
    await output.sync();
   }finally{await output.close();}
   if(((crc^0xffffffff)>>>0)!==entry.crc)
    throw Error("migration-zip-checksum-invalid");
   current=start+entry.size+16;
  }
  if(current!==cdOffset)throw Error("migration-zip-directory-offset-invalid");
  return {archiveId:match[1],size:members[0].size,
   hasTransferEvidence:count===3,
   receiptPath:count===3?created[1]:null,
   ledgerPath:count===3?created[2]:null};
 }catch(error){
  for(const file of created)await rm(file,{force:true}).catch(()=>undefined);
  throw error;
 }finally{await input.close();}
}
