import {test} from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,writeFile,readFile,rename,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {enumerateUpdateableFiles,planUpdate,manifestBytes,signatureBytes,
 verifySignedManifest,installedVersionPath,isMinimalLayout} from "../scripts/windows/update-contract.mjs";
import {beginCutover,readCutover,recoverCutover} from "../scripts/windows/update-transaction.mjs";
const commit="d".repeat(40);
async function fixture(){
 const dir=await mkdtemp(path.join(os.tmpdir(),"smn-minimal-update-"));
 const base=path.join(dir,"base"),next=path.join(dir,"next");
 for(const root of [base,next]){
  for(const sub of ["app/maintenance/windows","runtime/node","data/postgres","updates"])
   await mkdir(path.join(root,sub),{recursive:true});
  await writeFile(path.join(root,"app","server.js"),"stable");
  await writeFile(path.join(root,"runtime","node","node.exe"),"node");
  await writeFile(path.join(root,"data","postgres","sentinel"),"PRESERVED");
 }
 await writeFile(path.join(base,"app","distribution-version.json"),JSON.stringify({product:"SMN",version:"33.0.10",sourceCommit:commit}));
 await writeFile(path.join(next,"app","distribution-version.json"),JSON.stringify({product:"SMN",version:"33.0.11",sourceCommit:commit}));
 await writeFile(path.join(base,"app","maintenance","windows","runner.mjs"),"OLD");
 await writeFile(path.join(next,"app","maintenance","windows","runner.mjs"),"NEW");
 return {dir,base,next};
}
test("minimal layout signs and inventories app-only changes, protects runtime and data",async()=>{
 const f=await fixture();
 try{
  assert(isMinimalLayout(f.base));
  assert.equal(installedVersionPath(f.base),path.join(f.base,"app","distribution-version.json"));
  const old=await enumerateUpdateableFiles(f.base),now=await enumerateUpdateableFiles(f.next);
  const manifest=planUpdate({oldFiles:old,newFiles:now,fromVersion:"33.0.10",toVersion:"33.0.11",sourceCommit:commit,mode:"delta"});
  assert.deepEqual(manifest.files.map(x=>x.path).sort(),[
   "app/distribution-version.json","app/maintenance/windows/runner.mjs"]);
  assert(manifest.files.every(x=>x.path.startsWith("app/")));
  const keys=generateKeyPairSync("ed25519");
  const signed=manifestBytes(manifest);
  assert.deepEqual(verifySignedManifest(signed,signatureBytes(manifest,keys.privateKey),
    keys.publicKey.export({type:"spki",format:"pem"})),manifest);
 }finally{await rm(f.dir,{recursive:true,force:true})}
});
test("minimal layout interrupted app directory exchange is recovered without private data changes",async()=>{
 const f=await fixture();
 const root=f.base,id=randomUUID();
 try{
  const prepared=path.join(root,"updates","prepared",id);
  const rollback=path.join(root,"updates","rollback",id);
  await mkdir(prepared,{recursive:true});await mkdir(rollback,{recursive:true});
  await mkdir(path.join(prepared,"app"),{recursive:true});
  await writeFile(path.join(prepared,"app","distribution-version.json"),"NEW");
  const journal=await beginCutover(root,id,"33.0.11");
  assert.deepEqual(journal.entries.map(x=>x.name),["app"]);
  await rename(path.join(root,"app"),path.join(rollback,"app"));
  assert.deepEqual((await readCutover(root)).entries.map(x=>x.name),["app"]);
  await rename(path.join(prepared,"app"),path.join(root,"app"));
  assert.equal(await recoverCutover(root),"recovered");
  assert.equal((await readFile(path.join(root,"app","distribution-version.json"),"utf8")).includes("33.0.10"),true);
  assert.equal(await readFile(path.join(root,"data","postgres","sentinel"),"utf8"),"PRESERVED");
  assert.equal(await recoverCutover(root),"recovered");
 }finally{await rm(f.dir,{recursive:true,force:true})}
});
