import {Readable} from "node:stream";

/** Deterministic, bounded ZIP32 with streaming STORE entries. The three
 * recognized filenames are flat; no caller-controlled paths can be embedded.
 * The compressed backup remains authenticated by its original AES-GCM format.
 */
const C=Array.from({length:256},(_,x)=>{
 let v=x;for(let i=0;i<8;i++)v=v&1?0xedb88320^(v>>>1):v>>>1;
 return v>>>0;
});
const crcChunk=(crc:number,b:Buffer)=>{
 let v=crc;for(const x of b)v=C[(v^x)&255]^(v>>>8);
 return v>>>0;
};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type TransferZipExtra=Readonly<{
 name:"migration-receipt.json"|"privacy-ledger.enc";
 data:Buffer;
}>;
export function wrapPortableTransferZip(
 encryptedTar:Readable,archiveId:string,extras:readonly TransferZipExtra[]
):Readable{
 if(!UUID.test(archiveId)||extras.length>2||
  new Set(extras.map(e=>e.name)).size!==extras.length||
  extras.some(e=>!["migration-receipt.json","privacy-ledger.enc"].includes(e.name)||
   e.data.length===0||e.data.length>24*1024*1024))
  throw Error("migration-transfer-zip-arguments-invalid");
 const filename="SMN-backup-"+archiveId+".tar.gz";
 const entries=[
  {name:filename,stream:encryptedTar},
  ...extras.map(e=>({name:e.name,stream:Readable.from([e.data])}))
 ];
 return Readable.from((async function*(){
  let offset=0;
  const cds:Buffer[]=[];
  for(const entry of entries){
   const name=Buffer.from(entry.name,"ascii");
   const localOffset=offset;
   const local=Buffer.alloc(30+name.length);
   local.writeUInt32LE(0x04034b50,0);
   local.writeUInt16LE(20,4);
   local.writeUInt16LE(8,6);
   local.writeUInt16LE(0,8);
   local.writeUInt16LE(name.length,26);
   name.copy(local,30);
   yield local;offset+=local.length;
   let crc=0xffffffff,size=0;
   for await(const raw of entry.stream){
    const chunk=Buffer.isBuffer(raw)?raw:Buffer.from(raw);
    size+=chunk.length;
    if(size>2*1024*1024*1024||offset+chunk.length>0xffffffff-1024)
     throw Error("migration-transfer-zip-too-large");
    crc=crcChunk(crc,chunk);
    yield chunk;offset+=chunk.length;
   }
   crc=(crc^0xffffffff)>>>0;
   const desc=Buffer.alloc(16);
   desc.writeUInt32LE(0x08074b50,0);
   desc.writeUInt32LE(crc,4);
   desc.writeUInt32LE(size,8);
   desc.writeUInt32LE(size,12);
   yield desc;offset+=desc.length;
   const cd=Buffer.alloc(46+name.length);
   cd.writeUInt32LE(0x02014b50,0);
   cd.writeUInt16LE(20,4);
   cd.writeUInt16LE(20,6);
   cd.writeUInt16LE(8,8);
   cd.writeUInt16LE(0,10);
   cd.writeUInt32LE(crc,16);
   cd.writeUInt32LE(size,20);
   cd.writeUInt32LE(size,24);
   cd.writeUInt16LE(name.length,28);
   cd.writeUInt32LE(localOffset,42);
   name.copy(cd,46);
   cds.push(cd);
  }
  const directoryOffset=offset;
  for(const cd of cds){yield cd;offset+=cd.length;}
  const end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);
  end.writeUInt16LE(cds.length,8);
  end.writeUInt16LE(cds.length,10);
  end.writeUInt32LE(offset-directoryOffset,12);
  end.writeUInt32LE(directoryOffset,16);
  yield end;
 })());
}
