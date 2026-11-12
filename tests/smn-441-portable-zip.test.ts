import assert from "node:assert/strict";
import {test} from "node:test";
import {Readable} from "node:stream";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {extractSmnEncryptedZip} from "../src/server/backup/portable-zip-reader";
import {wrapEncryptedBackupInZip} from "../src/server/backup/portable-zip";
import {wrapPortableTransferZip} from "../src/server/backup/portable-transfer-zip";
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
  const payload=Buffer.from("encrypted-test-bytes-with-enough-length-to-pass-the-minimum");
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

test("SMN-441/442: complete transfer ZIP preserves a signed receipt and encrypted ledger",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-transfer-v2-"));
 const input=join(root,"transfer.zip"),output=join(root,"payload.tar.gz");
 try{
  const payload=Buffer.from("encrypted tar gzip content represents v4 backup");
  const receipt=Buffer.from('{"purpose":"frozen-current-state-migration","mac":"secret"}');
  const ledger=Buffer.from('{"purpose":"migration-erasure-evidence","ciphertext":"protected"}');
  const parts:Buffer[]=[];
  for await(const part of wrapPortableTransferZip(
   Readable.from([payload]),id,[
    {name:"migration-receipt.json",data:receipt},
    {name:"privacy-ledger.enc",data:ledger}
   ]))parts.push(Buffer.from(part));
  await writeFile(input,Buffer.concat(parts));
  const result=await extractSmnEncryptedZip(input,output);
  assert.equal(result.archiveId,id);
  assert.equal(result.hasTransferEvidence,true);
  assert.deepEqual(await readFile(output),payload);
  assert.deepEqual(await readFile(result.receiptPath!),receipt);
  assert.deepEqual(await readFile(result.ledgerPath!),ledger);
 }finally{await rm(root,{recursive:true,force:true});}
});

test("SMN-442: malformed ZIP boundaries are rejected and leave no extracted archive",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-zip-negative-"));
 const source=join(root,"input.zip"),output=join(root,"extracted.tar.gz");
 const payload=Buffer.from("synthetic encrypted archive with bounded content");
 const chunks:Buffer[]=[];
 try{
  for await(const chunk of wrapEncryptedBackupInZip(Readable.from([payload]),id))
   chunks.push(Buffer.from(chunk));
  const original=Buffer.concat(chunks);
  const nameBytes=Buffer.byteLength("SMN-backup-"+id+".tar.gz");
  const dataStart=30+nameBytes;
  const descriptor=dataStart+payload.length;
  const central=descriptor+16;
  const cases:{name:string;edit:(b:Buffer)=>Buffer;error:RegExp}[]=[
   {name:"unexpected leading entry signature",edit:b=>{b.writeUInt32LE(0xdeadbeef,0);return b;},error:/migration-zip-local-untrusted/},
   {name:"unknown compression method",edit:b=>{b.writeUInt16LE(8,8);return b;},error:/migration-zip-local-untrusted/},
   {name:"central directory member size changed",edit:b=>{b.writeUInt32LE(payload.length+1,central+20);return b;},error:/migration-zip-compressed-member|migration-zip-descriptor-invalid/},
   {name:"CRC32 mismatch",edit:b=>{b[dataStart]^=1;return b;},error:/migration-zip-checksum-invalid/},
   {name:"missing end-of-central-directory",edit:b=>b.subarray(0,-22),error:/migration-zip-footer-invalid/},
   {name:"appended bytes after footer",edit:b=>Buffer.concat([b,Buffer.from("garbage")]),error:/migration-zip-footer-invalid/},
   {name:"unexpected ZIP member filename",edit:b=>{b[central+46]^=1;return b;},error:/migration-zip-entry-untrusted/}
  ];
  for(const scenario of cases){
   const corrupted=scenario.edit(Buffer.from(original));
   await writeFile(source,corrupted);
   await assert.rejects(extractSmnEncryptedZip(source,output),scenario.error,scenario.name);
   await assert.rejects(readFile(output),{code:"ENOENT"},scenario.name+" should clean up extracted data");
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
