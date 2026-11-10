// Verified staging of an untrusted update. Does not modify application data.
// CLI is invoked only by an authenticated, local-only administrator API.
import {readFile,writeFile,lstat,mkdir,rm,readdir} from "node:fs/promises";
import {createHash,randomBytes} from "node:crypto";
import path from "node:path";
import {unpackZip} from "./unpack-update.mjs";
import {verifySignedManifest,verifyUpdatePayload,
  enumerateUpdateableFiles,requireCompatibleBase,installedVersionPath} from "./update-contract.mjs";
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf("--"+name);return i<0?null:args[i+1];}
const root=path.resolve(arg("root")??"."),id=arg("id"),actor=arg("actor");
if(!id||!/^[a-f0-9-]{36}$/.test(id)||!actor||!/^[0-9a-f-]{36}$/.test(actor))
  throw Error("update-stage-arguments-invalid");
const stage=path.join(root,"updates","staging",id);
const archive=path.join(stage,"incoming.zip");
const unpacked=path.join(stage,"extracted");
const trust=path.join(root,"runtime","trust","update-signing-public.pem");
const marker=installedVersionPath(root);
for(const dir of [path.join(root,"updates"),path.join(root,"updates","staging"),stage]){
 const info=await lstat(dir);
 if(!info.isDirectory()||info.isSymbolicLink())throw Error("update-staging-directory-unsafe");
}
const keyInfo=await lstat(trust);
if(!keyInfo.isFile()||keyInfo.isSymbolicLink())throw Error("update-trust-anchor-missing");
const versionInfo=await lstat(marker);
if(!versionInfo.isFile()||versionInfo.isSymbolicLink())throw Error("update-version-marker-invalid");
const bytes=await readFile(archive);
try{
 await unpackZip(bytes,unpacked);
 const names=await readdir(unpacked);
 if(names.some(n=>!["manifest.json","manifest.sig","payload"].includes(n)))
   throw Error("update-archive-contents-unsafe");
 const signed=await readFile(path.join(unpacked,"manifest.json"));
 const signature=(await readFile(path.join(unpacked,"manifest.sig"),"utf8")).trim();
 if(!/^[A-Za-z0-9+/]{86}==$/.test(signature))throw Error("update-signature-format-invalid");
 const manifest=verifySignedManifest(signed,Buffer.from(signature,"base64"),await readFile(trust));
 const installed=JSON.parse(await readFile(marker,"utf8"));
 if(installed.product!=="SMN")throw Error("update-installation-unsupported");
 const files=await enumerateUpdateableFiles(root);
 requireCompatibleBase(manifest,installed.version,files);
 await verifyUpdatePayload(unpacked,manifest);
 const fingerprint=createHash("sha256").update(signed).digest("hex");
 const preview={
   id,actor,nonce:randomBytes(24).toString("hex"),
   fromVersion:manifest.fromVersion,toVersion:manifest.toVersion,
   mode:manifest.mode,files:manifest.files.length,changes:manifest.files.filter(f=>f.action==="put").length,
   deletions:manifest.files.filter(f=>f.action==="delete").length,
   bytes:manifest.files.reduce((n,f)=>n+f.size,0),
   sourceCommit:manifest.sourceCommit,
   affected:manifest.files.slice(0,15).map(file=>({path:file.path,action:file.action})),
   manifestSha256:fingerprint,archiveSha256:createHash("sha256").update(bytes).digest("hex"),
   checkedAt:new Date().toISOString()
 };
 await writeFile(path.join(stage,"preview.json"),JSON.stringify(preview)+"\n",{flag:"wx",mode:0o600});
 console.log(JSON.stringify(preview));
}catch(e){
 await rm(unpacked,{recursive:true,force:true});
 throw e;
}
