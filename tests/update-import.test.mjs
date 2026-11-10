import assert from "node:assert/strict";
import {test} from "node:test";
import {generateKeyPairSync,randomUUID} from "node:crypto";
import {deflateRawSync} from "node:zlib";
import {mkdtemp,mkdir,writeFile,readFile,cp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {inspectZip,unpackZip} from "../scripts/windows/unpack-update.mjs";
import {enumerateUpdateableFiles,planUpdate,manifestBytes,
  signatureBytes} from "../scripts/windows/update-contract.mjs";
function crc32(buffer){
 let x=0xffffffff;for(const b of buffer){x^=b;for(let i=0;i<8;i++)x=(x>>>1)^((x&1)?0xedb88320:0);}return (x^0xffffffff)>>>0;
}
function zip(items){
 const parts=[],directory=[];let offset=0;
 for(const {name,content,external=0x81a40000} of items){
  const filename=Buffer.from(name),raw=Buffer.isBuffer(content)?content:Buffer.from(content);
  const compressed=deflateRawSync(raw),checksum=crc32(raw);
  const local=Buffer.alloc(30),central=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
  local.writeUInt16LE(8,8);local.writeUInt32LE(checksum,14);
  local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(raw.length,22);
  local.writeUInt16LE(filename.length,26);
  central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(0x0314,4);
  central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);
  central.writeUInt32LE(checksum,16);central.writeUInt32LE(compressed.length,20);
  central.writeUInt32LE(raw.length,24);central.writeUInt16LE(filename.length,28);
  central.writeUInt32LE(external,38);central.writeUInt32LE(offset,42);
  parts.push(local,filename,compressed);
  directory.push(central,filename);
  offset+=local.length+filename.length+compressed.length;
 }
 const directoryData=Buffer.concat(directory),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(items.length,8);
 end.writeUInt16LE(items.length,10);end.writeUInt32LE(directoryData.length,12);
 end.writeUInt32LE(offset,16);
 return Buffer.concat([...parts,directoryData,end]);
}
test("ZIP decoder refuses zip-slip, protected runtime, case aliases and symbolic links",()=>{
 const meta=[{name:"manifest.json",content:"{}"},{name:"manifest.sig",content:"test"}];
 const check=(entry)=>assert.throws(()=>inspectZip(zip([...meta,entry])));
 check({name:"payload/../../data/postgres/PG_VERSION",content:"BAD"});
 check({name:"payload/runtime/node/node.exe",content:"BAD"});
 check({name:"payload/app",content:"shadow directory"});
 check({name:"payload/app/CON.txt",content:"BAD"});
 check({name:"payload/app/evil:stream",content:"BAD"});
 check({name:"payload/app/link",content:"BAD",external:0xa1ff0000});
 // Duplicated file entries are forbidden even if the spelling changes only by case.
 assert.throws(()=>inspectZip(zip([...meta,
  {name:"payload/app/file.js",content:"one"},{name:"payload/app/FILE.js",content:"two"}])),/zip-duplicate/);
});
test("ZIP decoder limits advertised expansion and checks CRC",async()=>{
 const meta=[{name:"manifest.json",content:"{}"},{name:"manifest.sig",content:"test"}];
 const archive=zip([...meta,{name:"payload/app/file.js",content:"safe"}]);
 assert.equal(inspectZip(archive).length,3);
 const root=await mkdtemp(path.join(os.tmpdir(),"smn-zip-check-"));
 try{
  await unpackZip(archive,path.join(root,"safe"));
  assert.equal(await readFile(path.join(root,"safe","payload","app","file.js"),"utf8"),"safe");
  const tampered=Buffer.from(archive);
  // The local file's compressed bytes are changed, while central-directory metadata is not.
  const position=30+Buffer.byteLength("manifest.json");
  tampered[position]^=0x01;
  await assert.rejects(unpackZip(tampered,path.join(root,"bad")));
  const bomb=zip([...meta,{name:"payload/app/bomb.bin",content:Buffer.alloc(65*1024*1024)}]);
  assert.throws(()=>inspectZip(bomb),/zip-entry-invalid/);
 }finally{await rm(root,{recursive:true,force:true})}
});
test("real offline signed update import validates installed base, then detects local drift",async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),"smn-offline-e2e-"));
 const next=path.join(root,"next"),installed=path.join(root,"installed");
 const keys=generateKeyPairSync("ed25519");
 const privatePem=keys.privateKey.export({type:"pkcs8",format:"pem"});
 const publicPem=keys.publicKey.export({type:"spki",format:"pem"});
 const fromVersion="33.0.111",toVersion="33.0.112",commit="b".repeat(40),id=randomUUID(),actor=randomUUID();
 try{
  for(const dir of [installed,next]){
   await mkdir(path.join(dir,"app"),{recursive:true});
   await writeFile(path.join(dir,"app","server.js"),"same server");
  }
  await writeFile(path.join(installed,"app","change.js"),"old");
  await writeFile(path.join(next,"app","change.js"),"new");
  await writeFile(path.join(installed,"distribution-version.json"),
    JSON.stringify({product:"SMN",version:fromVersion,sourceCommit:commit})+"\n");
  await writeFile(path.join(next,"distribution-version.json"),
    JSON.stringify({product:"SMN",version:toVersion,sourceCommit:commit})+"\n");
  await mkdir(path.join(installed,"runtime","trust"),{recursive:true});
  await writeFile(path.join(installed,"runtime","trust","update-signing-public.pem"),publicPem);
  await mkdir(path.join(installed,"data","postgres"),{recursive:true});
  await writeFile(path.join(installed,"data","postgres","sentinel"),"PRIVATE");
  const stage=path.join(installed,"updates","staging",id);
  await mkdir(stage,{recursive:true});
  const oldFiles=await enumerateUpdateableFiles(installed),
    newFiles=await enumerateUpdateableFiles(next);
  const manifest=planUpdate({oldFiles,newFiles,fromVersion,toVersion,sourceCommit:commit,mode:"delta"});
  const entries=[
   {name:"manifest.json",content:manifestBytes(manifest)},
   {name:"manifest.sig",content:signatureBytes(manifest,privatePem).toString("base64")+"\n"}
  ];
  for(const record of manifest.files.filter(x=>x.action==="put"))
   entries.push({name:"payload/"+record.path,
    content:await readFile(path.join(next,...record.path.split("/")))});
  await writeFile(path.join(stage,"incoming.zip"),zip(entries));
  const run=(name)=>spawnSync(process.execPath,[path.resolve("scripts/windows",name),
    "--root",installed,"--id",id,...(name==="import-update.mjs"?["--actor",actor]:[])],
    {encoding:"utf8",timeout:60000});
  const stageRun=run("import-update.mjs");
  assert.equal(stageRun.status,0,stageRun.stderr);
  assert.equal(JSON.parse(stageRun.stdout).toVersion,toVersion);
  const verified=run("verify-staged-update.mjs");
  assert.equal(verified.status,0,verified.stderr);
  assert.equal(await readFile(path.join(installed,"data","postgres","sentinel"),"utf8"),"PRIVATE");
  await writeFile(path.join(installed,"app","server.js"),"user modified");
  const refused=run("verify-staged-update.mjs");
  assert.notEqual(refused.status,0);
  assert.match(refused.stderr,/update-base-inventory-mismatch/);
 }finally{await rm(root,{recursive:true,force:true})}
});

