// Build a detached, signed offline SMN application-only update.
// Usage: node scripts/windows/build-update.mjs --target DIR --out DIR
//   [--base DIR --mode delta] [--from 33.0.0 --mode full]
// Private Ed25519 key is provided by a CI secret, never put in the ZIP.
import { createPrivateKey, createPublicKey, createHash } from "node:crypto";
import { readFile, mkdir, cp, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { enumerateUpdateableFiles, planUpdate, manifestBytes, signatureBytes,
  verifySignedManifest, validateUpdateVersion,installedVersionPath } from "./update-contract.mjs";

function flag(name) {
  const i=process.argv.indexOf("--"+name);
  return i<0?null:process.argv[i+1]??null;
}
const target=flag("target"),out=flag("out"),base=flag("base");
const mode=flag("mode")??(base?"delta":"full");
if(!target||!out||!["full","delta"].includes(mode)||(mode==="delta"&&!base))
  throw Error("usage: --target DIRECTORY --out DIRECTORY [--base DIRECTORY --mode delta | --from VERSION --mode full]");
const privateText=process.env.SMN_UPDATE_SIGNING_KEY_PEM_B64;
if(!privateText) throw Error("update-signing-key-missing");
const privatePem=Buffer.from(privateText,"base64").toString("utf8");
const key=createPrivateKey(privatePem);
if(key.asymmetricKeyType!=="ed25519")throw Error("update-signing-key-invalid");
const fingerprint=createHash("sha256").update(createPublicKey(key).export({type:"spki",format:"der"})).digest("hex");
const version=JSON.parse(await readFile(installedVersionPath(target),"utf8"));
const toVersion=validateUpdateVersion(version.version);
const fromVersion=mode==="delta"?
  validateUpdateVersion(JSON.parse(await readFile(installedVersionPath(base),"utf8")).version):
  validateUpdateVersion(flag("from"));
const targetFiles=await enumerateUpdateableFiles(target);
const baseFiles=mode==="delta"?await enumerateUpdateableFiles(base):null;
const manifest=planUpdate({oldFiles:baseFiles,newFiles:targetFiles,
  fromVersion,toVersion,sourceCommit:process.env.GITHUB_SHA??flag("commit"),mode});
const bytes=manifestBytes(manifest);
const signature=signatureBytes(manifest,privatePem);
verifySignedManifest(bytes,signature,createPublicKey(key).export({type:"spki",format:"pem"}));
await mkdir(out,{recursive:true});
for(const entry of manifest.files){
  if(entry.action!=="put")continue;
  const source=targetFiles.get(entry.path.toLowerCase());
  if(!source)throw Error("update-source-missing");
  const destination=path.join(out,"payload",...entry.path.split("/"));
  await mkdir(path.dirname(destination),{recursive:true});
  await cp(source.absolute,destination,{dereference:false,errorOnExist:true,force:false});
  if((await stat(destination)).size!==entry.size)throw Error("update-copy-size-invalid");
  const digest=createHash("sha256").update(await readFile(destination)).digest("hex");
  if(digest!==entry.sha256)throw Error("update-copy-hash-invalid");
}
await writeFile(path.join(out,"manifest.json"),bytes,{flag:"wx"});
await writeFile(path.join(out,"manifest.sig"),signature.toString("base64")+"\n",{flag:"wx"});
console.log(JSON.stringify({toVersion,fromVersion,mode,updated:manifest.files.length,
  fingerprint,bytes:manifest.files.reduce((total,f)=>total+(f.action==="put"?f.size:0),0)}));
