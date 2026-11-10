import assert from "node:assert/strict";
import {test} from "node:test";
import {generateKeyPairSync} from "node:crypto";
import {mkdtemp,mkdir,writeFile,readFile,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {enumerateUpdateableFiles,planUpdate,manifestBytes,signatureBytes,
  verifySignedManifest,requireCompatibleBase,verifyUpdatePayload} from "../scripts/windows/update-contract.mjs";

const KEYPAIR=generateKeyPairSync("ed25519");
const PRIV=KEYPAIR.privateKey.export({type:"pkcs8",format:"pem"});
const PUB=KEYPAIR.publicKey.export({type:"spki",format:"pem"});
const COMMIT="a".repeat(40);
async function fixture(){
  const root=await mkdtemp(path.join(os.tmpdir(),"smn-update-"));
  const old=path.join(root,"old"),next=path.join(root,"new"),stage=path.join(root,"stage");
  for(const folder of [old,next]){
    await mkdir(path.join(folder,"app"),{recursive:true});
    await mkdir(path.join(folder,"data","postgres"),{recursive:true});
    await mkdir(path.join(folder,"runtime","node"),{recursive:true});
    await writeFile(path.join(folder,"app","server.js"),"stable server");
    await writeFile(path.join(folder,"data","postgres","private.db"),"SECRET DB");
    await writeFile(path.join(folder,"runtime","node","node.exe"),"NODE RUNTIME");
  }
  await writeFile(path.join(old,"app","changed.js"),"old version");
  await writeFile(path.join(next,"app","changed.js"),"new version");
  await writeFile(path.join(old,"app","obsolete.js"),"to be deleted");
  await writeFile(path.join(next,"app","new.js"),"new content");
  await writeFile(path.join(old,"distribution-version.json"),
    JSON.stringify({product:"SMN",version:"33.0.1",sourceCommit:COMMIT}));
  await writeFile(path.join(next,"distribution-version.json"),
    JSON.stringify({product:"SMN",version:"33.0.2",sourceCommit:COMMIT}));
  return {root,old,next,stage};
}
test("AC1/AC2/AC3: signed delta contains changed application files and removals only",async()=>{
  const f=await fixture();
  try{
    const before=await enumerateUpdateableFiles(f.old);
    const after=await enumerateUpdateableFiles(f.next);
    const m=planUpdate({oldFiles:before,newFiles:after,fromVersion:"33.0.1",
      toVersion:"33.0.2",sourceCommit:COMMIT,mode:"delta"});
    assert.deepEqual(m.files.filter(x=>x.path.startsWith("app/")).map(x=>x.path).sort(),
      ["app/changed.js","app/new.js","app/obsolete.js"]);
    assert(!m.files.some(x=>/(data|runtime|private.db|node.exe)/.test(x.path)));
    assert.equal(m.files.find(x=>x.path==="app/obsolete.js").action,"delete");
    assert(requireCompatibleBase(m,"33.0.1",before));
    assert.throws(()=>requireCompatibleBase(m,"33.0.0",before),/update-from-version-mismatch/);
    const corrupted=new Map(before);
    corrupted.set("app/changed.js",{...corrupted.get("app/changed.js"),sha256:"f".repeat(64)});
    assert.throws(()=>requireCompatibleBase(m,"33.0.1",corrupted),/update-base-inventory-mismatch/);
    const unchanged=new Map(before);
    unchanged.set("app/server.js",{...unchanged.get("app/server.js"),sha256:"b".repeat(64)});
    assert.throws(()=>requireCompatibleBase(m,"33.0.1",unchanged),/update-base-inventory-mismatch/);
    const bytes=manifestBytes(m),sig=signatureBytes(m,PRIV);
    assert.deepEqual(verifySignedManifest(bytes,sig,PUB),m);
    assert.throws(()=>verifySignedManifest(Buffer.from(bytes.toString().replace("33.0.2","33.0.3")),sig,PUB),
      /update-signature-invalid/);
    const another=generateKeyPairSync("ed25519").publicKey.export({type:"spki",format:"pem"});
    assert.throws(()=>verifySignedManifest(bytes,sig,another),/update-signature-invalid/);
  }finally{await rm(f.root,{recursive:true,force:true})}
});
test("AC4/AC5: real builder and read-only offline verifier reject changed payload",async()=>{
  const f=await fixture();
  try{
    const run=(file,args,env={})=>spawnSync(process.execPath,[file,...args],{
      cwd:process.cwd(),encoding:"utf8",env:{...process.env,...env}});
    const builder=path.resolve("scripts/windows/build-update.mjs");
    const verify=path.resolve("scripts/windows/verify-update.mjs");
    const built=run(builder,["--target",f.next,"--base",f.old,"--out",f.stage,
      "--mode","delta","--commit",COMMIT],{
        SMN_UPDATE_SIGNING_KEY_PEM_B64:Buffer.from(PRIV).toString("base64")});
    assert.equal(built.status,0,built.stderr);
    await writeFile(path.join(f.root,"pub.pem"),PUB);
    const args=["--dir",f.stage,"--trust",path.join(f.root,"pub.pem"),"--base",f.old];
    const verified=run(verify,args);
    assert.equal(verified.status,0,verified.stderr);
    const manifest=JSON.parse(await readFile(path.join(f.stage,"manifest.json"),"utf8"));
    assert(await verifyUpdatePayload(f.stage,manifest));
    await writeFile(path.join(f.stage,"payload","app","changed.js"),"tampered!");
    const failed=run(verify,args);
    assert.notEqual(failed.status,0,"Must refuse modified update content");
    assert.match(failed.stderr,/update-payload-integrity-failed/);
  }finally{await rm(f.root,{recursive:true,force:true})}
});
test("AC2: rejects dangerous destination paths and unsigned releases",async()=>{
  const f=await fixture();
  try{
    const before=await enumerateUpdateableFiles(f.old);
    assert(![...before.values()].some(x=>x.path.startsWith("data/")||x.path.startsWith("runtime/")));
    const result=spawnSync(process.execPath,["scripts/windows/build-update.mjs",
      "--target",f.next,"--out",f.stage,"--mode","full","--from","33.0.1",
      "--commit",COMMIT],{encoding:"utf8",env:{...process.env,
        SMN_UPDATE_SIGNING_KEY_PEM_B64:""}});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/update-signing-key-missing/);
    assert.throws(()=>planUpdate({oldFiles:before,newFiles:before,fromVersion:"33.0.1",
      toVersion:"33.0.1",sourceCommit:COMMIT,mode:"delta"}),/update-version-not-advanced/);
  }finally{await rm(f.root,{recursive:true,force:true})}
});
