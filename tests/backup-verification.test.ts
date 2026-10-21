import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {seal,wrapRecoveryKey} from "../src/server/backup/crypto";
import {sealedFile,sha,type BackupComponent} from "../src/server/backup/files";
import {inspectBackup,backupInventory} from "../src/server/backup/verification";

async function fixture(options:{legacy?:boolean;brokenLinks?:boolean}={}){
 const root=await mkdtemp(join(tmpdir(),"smn-verify-"));
 const id=randomUUID(),folder=join(root,"packages",id),key=randomBytes(32);
 await mkdir(join(folder,"documents"),{recursive:true});
 const db=await sealedFile(key,Buffer.from("PGDMP-checkpoint"),join(folder,"database.pgcustom.enc"),
  "database.pgcustom.enc");
 const body=Buffer.from("Document privé de test");
 const doc=await sealedFile(key,body,join(folder,"documents","00001.enc"),
  "documents/00001.enc");
 const descriptor={
  id:"note",format:"TXT",teamId:"team",userAuthorized:true,
  sha256:options.brokenLinks?"0".repeat(64):sha(body)
 };
 const descriptorBytes=Buffer.from(JSON.stringify(descriptor));
 const meta=await sealedFile(key,descriptorBytes,join(folder,"documents","00000.enc"),
  "documents/00000.enc");
 const createdAt=new Date().toISOString();
 const manifest={
  version:options.legacy?1:2,id,createdAt,installation:"singleton",
  ...(options.legacy?{}:{installationSource:"singleton:2026-10-20T08:00:00.000Z",
   appVersion:"0.1.0"}),
  schemaVersion:7,postgresVersion:"18.6",
  database:db,documents:[{sourceName:"note.meta.json",...meta},{sourceName:"note.txt",...doc}]
 };
 const payload=Buffer.from(JSON.stringify(manifest));
 const encrypted=seal(key,payload);
 await writeFile(join(folder,"manifest.enc"),encrypted.ciphertext);
 const enveloped=wrapRecoveryKey(key,"Phrase de test sauvegarde très longue et unique !");
 const encryptedManifest:Omit<BackupComponent,"path">={
  sha256:sha(payload),size:payload.length,
  encryptedSha256:sha(encrypted.ciphertext),encryptedSize:encrypted.ciphertext.length,
  nonce:encrypted.nonce,tag:encrypted.tag
 };
 await writeFile(join(folder,"index.json"),JSON.stringify({
  version:1,id,createdAt,encryptedManifest,recovery:enveloped
 }));
 await writeFile(join(root,".backup-key"),key);
 return {root,id,key,folder};
}
describe("SMN-31 — inventaire et preuves d'intégrité",()=>{
 it("vérifie un paquet complet sans jamais revendiquer une restauration",async()=>{
  const f=await fixture();
  try{
   const result=await inspectBackup(f.root,f.id,f.key);
   assert.equal(result.status,"verified");
   assert.equal(result.integrityVerified,true);
   assert.equal(result.restoreTested,false);
   assert.equal(result.applicationVersion,"0.1.0");
   assert.equal(result.installationSource,"singleton:2026-10-20T08:00:00.000Z");
   assert.equal(result.schemaVersion,7);
   assert.equal(result.postgresVersion,"18.6");
   assert.equal(result.documentCount,1);
   assert.equal(result.components.length,3);
   assert.ok(result.components.every(x=>/^[a-f0-9]{64}$/.test(x.encryptedSha256)));
   assert.equal(JSON.stringify(result).includes("Document privé"),false);
   assert.equal(JSON.stringify(result).includes("userAuthorized"),false);
   const inventory=await backupInventory(f.root);
   assert.equal(inventory[0].status,"verified");
   assert.equal(JSON.parse((await readFile(join(f.root,"verification",f.id+".json"))).toString()).restoreTested,false);
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("détecte une altération chiffrée, même si un contrôle antérieur était positif",async()=>{
  const f=await fixture();
  try{
   assert.equal((await inspectBackup(f.root,f.id,f.key)).status,"verified");
   const path=join(f.folder,"database.pgcustom.enc");
   const bytes=await readFile(path);
   bytes[0]^=1;
   await writeFile(path,bytes);
   const result=await inspectBackup(f.root,f.id,f.key);
   assert.equal(result.status,"invalid");
   assert.equal(result.integrityVerified,false);
   assert.equal(result.components.length,0);
   assert.equal((await backupInventory(f.root))[0].status,"invalid");
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("classe un fichier référencé absent comme incomplet",async()=>{
  const f=await fixture();
  try{
   await rm(join(f.folder,"documents","00001.enc"));
   const result=await inspectBackup(f.root,f.id,f.key);
   assert.equal(result.status,"incomplete");
   assert.equal(result.integrityVerified,false);
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("refuse les liens de documents incohérents et les entrées supplémentaires",async()=>{
  const f=await fixture({brokenLinks:true});
  try{
   assert.equal((await inspectBackup(f.root,f.id,f.key)).status,"invalid");
   await writeFile(join(f.folder,"extra.txt"),"non déclaré");
   assert.equal((await inspectBackup(f.root,f.id,f.key)).status,"invalid");
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("ne prétend pas vérifier sans clé locale",async()=>{
  const f=await fixture();
  try{
   const result=await inspectBackup(f.root,f.id,null);
   assert.equal(result.status,"unverifiable");
   assert.equal(result.restoreTested,false);
   await rm(join(f.root,".backup-key"));
   assert.equal((await backupInventory(f.root))[0].status,"unverifiable");
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("garde lisibles les paquets SMN-30 antérieurs sans inventer de version",async()=>{
  const f=await fixture({legacy:true});
  try{
   const result=await inspectBackup(f.root,f.id,f.key);
   assert.equal(result.status,"verified");
   assert.equal(result.applicationVersion,null);
  }finally{await rm(f.root,{recursive:true,force:true});f.key.fill(0);}
 });
 it("retourne un inventaire vide sans répertoire initialisé",async()=>{
  const root=join(tmpdir(),"smn-verify-nonexistent-"+randomUUID());
  assert.deepEqual(await backupInventory(root),[]);
 });
});
