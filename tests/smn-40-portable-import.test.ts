import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash,randomBytes} from "node:crypto";
import {mkdtemp,mkdir,readFile,rm,writeFile,lstat} from "node:fs/promises";
import {createWriteStream} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {seal,wrapRecoveryKey} from "../src/server/backup/crypto";
import {inspectBackup} from "../src/server/backup/verification";
import {streamPortableBackup} from "../src/server/backup/portable-package";
import {importPortableBackup} from "../src/server/backup/portable-import";

const id="39b6262d-5f27-4bf8-a005-701dfd9cd9a2";
const phrase="long portable restore phrase 2026 validated";
const sha=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
function encrypted(key:Buffer,clear:Buffer,path:string){
 const data=seal(key,clear);
 return {meta:{path,size:clear.length,sha256:sha(clear),
  encryptedSize:data.ciphertext.length,encryptedSha256:sha(data.ciphertext),
  nonce:data.nonce,tag:data.tag},bytes:data.ciphertext};
}
test("encrypted portable export can be received in a pristine backup store",
 {timeout:120000},async()=>{
 const temp=await mkdtemp(join(tmpdir(),"smn-portable-test-"));
 const source=join(temp,"source"),target=join(temp,"destination");
 const old=process.env.SMN_BACKUP_DIR;
 const key=randomBytes(32);
 try{
  const folder=join(source,"packages",id);
  await mkdir(folder,{recursive:true});
  const db=encrypted(key,Buffer.concat([Buffer.from("PGDMP"),randomBytes(40)]),
   "database.pgcustom.enc");
  const createdAt="2026-11-11T18:27:39.087Z";
  const manifest={
   version:4,id,createdAt,installation:"singleton",
   installationSource:"singleton:2026-11-01T00:00:00.000Z",
   appVersion:"1.0.0",schemaVersion:33,postgresVersion:"18.6",
   database:db.meta,documents:[],reportPdfs:[],officeReports:[],
   officeTemplates:[],consistency:{method:"wal-fence-v1",walLsn:"0/0"}
  };
  const encryptedManifest=encrypted(key,Buffer.from(JSON.stringify(manifest)),"manifest.enc");
  const index={
   version:1,id,createdAt,
   encryptedManifest:{
    sha256:encryptedManifest.meta.sha256,size:encryptedManifest.meta.size,
    encryptedSha256:encryptedManifest.meta.encryptedSha256,
    encryptedSize:encryptedManifest.meta.encryptedSize,
    nonce:encryptedManifest.meta.nonce,tag:encryptedManifest.meta.tag
   },
   recovery:wrapRecoveryKey(key,phrase)
  };
  await writeFile(join(folder,"database.pgcustom.enc"),db.bytes);
  await writeFile(join(folder,"manifest.enc"),encryptedManifest.bytes);
  await writeFile(join(folder,"index.json"),JSON.stringify(index));
  const verified=await inspectBackup(source,id,key);
  assert.equal(verified.status,"verified",verified.reason??"");
  const transport=join(temp,"transfer.tar.gz");
  await pipeline(await streamPortableBackup(source,verified),
   createWriteStream(transport,{flags:"wx"}));
  process.env.SMN_BACKUP_DIR=target;
  await assert.rejects(importPortableBackup(transport,id,"incorrect phrase with adequate length"),
   /portable-import-blocked/);
  await assert.rejects(lstat(target),{code:"ENOENT"});
  const imported=await importPortableBackup(transport,id,phrase);
  assert.equal(imported.mode,"encrypted-package-imported");
  assert.equal(imported.restorationAuthorized,false);
  const restored=await inspectBackup(target,id,key);
  assert.equal(restored.status,"verified",restored.reason??"");
  const localKey=await readFile(join(target,".backup-key"));
  assert.equal(localKey.equals(key),true);
  localKey.fill(0);
  await assert.rejects(importPortableBackup(transport,id,phrase),/portable-destination-not-pristine/);
 }finally{
  key.fill(0);
  if(old===undefined)delete process.env.SMN_BACKUP_DIR;
  else process.env.SMN_BACKUP_DIR=old;
  await rm(temp,{recursive:true,force:true});
 }
});
