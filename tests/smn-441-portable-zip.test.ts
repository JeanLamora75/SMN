import assert from "node:assert/strict";
import {test} from "node:test";
import {Readable} from "node:stream";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {extractSmnEncryptedZip} from "../src/server/backup/portable-zip-reader";
import {wrapEncryptedBackupInZip} from "../src/server/backup/portable-zip";
const id="39b6262d-5f27-4bf8-a005-701dfd9cd9a2";
test("SMN-441: exports a standard single-file ZIP with encrypted TAR.GZ payload",async()=>{
 const payload=Buffer.from("encrypted-test-bytes");
 const chunks:Buffer[]=[];
 for await(const value of wrapEncryptedBackupInZip(Readable.from([payload]),id))
  chunks.push(Buffer.from(value));
 const zip=Buffer.concat(chunks);
 assert.equal(zip.readUInt32LE(0),0x04034b50);
 assert.equal(zip.readUInt16LE(8),0,"No second compression");
 assert.equal(zip.readUInt16LE(6),8,"Uses streaming descriptor");
 const nameLen=zip.readUInt16LE(26);
 const start=30+nameLen;
 assert.equal(zip.subarray(30,start).toString(),"SMN-backup-"+id+".tar.gz");
 assert.equal(zip.subarray(start,start+payload.length).toString(),payload.toString());
 const descriptor=start+payload.length;
 assert.equal(zip.readUInt32LE(descriptor),0x08074b50);
 assert.equal(zip.readUInt32LE(descriptor+8),payload.length);
 assert.equal(zip.readUInt32LE(descriptor+12),payload.length);
 assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);
 assert.equal(zip.readUInt16LE(zip.length-22+10),1);
});
test("SMN-441: rejects untrusted filenames",()=>assert.throws(
 ()=>wrapEncryptedBackupInZip(Readable.from([]),"../../evil"),/archive-invalid/
));

test("SMN-442: uploads the matching ZIP and rejects changed member bytes",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-zip-test-"));
 const file=join(root,"in.zip"),target=join(root,"inner.tar.gz");
 try{
  const chunks:Buffer[]=[];
  const payload=Buffer.from("encrypted-test-bytes-with-enough-length");
  for await(const part of wrapEncryptedBackupInZip(Readable.from([payload]),id))
   chunks.push(Buffer.from(part));
  const zipped=Buffer.concat(chunks);
  await writeFile(file,zipped);
  const verified=await extractSmnEncryptedZip(file,target);
  assert.equal(verified.archiveId,id);
  assert.deepEqual(await readFile(target),payload);
  await rm(target);
  const changed=Buffer.from(zipped);
  const index=30+Buffer.byteLength("SMN-backup-"+id+".tar.gz");
  changed[index]^=1;
  await writeFile(file,changed);
  await assert.rejects(extractSmnEncryptedZip(file,target),/checksum-invalid/);
 }finally{await rm(root,{recursive:true,force:true});}
});
