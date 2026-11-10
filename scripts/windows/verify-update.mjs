// Offline read-only verification of an extracted SMN update.
// The public key MUST be taken from the installed runtime/trust folder,
// never from the update archive itself. No application files are modified.
import { readFile, lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { verifySignedManifest, verifyUpdatePayload,
  enumerateUpdateableFiles, requireCompatibleBase } from "./update-contract.mjs";
function flag(name){const index=process.argv.indexOf("--"+name);return index<0?null:process.argv[index+1]??null;}
const dir=flag("dir"),trust=flag("trust"),base=flag("base");
if(!dir||!trust)throw Error("usage: verify-update --dir EXTRACTED --trust INSTALLED_PUBLIC_KEY [--base INSTALLED_ROOT]");
for(const name of await readdir(dir)){
  if(!["manifest.json","manifest.sig","payload"].includes(name))throw Error("update-archive-extra-entry");
}
const manifestFile=path.join(dir,"manifest.json");
const signatureFile=path.join(dir,"manifest.sig");
for(const file of [manifestFile,signatureFile]){
  const info=await lstat(file);
  if(!info.isFile()||info.isSymbolicLink())throw Error("update-metadata-unsafe");
}
const bytes=await readFile(manifestFile);
const sigText=(await readFile(signatureFile,"utf8")).trim();
if(!/^[A-Za-z0-9+/]{86}==$/.test(sigText))throw Error("update-signature-encoding-invalid");
const manifest=verifySignedManifest(bytes,Buffer.from(sigText,"base64"),await readFile(trust,"utf8"));
await verifyUpdatePayload(dir,manifest);
if(base){
  const installed=JSON.parse(await readFile(path.join(base,"distribution-version.json"),"utf8"));
  const files=await enumerateUpdateableFiles(base);
  requireCompatibleBase(manifest,installed.version,files);
}
console.log(JSON.stringify({valid:true,mode:manifest.mode,fromVersion:manifest.fromVersion,
  toVersion:manifest.toVersion,entries:manifest.files.length}));
