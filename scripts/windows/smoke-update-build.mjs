// Windows CI-only end-to-end delta proof, using an ephemeral test key.
// Never publish this test-signed package as a production update.
import { generateKeyPairSync } from "node:crypto";
import { cp, writeFile, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
const target=path.resolve(process.env.SMN_PACKAGE_DIR??"_package/SMN-Windows");
const root=path.dirname(target);
const base=path.join(root,"smoke-old"),out=path.join(root,"smoke-stage");
const pubFile=path.join(root,"smoke-public-test-only.pem");
const versionFile=path.join(target,"distribution-version.json");
const marker=JSON.parse(await readFile(versionFile,"utf8"));
const patch=Number(marker.version.split(".")[2]);
if(!Number.isSafeInteger(patch)||patch<1)throw Error("update-smoke-version-invalid");
const oldVersion="33.0."+(patch-1);
const original=await readFile(path.join(target,"app","server.js"),"utf8");
const {privateKey,publicKey}=generateKeyPairSync("ed25519");
const privatePem=privateKey.export({type:"pkcs8",format:"pem"});
const publicPem=publicKey.export({type:"spki",format:"pem"});
function call(file,args,env={}) {
  const result=spawnSync(process.execPath,[file,...args],{encoding:"utf8",
    env:{...process.env,...env},maxBuffer:8*1024*1024});
  if(result.status!==0)throw Error("update-smoke-failed: "+result.stderr.slice(-3500));
  return result.stdout;
}
await cp(target,base,{recursive:true,errorOnExist:true,force:false});
await writeFile(path.join(base,"app","server.js"),original+"\n// synthetic CI difference\n");
await writeFile(path.join(base,"distribution-version.json"),
  JSON.stringify({...marker,version:oldVersion})+"\n");
await writeFile(pubFile,publicPem,{flag:"wx"});
const privateB64=Buffer.from(privatePem).toString("base64");
try{
  const result=call("scripts/windows/build-update.mjs",
    ["--target",target,"--base",base,"--out",out,"--mode","delta"],
    {SMN_UPDATE_SIGNING_KEY_PEM_B64:privateB64});
  const manifest=JSON.parse(await readFile(path.join(out,"manifest.json"),"utf8"));
  if(manifest.files.length!==2 || !manifest.files.some(x=>x.path==="app/server.js") ||
      !manifest.files.some(x=>x.path==="distribution-version.json"))
    throw Error("update-smoke-diff-unexpected");
  call("scripts/windows/verify-update.mjs",["--dir",out,"--trust",pubFile,"--base",base]);
  const bytes=manifest.files.reduce((n,file)=>n+file.size,0);
  if(bytes>=25*1024*1024)throw Error("update-smoke-small-delta-exceeds-25MiB");
  console.log("PASS: signed synthetic small update, delta payload bytes: "+bytes);
  console.log("PASS: no DB or runtime shipped; offline Ed25519 verification passed");
  // Also verify the application-only full mode on the exact same real build.
  // This artifact uses an ephemeral test key and must never be published.
  const fullStage=path.join(root,"smoke-full-stage");
  call("scripts/windows/build-update.mjs",[
    "--target",target,"--out",fullStage,"--mode","full",
    "--from",oldVersion],{SMN_UPDATE_SIGNING_KEY_PEM_B64:privateB64});
  call("scripts/windows/verify-update.mjs",["--dir",fullStage,"--trust",pubFile]);
  const fullManifest=JSON.parse(await readFile(path.join(fullStage,"manifest.json"),"utf8"));
  if(fullManifest.mode!=="full" || !fullManifest.files.some(e=>e.path==="app/server.js") ||
      fullManifest.files.some(e=>e.path.startsWith("runtime/")||e.path.startsWith("data/")))
    throw Error("update-smoke-full-unexpected");
  console.log("PASS: full application-only update validated, files: "+fullManifest.files.length);
}finally{
  await rm(base,{recursive:true,force:true,maxRetries:4,retryDelay:200});
}
