import {createHash,randomUUID} from "node:crypto";
import {open,lstat,mkdir,readFile,realpath,rename,rm} from "node:fs/promises";
import path from "node:path";

const MAX_REPORT_BYTES=20*1024*1024;
const SAFE_BASE=/^[^\\/:*?"<>|\x00-\x1f]{1,120}$/;
type Format="docx"|"pptx";
export type OfficeSaveSnapshot={exists:boolean;fingerprint:string;filename:string;directory:string};
export class OfficeSaveConflict extends Error{constructor(){super("office-save-conflict");}}
export class OfficeSaveFailure extends Error{constructor(){super("office-save-failed");}}

export function officeReportsDirectory(env:NodeJS.ProcessEnv=process.env):string{
 const custom=env.SMN_OFFICE_REPORTS_DIR?.trim();
 if(custom){
  if(!path.isAbsolute(custom))throw new OfficeSaveFailure();
  return path.resolve(custom);
 }
 const base=env.LOCALAPPDATA?.trim()||path.join(process.cwd(),".smn-local");
 return path.join(base,"ScrumMasterNotebook","office-reports");
}
export function safeOfficeReportName(name:string,format:Format):string{
 if(typeof name!=="string"||name!==name.trim()||!SAFE_BASE.test(name)||
    name==="."||name===".."||name.endsWith(".")||name.endsWith(" ")||
    /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name))
  throw new OfficeSaveFailure();
 const stem=name.replace(/\.(?:docx|pptx)$/i,"");
 if(!stem||stem==="."||stem===".."||stem.endsWith(".")||stem.endsWith(" "))
  throw new OfficeSaveFailure();
 return stem+"."+format;
}

async function secureFolder(directory:string):Promise<string>{
 const folder=path.resolve(directory);
 try{await mkdir(folder,{recursive:true});}catch{throw new OfficeSaveFailure();}
 try{
  const stat=await lstat(folder);
  if(!stat.isDirectory()||stat.isSymbolicLink())throw new OfficeSaveFailure();
  return await realpath(folder);
 }catch{throw new OfficeSaveFailure();}
}
async function fingerprint(file:string):Promise<string|null>{
 try{
  const stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_REPORT_BYTES)
   throw new OfficeSaveFailure();
  const bytes=await readFile(file);
  return createHash("sha256").update(bytes).digest("hex")+":"+
   stat.size+":"+stat.mtimeNs?.toString();
 }catch(error){
  if((error as NodeJS.ErrnoException).code==="ENOENT")return null;
  if(error instanceof OfficeSaveFailure)throw error;
  throw new OfficeSaveFailure();
 }
}

export async function inspectOfficeReport(filename:string,format:Format,
 directory=officeReportsDirectory()):Promise<OfficeSaveSnapshot>{
 const name=safeOfficeReportName(filename,format);
 const root=await secureFolder(directory);
 const old=await fingerprint(path.join(root,name));
 return {exists:old!==null,fingerprint:old??"absent",filename:name,directory:root};
}

/** Conditional atomic promotion. Never write directly into a pre-existing report.
 * A per-name exclusive lock serializes SMN writers; a final fingerprint detects
 * changes made by ordinary external editors before the final check. A writer
 * bypassing the lock exactly between check and rename is an OS-level race and
 * needs a native compare-and-swap primitive for an absolute guarantee.
 */
export async function saveOfficeReport(bytes:Buffer,filename:string,format:Format,
 expectedFingerprint:string,directory=officeReportsDirectory()):Promise<OfficeSaveSnapshot>{
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>MAX_REPORT_BYTES||
    typeof expectedFingerprint!=="string"||
    !/^(absent|[a-f0-9]{64}:\d+:(?:\d+|undefined))$/.test(expectedFingerprint))
  throw new OfficeSaveFailure();
 const name=safeOfficeReportName(filename,format),root=await secureFolder(directory);
 const destination=path.join(root,name);
 const lock=path.join(root,"."+createHash("sha256").update(name).digest("hex")+".lock");
 let lockFile:Awaited<ReturnType<typeof open>>|null=null,temp:string|null=null;
 try{
  try{lockFile=await open(lock,"wx",0o600);}
  catch(error){
   if((error as NodeJS.ErrnoException).code==="EEXIST")throw new OfficeSaveConflict();
   throw new OfficeSaveFailure();
  }
  const original=await fingerprint(destination);
  if((original??"absent")!==expectedFingerprint)throw new OfficeSaveConflict();
  temp=path.join(root,".smn-"+randomUUID()+".tmp");
  const handle=await open(temp,"wx",0o600);
  try{await handle.writeFile(bytes);await handle.sync();}
  finally{await handle.close();}
  // Detect modifications since the first check, including an external writer
  // that does not observe the SMN advisory lock.
  if((await fingerprint(destination)??"absent")!==expectedFingerprint)
   throw new OfficeSaveConflict();
  if(original===null){
   // Atomic create with hard link: never replace a destination created by another process.
   const {link}=await import("node:fs/promises");
   try{await link(temp,destination);}
   catch(error){
    if((error as NodeJS.ErrnoException).code==="EEXIST")throw new OfficeSaveConflict();
    throw new OfficeSaveFailure();
   }
  }else{
   try{await rename(temp,destination);}
   catch{throw new OfficeSaveFailure();}
   temp=null;
  }
  return {exists:true,fingerprint:(await fingerprint(destination))??"absent",
   filename:name,directory:root};
 }finally{
  if(temp)await rm(temp,{force:true}).catch(()=>{});
  if(lockFile){await lockFile.close().catch(()=>{});await rm(lock,{force:true}).catch(()=>{});}
 }
}
