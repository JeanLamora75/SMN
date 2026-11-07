import "server-only";
import {spawn} from "node:child_process";
import {lstat,realpath} from "node:fs/promises";
import path from "node:path";
import {officeTemplatesDirectory} from "./office-catalog";
import {officeReportsDirectory} from "./office-storage";

export type OfficeDirectoryKind="templates"|"reports";
export function isOfficeDirectoryKind(value:unknown):value is OfficeDirectoryKind{
 return value==="templates"||value==="reports";
}
export function configuredOfficeDirectory(kind:OfficeDirectoryKind):string{
 return kind==="templates"?officeTemplatesDirectory():officeReportsDirectory();
}
/** No client supplied path is ever executed. Refuse symlinks, missing roots and non-Windows servers. */
export async function openOfficeDirectory(kind:OfficeDirectoryKind):Promise<void>{
 if(process.platform!=="win32")throw Error("office-explorer-unsupported");
 const directory=path.resolve(configuredOfficeDirectory(kind));
 const entry=await lstat(directory);
 if(!entry.isDirectory()||entry.isSymbolicLink())throw Error("office-directory-unavailable");
 const canonical=await realpath(directory);
 if(path.win32.normalize(canonical).toLowerCase()!==path.win32.normalize(directory).toLowerCase())
  throw Error("office-directory-unavailable");
 await new Promise<void>((resolve,reject)=>{
  const child=spawn("explorer.exe",[directory],{shell:false,windowsHide:true,detached:true,stdio:"ignore"});
  child.once("error",reject);
  child.once("spawn",()=>{child.unref();resolve();});
 });
}
