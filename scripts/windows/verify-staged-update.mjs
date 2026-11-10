// Recheck the exact staged archive against the pinned installed trust key
// and current application state before approval or activation.
import {readFile,lstat,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {verifySignedManifest,verifyUpdatePayload,enumerateUpdateableFiles,
  requireCompatibleBase,installedVersionPath} from "./update-contract.mjs";
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf("--"+name);return i<0?null:args[i+1];}
const root=path.resolve(arg("root")??"."),id=arg("id");
if(!id||!/^[0-9a-f-]{36}$/.test(id))throw Error("update-id-invalid");
const dir=path.join(root,"updates","staging",id),unpacked=path.join(dir,"extracted");
const preview=JSON.parse(await readFile(path.join(dir,"preview.json"),"utf8"));
if(preview.id!==id||Date.now()-Date.parse(preview.checkedAt)>30*60*1000)
 throw Error("update-preview-expired");
for(const name of await readdir(unpacked))
 if(!["manifest.json","manifest.sig","payload"].includes(name))
  throw Error("update-extra-entry");
const keyPath=path.join(root,"runtime","trust","update-signing-public.pem");
const key=await lstat(keyPath);
if(!key.isFile()||key.isSymbolicLink())throw Error("update-key-unsafe");
const manifestBytes=await readFile(path.join(unpacked,"manifest.json"));
const signatureString=(await readFile(path.join(unpacked,"manifest.sig"),"utf8")).trim();
if(!/^[A-Za-z0-9+/]{86}==$/.test(signatureString))throw Error("update-signature-encoding-invalid");
const manifest=verifySignedManifest(manifestBytes,
 Buffer.from(signatureString,"base64"),await readFile(keyPath,"utf8"));
if(preview.manifestSha256!==createHash("sha256").update(manifestBytes).digest("hex") ||
   preview.fromVersion!==manifest.fromVersion||preview.toVersion!==manifest.toVersion||
   preview.mode!==manifest.mode)throw Error("update-manifest-changed");
const archive=await readFile(path.join(dir,"incoming.zip"));
if(preview.archiveSha256!==createHash("sha256").update(archive).digest("hex"))
 throw Error("update-archive-changed");
const version=JSON.parse(await readFile(installedVersionPath(root),"utf8"));
if(version.product!=="SMN")throw Error("update-installation-invalid");
const installed=await enumerateUpdateableFiles(root);
requireCompatibleBase(manifest,version.version,installed);
await verifyUpdatePayload(unpacked,manifest);
console.log(JSON.stringify({valid:true,id,fromVersion:manifest.fromVersion,
 toVersion:manifest.toVersion,mode:manifest.mode,changes:manifest.files.length}));
