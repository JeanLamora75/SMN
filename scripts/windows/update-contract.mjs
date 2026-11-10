// Offline update archive contract. An updater must verify a detached Ed25519
// signature against a public key installed independently from the update ZIP.
import { createHash, createPublicKey, sign, verify } from "node:crypto";
import { readFile, lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { assertApplicationPayload } from "./distribution-layout.mjs";

const DIGEST=/^[0-9a-f]{64}$/;
const COMMIT=/^[0-9a-f]{40}$/;
const VERSION=/^33\.[0-9]+\.[0-9]+(?:-[a-z0-9]+(?:[.-][a-z0-9]+)*)?$/;
const APP_ROOTS=new Set(["app","prisma","scripts"]);
const APP_FILES=new Set(["launch-portable.mjs","Demarrer SMN.cmd","Recuperer admin SMN.cmd","distribution-version.json"]);
export const UPDATE_FORMAT=1;

export function inventoryFingerprint(files) {
  if(!(files instanceof Map)) throw Error("update-inventory-invalid");
  const entries=[...files.values()].map(file=>`${file.path.toLowerCase()} ${file.sha256}`).sort();
  return createHash("sha256").update(entries.join("\n")+"\n").digest("hex");
}

export function validateUpdateVersion(version) {
  if (typeof version!=="string" || !VERSION.test(version)) throw Error("update-version-invalid");
  return version;
}
function mustAdvance(fromVersion,toVersion) {
  const parse=v=>v.match(/^33\.([0-9]+)\.([0-9]+)(?:-(.*))?$/);
  const from=parse(fromVersion),to=parse(toVersion);
  if(!from||!to)throw Error("update-version-invalid");
  const baseA=Number(from[1]),baseB=Number(from[2]);
  const nextA=Number(to[1]),nextB=Number(to[2]);
  if(![baseA,baseB,nextA,nextB].every(Number.isSafeInteger))
    throw Error("update-version-invalid");
  if(nextA<baseA || nextA===baseA && nextB<baseB ||
      nextA===baseA && nextB===baseB &&
      (!from[3] || !!to[3] && to[3]<=from[3]))
    throw Error("update-version-not-advanced");
}
export function isUpdateableFile(relative) {
  assertApplicationPayload([relative]);
  const top=relative.split("/")[0];
  return (APP_ROOTS.has(top) && relative.includes("/")) || APP_FILES.has(relative);
}
function requireEntries(entries) {
  if (!Array.isArray(entries) || entries.length>20000) throw Error("update-file-list-invalid");
  const seen=new Set();
  for(const entry of entries) {
    if (!entry || typeof entry.path!=="string" || !isUpdateableFile(entry.path))
      throw Error("update-file-path-invalid");
    const key=entry.path.toLowerCase();
    if(seen.has(key)) throw Error("update-path-collision");
    seen.add(key);
    if (!["put","delete"].includes(entry.action) || !Number.isSafeInteger(entry.size) ||
        entry.size<0 || entry.size>1024**3 || (entry.action==="put" && !DIGEST.test(entry.sha256)) ||
        (entry.action==="delete" && (entry.sha256!==null || entry.size!==0)) ||
        (entry.previousSha256!==null && !DIGEST.test(entry.previousSha256)))
      throw Error("update-file-entry-invalid");
  }
  return entries;
}
export function validateUpdateManifest(manifest) {
  if(!manifest || manifest.format!==UPDATE_FORMAT || manifest.product!=="SMN" ||
      manifest.platform!=="win32-x64" || !["full","delta"].includes(manifest.mode))
    throw Error("update-manifest-invalid");
  validateUpdateVersion(manifest.fromVersion);
  validateUpdateVersion(manifest.toVersion);
  mustAdvance(manifest.fromVersion,manifest.toVersion);
  if(manifest.mode==="delta" && !manifest.files?.every(e=>e.previousSha256!==null || e.action==="put"))
    throw Error("update-delta-invalid");
  if(manifest.requires?.nodeMajor!==24 || manifest.requires?.postgresMajor!==18 ||
      manifest.requires?.schemaVersion!==33 || !COMMIT.test(manifest.sourceCommit))
    throw Error("update-compatibility-invalid");
  if(manifest.mode==="delta" && !DIGEST.test(manifest.baseFingerprint))
    throw Error("update-base-fingerprint-invalid");
  if(manifest.mode==="full" && manifest.baseFingerprint!==null)
    throw Error("update-base-fingerprint-invalid");
  requireEntries(manifest.files);
  return manifest;
}
export function manifestBytes(manifest) {
  validateUpdateManifest(manifest);
  return Buffer.from(JSON.stringify(manifest)+"\n","utf8");
}
export function signatureBytes(manifest, privateKeyPem) {
  const bytes=manifestBytes(manifest);
  return sign(null,bytes,privateKeyPem);
}
export function verifySignedManifest(bytes, signature, pinnedPublicKeyPem) {
  const pem=createPublicKey(pinnedPublicKeyPem);
  if(pem.asymmetricKeyType!=="ed25519") throw Error("update-key-invalid");
  if(!Buffer.isBuffer(bytes) || !Buffer.isBuffer(signature) || signature.length!==64 ||
     !verify(null,bytes,pem,signature)) throw Error("update-signature-invalid");
  const decoded=JSON.parse(bytes.toString("utf8"));
  if(!manifestBytes(decoded).equals(bytes)) throw Error("update-manifest-canonical-invalid");
  return decoded;
}
export async function enumerateUpdateableFiles(root) {
  const collected=new Map();
  async function walk(folder,parts) {
    const names=(await readdir(folder)).sort();
    for(const name of names) {
      const relative=[...parts,name].join("/");
      const absolute=path.join(folder,name);
      const info=await lstat(absolute);
      if(info.isSymbolicLink()) throw Error("update-symlink-rejected");
      if(info.isDirectory()) {
        if(parts.length===0 && !APP_ROOTS.has(name)) continue;
        await walk(absolute,[...parts,name]);
      } else if(info.isFile()) {
        // Root launcher files are collected once by the explicit allowlist below.
        if(parts.length===0) continue;
        if(!isUpdateableFile(relative)) throw Error("update-protected-file");
        const hash=createHash("sha256").update(await readFile(absolute)).digest("hex");
        if(collected.has(relative.toLowerCase())) throw Error("update-path-collision");
        collected.set(relative.toLowerCase(),{path:relative,sha256:hash,size:info.size,absolute});
      } else throw Error("update-nonregular-file");
    }
  }
  await walk(root,[]);
  for(const file of APP_FILES){
    const absolute=path.join(root,file);
    try {
      const info=await lstat(absolute);
      if(!info.isFile() || info.isSymbolicLink()) throw Error("update-unsafe-entry");
      if(collected.has(file.toLowerCase())) throw Error("update-path-collision");
      collected.set(file.toLowerCase(),{path:file,size:info.size,
        sha256:createHash("sha256").update(await readFile(absolute)).digest("hex"),absolute});
    }catch(e){if(e?.code!=="ENOENT")throw e;}
  }
  if(!collected.has("app/server.js")) throw Error("update-standalone-server-missing");
  return collected;
}
export function planUpdate({oldFiles,newFiles,fromVersion,toVersion,sourceCommit,mode}) {
  validateUpdateVersion(fromVersion);validateUpdateVersion(toVersion);
  mustAdvance(fromVersion,toVersion);
  if(!COMMIT.test(sourceCommit))throw Error("update-commit-invalid");
  if(!["full","delta"].includes(mode))throw Error("update-mode-invalid");
  if(mode==="delta"&&!oldFiles)throw Error("update-base-required");
  const entries=[];
  for(const [key,next] of newFiles){
    const previous=oldFiles?.get(key);
    if(mode==="delta" && previous?.sha256===next.sha256) continue;
    entries.push({path:next.path,action:"put",sha256:next.sha256,
      previousSha256:previous?.sha256??null,size:next.size});
  }
  if(mode==="delta")for(const [key,previous] of oldFiles){
    if(!newFiles.has(key))entries.push({path:previous.path,action:"delete",
      sha256:null,previousSha256:previous.sha256,size:0});
  }
  entries.sort((a,b)=>a.path.localeCompare(b.path,"en"));
  return validateUpdateManifest({format:UPDATE_FORMAT,product:"SMN",
    platform:"win32-x64",mode,fromVersion,toVersion,sourceCommit,
    requires:{nodeMajor:24,postgresMajor:18,schemaVersion:33},
    baseFingerprint:mode==="delta"?inventoryFingerprint(oldFiles):null,files:entries});
}

export function requireCompatibleBase(manifest,baseVersion,installedFiles) {
  validateUpdateManifest(manifest);
  if(baseVersion!==manifest.fromVersion)throw Error("update-from-version-mismatch");
  if(manifest.mode==="delta"){
    if(inventoryFingerprint(installedFiles)!==manifest.baseFingerprint)
      throw Error("update-base-inventory-mismatch");
    for(const entry of manifest.files){
      const present=installedFiles.get(entry.path.toLowerCase());
      if(entry.previousSha256===null && present)
        throw Error("update-file-already-exists");
      if(entry.previousSha256!==null && present?.sha256!==entry.previousSha256)
        throw Error("update-base-file-mismatch");
    }
  }
  return true;
}
export async function verifyUpdatePayload(root,manifest) {
  validateUpdateManifest(manifest);
  const records=new Map(manifest.files.filter(f=>f.action==="put").map(f=>[f.path.toLowerCase(),f]));
  const expected=new Set(records.keys());
  const payloadRoot=path.join(root,"payload");
  const observed=new Set();
  async function inspect(folder,parts) {
    for(const name of await readdir(folder)){
      const relative=[...parts,name].join("/");
      const entry=path.join(folder,name),info=await lstat(entry);
      if(info.isSymbolicLink())throw Error("update-payload-symlink");
      if(info.isDirectory()){await inspect(entry,[...parts,name]);continue;}
      if(!info.isFile() || !expected.has(relative.toLowerCase()) || observed.has(relative.toLowerCase()))
        throw Error("update-payload-extra-or-unsafe");
      observed.add(relative.toLowerCase());
      const record=records.get(relative.toLowerCase());
      if(!record || record.size!==info.size ||
        createHash("sha256").update(await readFile(entry)).digest("hex")!==record.sha256)
        throw Error("update-payload-integrity-failed");
    }
  }
  if(expected.size){
    await inspect(payloadRoot,[]);
  }else {
    try {if((await readdir(payloadRoot)).length)throw Error("update-payload-extra-or-unsafe");}
    catch(e){if(e?.code!=="ENOENT")throw e;}
  }
  if(observed.size!==expected.size)throw Error("update-payload-missing");
  return true;
}
