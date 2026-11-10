// Offline update archive contract. An updater must verify a detached Ed25519
// signature against a public key installed independently from the update ZIP.
import { createHash, createPublicKey, sign, verify } from "node:crypto";
import { readFile, lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { assertApplicationPayload } from "./distribution-layout.mjs";

const DIGEST=/^[0-9a-f]{64}$/;
const VERSION=/^33\.[0-9]+\.[0-9]+(?:-[a-z0-9]+(?:[.-][a-z0-9]+)*)?$/;
const APP_ROOTS=new Set(["app","prisma","scripts"]);
const APP_FILES=new Set(["launch-portable.mjs","Demarrer SMN.cmd","Recuperer admin SMN.cmd"]);
export const UPDATE_FORMAT=1;

export function validateUpdateVersion(version) {
  if (typeof version!=="string" || !VERSION.test(version)) throw Error("update-version-invalid");
  return version;
}
export function isUpdateableFile(relative) {
  assertApplicationPayload([relative]);
  const top=relative.split("/")[0];
  return APP_ROOTS.has(top) || APP_FILES.has(relative);
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
        entry.size<0 || entry.size>1024**3 || (entry.action==="put" &&
          (!DIGEST.test(entry.sha256) || entry.size===0 && typeof entry.sha256!=="string")) ||
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
  if(manifest.fromVersion===manifest.toVersion) throw Error("update-version-not-advanced");
  if(manifest.mode==="delta" && !manifest.files?.every(e=>e.previousSha256!==null || e.action==="put"))
    throw Error("update-delta-invalid");
  if(manifest.requires?.nodeMajor!==24 || manifest.requires?.postgresMajor!==18 ||
      manifest.requires?.schemaVersion!==33 || !DIGEST.test(manifest.sourceCommit))
    throw Error("update-compatibility-invalid");
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
  if(fromVersion===toVersion)throw Error("update-version-not-advanced");
  if(!DIGEST.test(sourceCommit))throw Error("update-commit-invalid");
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
    requires:{nodeMajor:24,postgresMajor:18,schemaVersion:33},files:entries});
}
