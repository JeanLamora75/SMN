import {Readable} from "node:stream";

/** Streaming, strictly single-entry ZIP wrapper around the existing encrypted
 * portable TAR.GZ. Uses ZIP method STORE (no second compression), data
 * descriptor and classic ZIP32. No plaintext or key leaves the backup.
 * Files >= 4 GiB are refused, never silently truncated.
 */
const TABLE=Array.from({length:256},(_,n)=>{
 let c=n;
 for(let i=0;i<8;i++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
 return c>>>0;
});
const MAX_ZIP32=0xffffffff;
function crc32(crc:number,bytes:Buffer):number{
 let value=crc;
 for(const b of bytes)value=TABLE[(value^b)&255]^(value>>>8);
 return value>>>0;
}
export function wrapEncryptedBackupInZip(
 source:Readable,archiveId:string
):Readable{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(archiveId))
  throw Error("portable-zip-archive-invalid");
 const name=Buffer.from("SMN-backup-"+archiveId+".tar.gz","ascii");
 const local=Buffer.alloc(30+name.length);
 local.writeUInt32LE(0x04034b50,0);
 local.writeUInt16LE(20,4);local.writeUInt16LE(8,6);
 local.writeUInt16LE(0,8);local.writeUInt16LE(name.length,26);
 name.copy(local,30);
 return Readable.from((async function*(){
  yield local;
  let crc=0xffffffff,size=0;
  for await(const chunk of source){
   const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
   size+=bytes.length;
   if(size>MAX_ZIP32-120-name.length)
    throw Error("portable-zip-too-large");
   crc=crc32(crc,bytes);
   yield bytes;
  }
  crc=(crc^0xffffffff)>>>0;
  const desc=Buffer.alloc(16);
  desc.writeUInt32LE(0x08074b50,0);
  desc.writeUInt32LE(crc,4);
  desc.writeUInt32LE(size,8);desc.writeUInt32LE(size,12);
  yield desc;
  const cd=Buffer.alloc(46+name.length);
  cd.writeUInt32LE(0x02014b50,0);
  cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);
  cd.writeUInt16LE(8,8);cd.writeUInt16LE(0,10);
  cd.writeUInt32LE(crc,16);cd.writeUInt32LE(size,20);
  cd.writeUInt32LE(size,24);cd.writeUInt16LE(name.length,28);
  name.copy(cd,46);
  yield cd;
  const end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);
  end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
  end.writeUInt32LE(cd.length,12);
  end.writeUInt32LE(local.length+size+desc.length,16);
  yield end;
 })());
}
