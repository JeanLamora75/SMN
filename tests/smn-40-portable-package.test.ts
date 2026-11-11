import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {gunzipSync} from "node:zlib";
import {portableFileNames,streamPortableBackup} from "../src/server/backup/portable-package";
import type {BackupInventoryEntry} from "../src/server/backup/verification";

const id="39b6262d-5f27-4bf8-a005-701dfd9cd9a2";
const item:BackupInventoryEntry={
 id,createdAt:"2026-11-11T18:27:39.087Z",status:"verified",
 reason:null,checkedAt:"2026-11-11T19:00:00.000Z",
 installationSource:"singleton:2026-11-01T00:00:00.000Z",
 applicationVersion:"1.0.0",schemaVersion:33,postgresVersion:"18.6",
 components:[{path:"database.pgcustom.enc",kind:"database",size:2,
  encryptedSize:7,encryptedSha256:"a".repeat(64)}],
 documentCount:0,integrityVerified:true,scopeComplete:true,restoreTested:false
};
test("encrypted package export includes recovery metadata and no local key",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-migration-export-"));
 const base=join(root,"packages",id);
 try{
  await mkdir(base,{recursive:true});
  await writeFile(join(base,"index.json"),"INDEX");
  await writeFile(join(base,"manifest.enc"),"MANIFEST");
  await writeFile(join(base,"database.pgcustom.enc"),"CIPHER7");
  await writeFile(join(base,".backup-key"),"PRIVATE KEY MUST NEVER BE SENT");
  const s=await streamPortableBackup(root,item);
  const chunks:Buffer[]=[];
  for await(const c of s)chunks.push(c as Buffer);
  const tar=gunzipSync(Buffer.concat(chunks));
  const names:string[]=[];
  let offset=0;
  while(offset<tar.length-1024){
   const head=tar.subarray(offset,offset+512);
   const name=head.subarray(0,100).toString("ascii").replace(/\0.*$/,"");
   if(!name)break;
   names.push(name);
   const size=parseInt(head.subarray(124,136).toString("ascii").replace(/\0.*$/,"").trim(),8);
   assert.ok(Number.isSafeInteger(size));
   offset+=512+Math.ceil(size/512)*512;
  }
  assert.deepEqual(names,["database.pgcustom.enc","index.json","manifest.enc"]);
  assert.doesNotMatch(tar.toString("utf8"),/PRIVATE KEY MUST NEVER BE SENT/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("reject path traversal, missing database and nonverified archive",()=>{
 assert.throws(()=>portableFileNames({...item,components:[]}),/untrusted/);
 assert.throws(()=>portableFileNames({...item,status:"invalid"}),/unverified/);
 assert.throws(()=>portableFileNames({...item,components:[
  item.components[0],{...item.components[0],path:"../secret"}
 ]}),/untrusted/);
});
