import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomBytes,createHash} from "node:crypto";
import {mkdtemp,rm,writeFile,readFile,readdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {seal,unseal,wrapRecoveryKey,recoverKey} from "../src/server/backup/crypto";
import {scanDocuments,encryptDocuments,privateFolder,sha,outsideApp} from "../src/server/backup/files";

describe("SMN-30 — chiffrer et récupérer la clé d'un paquet",()=>{
 it("chiffre l'ensemble des octets et refuse une clé incorrecte",()=>{
  const key=randomBytes(32),data=Buffer.from("Données personnelles à garder privées");
  const encrypted=seal(key,data);
  assert.notEqual(encrypted.ciphertext.toString("hex"),data.toString("hex"));
  assert.deepEqual(unseal(key,encrypted),data);
  assert.throws(()=>unseal(randomBytes(32),encrypted));
  assert.throws(()=>unseal(key,{...encrypted,tag:"00".repeat(16)}));
  assert.notEqual(seal(key,data).nonce,encrypted.nonce);
 });
 it("inclut la récupération de la clé sans inclure la phrase ni la clé brute",()=>{
  const key=randomBytes(32),phrase="Phrase unique de récupération SMN 2026 !";
  const envelope=wrapRecoveryKey(key,phrase);
  assert.deepEqual(recoverKey(envelope,phrase),key);
  assert.doesNotMatch(JSON.stringify(envelope),/Phrase unique|[Pp]assword/);
  assert.equal(JSON.stringify(envelope).includes(key.toString("hex")),false);
  assert.throws(()=>recoverKey(envelope,"Phrase incorrecte mais suffisamment longue !"));
  assert.throws(()=>wrapRecoveryKey(key,"short"));
  assert.throws(()=>wrapRecoveryKey(key,"Phrase très longue contenant\nune coupure"));
 });
});
describe("SMN-30 — fichiers réels et cohérence du jeu",()=>{
 it("n'invente pas de pièce sans stockage configuré",async()=>{
  assert.deepEqual(await scanDocuments(undefined),[]);
 });
 it("copie sous chiffrement les fichiers et leur manifeste, sans exposer le contenu",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-backup-docs-"));
  const output=await mkdtemp(join(tmpdir(),"smn-backup-out-"));
  try{
   const txt=Buffer.from("Équipe Scrum — rétrospective");
   const manifest=Buffer.from(JSON.stringify({
    id:"brief-1",teamId:"team",format:"TXT",userAuthorized:true,
    sha256:createHash("sha256").update(txt).digest("hex")
   }));
   await writeFile(join(root,"brief-1.txt"),txt);
   await writeFile(join(root,"brief-1.meta.json"),manifest);
   const scan=await scanDocuments(root);
   assert.equal(scan.length,2);
   const key=randomBytes(32),items=await encryptDocuments(root,scan,join(output,"encrypted"),key);
   assert.equal(items.length,2);
   for(let i=0;i<items.length;i++){
    const name=String(i).padStart(5,"0")+".enc";
    const encrypted=await readFile(join(output,"encrypted",name));
    assert.equal(sha(encrypted),items[i].encryptedSha256);
    assert.notEqual(encrypted.toString("utf8"),scan[i].name);
    assert.deepEqual(unseal(key,{ciphertext:encrypted,nonce:items[i].nonce,tag:items[i].tag}),
      await readFile(join(root,scan[i].name)));
   }
   assert.equal((await readdir(join(output,"encrypted"))).length,2);
  }finally{await rm(root,{recursive:true,force:true});await rm(output,{recursive:true,force:true});}
 });
 it("refuse un fichier isolé, un manifeste incohérent ou un ajout non reconnu",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-backup-bad-"));
  try{
   await writeFile(join(root,"file.txt"),"orphan");
   await assert.rejects(()=>scanDocuments(root),/orphan/);
   await writeFile(join(root,"file.meta.json"),JSON.stringify({
    id:"file",teamId:"team",format:"TXT",userAuthorized:true,sha256:"0".repeat(64)
   }));
   await assert.rejects(()=>scanDocuments(root),/inconsistent/);
   await writeFile(join(root,"extraneous.bin"),"secret");
   await assert.rejects(()=>scanDocuments(root),/unrecognized/);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("refuse les chemins de sauvegarde dans le dépôt et les chemins relatifs",async()=>{
  assert.equal(outsideApp("."),false);
  assert.equal(outsideApp(join(process.cwd(),"public","backups")),false);
  assert.equal(outsideApp("relative-dir"),false);
  await assert.rejects(()=>privateFolder(process.cwd()),/private-directory/);
 });
});