test("Windows external updater replaces application only, retains database and rollback",{
 skip:process.platform!=="win32"
},async()=>{
 const workspace=await mkdtemp(path.join(os.tmpdir(),"smn-updater-cutover-"));
 const installed=path.join(workspace,"SMN"),next=path.join(workspace,"next");
 const keys=generateKeyPairSync("ed25519");
 const privatePem=keys.privateKey.export({type:"pkcs8",format:"pem"});
 const publicPem=keys.publicKey.export({type:"spki",format:"pem"});
 const commit="c".repeat(40),fromVersion="33.0.201",toVersion="33.0.202",
  id=randomUUID(),actor=randomUUID();
 try{
  for(const dir of [installed,next]){
   await mkdir(path.join(dir,"app"),{recursive:true});
   await mkdir(path.join(dir,"scripts","windows"),{recursive:true});
   await writeFile(path.join(dir,"app","server.js"),"server unchanged");
   for(const name of ["update-apply.mjs","verify-staged-update.mjs",
     "update-contract.mjs","distribution-layout.mjs"]){
    await cp(path.resolve("scripts","windows",name),path.join(dir,"scripts","windows",name));
   }
  }
  await writeFile(path.join(installed,"app","feature.js"),"old feature");
  await writeFile(path.join(next,"app","feature.js"),"new feature");
  await writeFile(path.join(installed,"distribution-version.json"),
   JSON.stringify({product:"SMN",version:fromVersion,sourceCommit:commit})+"\n");
  await writeFile(path.join(next,"distribution-version.json"),
   JSON.stringify({product:"SMN",version:toVersion,sourceCommit:commit})+"\n");
  await mkdir(path.join(installed,"runtime","trust"),{recursive:true});
  await writeFile(path.join(installed,"runtime","trust","update-signing-public.pem"),publicPem);
  await mkdir(path.join(installed,"data","postgres"),{recursive:true});
  await writeFile(path.join(installed,"data","postgres","sentinel"),"PERSISTENT DATABASE");
  const stage=path.join(installed,"updates","staging",id);
  await mkdir(stage,{recursive:true});
  const oldFiles=await enumerateUpdateableFiles(installed),
   newFiles=await enumerateUpdateableFiles(next);
  const manifest=planUpdate({oldFiles,newFiles,fromVersion,toVersion,sourceCommit:commit,mode:"delta"});
  const archive=zip([
   {name:"manifest.json",content:manifestBytes(manifest)},
   {name:"manifest.sig",content:signatureBytes(manifest,privatePem).toString("base64")+"\n"},
   ...await Promise.all(manifest.files.filter(f=>f.action==="put").map(async file=>({
    name:"payload/"+file.path,content:await readFile(path.join(next,...file.path.split("/")))
   })))
  ]);
  await writeFile(path.join(stage,"incoming.zip"),archive);
  const imported=spawnSync(process.execPath,[path.resolve("scripts/windows/import-update.mjs"),
   "--root",installed,"--id",id,"--actor",actor],{encoding:"utf8",timeout:120000});
  assert.equal(imported.status,0,imported.stderr);
  const preview=JSON.parse(imported.stdout);
  await writeFile(path.join(installed,"updates","pending.json"),
   JSON.stringify({id,nonce:preview.nonce,actor,version:toVersion,
    approvedAt:new Date().toISOString()})+"\n");
  const updater=spawnSync(process.execPath,[path.join(installed,"scripts","windows","update-apply.mjs")],
   {cwd:installed,encoding:"utf8",timeout:180000});
  assert.equal(updater.status,0,updater.stderr);
  assert.equal(await readFile(path.join(installed,"app","feature.js"),"utf8"),"new feature");
  assert.equal(await readFile(path.join(installed,"data","postgres","sentinel"),"utf8"),
    "PERSISTENT DATABASE");
  assert.equal(await readFile(path.join(installed,"updates","rollback",id,"app","feature.js"),"utf8"),
    "old feature");
  const result=JSON.parse(await readFile(path.join(installed,"updates","status.json"),"utf8"));
  assert.equal(result.state,"succeeded");
  assert.equal(result.version,toVersion);
 }finally{await rm(workspace,{recursive:true,force:true,maxRetries:8,retryDelay:500})}
});
