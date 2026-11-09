import {createHash} from "node:crypto";
import {lstat,readdir,readFile} from "node:fs/promises";
import {join} from "node:path";
import {validExtraName} from "./extra-archives";

const MAX_FILES=40,MAX_FILE_BYTES=20*1024*1024,MAX_TOTAL_BYTES=100*1024*1024;

/**
 * Captures BOTH Office stores, including custom templates.
 * Any unexpected entry, symlink, unreadable file or concurrent change denies
 * the erasure scope revision. It is an integrity fingerprint, not proof that
 * Office images or embedded objects are free of personal data.
 */
export async function fingerprintManagedOfficeStores(
 reportRoot:string,templateRoot:string
):Promise<readonly string[]>{
 let total=0;
 const fingerprints:string[]=[];
 for(const store of [
  {kind:"office" as const,root:reportRoot},
  {kind:"template" as const,root:templateRoot}
 ]){
  const stat=await lstat(store.root).catch((e:NodeJS.ErrnoException)=>{
   if(e.code==="ENOENT")return null;throw e;
  });
  if(!stat){
   fingerprints.push(store.kind+"=absent");
   continue;
  }
  if(!stat.isDirectory()||stat.isSymbolicLink())
   throw Error("privacy-office-directory-untrusted");
  const names=(await readdir(store.root)).sort();
  if(names.length>MAX_FILES||
   names.some(n=>!validExtraName(store.kind,n)))
   throw Error("privacy-office-entry-untrusted");
  fingerprints.push(store.kind+"=present");
  for(const name of names){
   const file=join(store.root,name),before=await lstat(file);
   if(!before.isFile()||before.isSymbolicLink()||
    before.size<1||before.size>MAX_FILE_BYTES)
    throw Error("privacy-office-file-untrusted");
   total+=before.size;
   if(total>MAX_TOTAL_BYTES)throw Error("privacy-office-too-large");
   const bytes=await readFile(file);
   const after=await lstat(file);
   if(bytes.length!==before.size||after.size!==before.size||
    after.mtimeMs!==before.mtimeMs||after.ino!==before.ino||
    after.isSymbolicLink())
    throw Error("privacy-office-file-changed");
   const sha=createHash("sha256").update(bytes).digest("hex");
   fingerprints.push(store.kind+"="+name+":"+sha);
  }
 }
 return fingerprints;
}
