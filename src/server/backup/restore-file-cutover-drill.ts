import {createHash} from "node:crypto";
import {lstat,open,readdir,readFile,rename,rm,realpath} from "node:fs/promises";
import {basename,dirname,isAbsolute,resolve,join,relative,sep} from "node:path";
import {tmpdir} from "node:os";

/**
 * File cutover REHEARSAL only: all roots must be siblings named
 * smn_restore_test_*. Never use this module against live SMN storage.
 * Rename of a single directory is atomic on one filesystem, but there
 * is NO atomic transaction across PostgreSQL, several disks and files.
 */
const SAFE=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const FILE=/^[A-Za-z0-9_. -]{1,220}$/;
const FOLDERS=new Set(["documents","report-pdfs","office-reports","office-templates"]);
const MAX_FILES=2800,MAX_BYTES=600*1024*1024;
export type FileSnapshot=Readonly<{sha256:string;count:number;bytes:number}>;
export type FileCutoverInput=Readonly<{
 originalRoot:string;candidateRoot:string;rollbackRoot:string;
 injectFailureAfterPark?:boolean;
}>;
export function validateFileCutoverDrill(x:FileCutoverInput):boolean{
 const roots=[x.originalRoot,x.candidateRoot,x.rollbackRoot];
 const parent=dirname(roots[0]),insideTemp=relative(resolve(tmpdir()),parent);
 return insideTemp!==""&&insideTemp!==".."&&
  !insideTemp.startsWith(".."+sep)&&
  !isAbsolute(insideTemp)&&roots.every(r=>isAbsolute(r)&&r===resolve(r)&&SAFE.test(basename(r)))&&
  new Set(roots).size===3&&new Set(roots.map(dirname)).size===1;
}
export async function inspectRestoreFileTree(root:string):Promise<FileSnapshot>{
 const rootStat=await lstat(root);
 if(!rootStat.isDirectory()||rootStat.isSymbolicLink())
  throw Error("restore-file-root-untrusted");
 let count=0,bytes=0;
 const parts:string[]=[];
 const dirs=await readdir(root);
 if(dirs.some(name=>!FOLDERS.has(name)))throw Error("restore-file-folder-unexpected");
 for(const group of dirs.sort()){
  const folder=join(root,group),s=await lstat(folder);
  if(!s.isDirectory()||s.isSymbolicLink())
   throw Error("restore-file-folder-untrusted");
  const names=await readdir(folder);
  for(const name of names.sort()){
   if(!FILE.test(name)||name==="."||name===".."||
    name.startsWith("."))throw Error("restore-file-name-invalid");
   const file=join(folder,name),stat=await lstat(file);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.size<=0||
    stat.size>20*1024*1024)throw Error("restore-file-untrusted");
   count++;bytes+=stat.size;
   if(count>MAX_FILES||bytes>MAX_BYTES)throw Error("restore-file-scope-limit");
   const b=await readFile(file);
   if(b.length!==stat.size)throw Error("restore-file-changed");
   parts.push(group+"/"+name+"|"+
    createHash("sha256").update(b).digest("hex")+"|"+b.length);
  }
 }
 return {sha256:createHash("sha256").update(parts.join("\n")).digest("hex"),
  count,bytes};
}
export async function rehearseOfflineFileCutover(x:FileCutoverInput):Promise<{
 status:"verified"|"rolled-back";rollbackRetained:boolean;
 source:FileSnapshot;candidate:FileSnapshot
}>{
 if(!validateFileCutoverDrill(x))throw Error("restore-file-disposable-only");
 const parent=dirname(x.originalRoot);
 const parentStat=await lstat(parent);
 if(!parentStat.isDirectory()||parentStat.isSymbolicLink()||
  await realpath(parent)!==parent)
  throw Error("restore-file-parent-untrusted");
 const lockFile=join(parent,".smn-restore-file-drill.lock");
 let lock=false,parked=false,promoted=false;
 try{
  const handle=await open(lockFile,"wx",0o600);await handle.close();lock=true;
  const existing=await lstat(x.rollbackRoot).catch(
   (e:NodeJS.ErrnoException)=>e.code==="ENOENT"?null:Promise.reject(e));
  if(existing)throw Error("restore-file-rollback-target-occupied");
  const source=await inspectRestoreFileTree(x.originalRoot);
  const candidate=await inspectRestoreFileTree(x.candidateRoot);
  // A wholly empty candidate may be valid only if the protected manifest
  // proves zero documents. This utility cannot establish that: refuse.
  if(candidate.count===0)throw Error("restore-file-empty-candidate");
  await rename(x.originalRoot,x.rollbackRoot);parked=true;
  if(x.injectFailureAfterPark)throw Error("restore-file-fault-injected");
  await rename(x.candidateRoot,x.originalRoot);promoted=true;
  const checked=await inspectRestoreFileTree(x.originalRoot);
  const backup=await inspectRestoreFileTree(x.rollbackRoot);
  if(JSON.stringify(checked)!==JSON.stringify(candidate)||
   JSON.stringify(backup)!==JSON.stringify(source))
   throw Error("restore-file-promotion-verification-failed");
  return {status:"verified",rollbackRetained:true,source,candidate};
 }catch{
  if(parked&&!promoted){
   try{
    await rename(x.rollbackRoot,x.originalRoot);
    return {status:"rolled-back",rollbackRetained:false,
     source:await inspectRestoreFileTree(x.originalRoot),
     candidate:await inspectRestoreFileTree(x.candidateRoot)};
   }catch{throw Error("restore-file-manual-recovery-required");}
  }
  throw Error(promoted?"restore-file-manual-recovery-required":"restore-file-cutover-denied");
 }finally{
  if(lock)await rm(lockFile,{force:true}).catch(()=>undefined);
 }
}
