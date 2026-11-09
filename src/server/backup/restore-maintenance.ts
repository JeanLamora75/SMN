import {open,lstat,readFile,writeFile} from "node:fs/promises";
import {isAbsolute,resolve,relative,sep} from "node:path";
import {randomUUID} from "node:crypto";

/**
 * Fail-closed application maintenance fence. An offline operator places a
 * marker BEFORE draining requests, stopping SMN and changing DB/files.
 * A crash leaves the marker in place; login/session lookups are refused.
 *
 * This is NOT by itself a substitute for stopping the HTTP server,
 * scheduled writers, background jobs or PostgreSQL connections.
 */
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type MaintenanceMarker=Readonly<{
 version:1;operationId:string;createdAt:string;purpose:"offline-restore"
}>;
const outside=(file:string,root:string)=>{
 const diff=relative(resolve(root),file);
 return diff!==""&&diff!==".."&&!diff.startsWith(".."+sep)&&!isAbsolute(diff)
  ?false:true;
};
export function restoreMaintenanceMarkerPath():string|null{
 const value=process.env.SMN_RESTORE_MAINTENANCE_MARKER;
 if(!value)return null;
 if(!isAbsolute(value)||resolve(value)!==value||
  !outside(value,process.cwd())||
  process.env.SMN_BACKUP_DIR&&isAbsolute(process.env.SMN_BACKUP_DIR)&&
   !outside(value,process.env.SMN_BACKUP_DIR))
  throw Error("restore-maintenance-marker-unsafe");
 return value;
}
export async function restoreMaintenanceActive():Promise<boolean>{
 let path:string|null;
 try{path=restoreMaintenanceMarkerPath();}
 catch{return true;}
 if(!path)return false;
 try{
  const stat=await lstat(path);
  // A file's presence is enough to block. Directories and symlinks are
  // also blockers: malformed evidence can never turn maintenance off.
  return stat.isFile()||stat.isDirectory()||stat.isSymbolicLink()||true;
 }catch(error){
  if((error as NodeJS.ErrnoException).code==="ENOENT")return false;
  return true;
 }
}
export async function beginOfflineRestoreMaintenance():Promise<MaintenanceMarker>{
 const path=restoreMaintenanceMarkerPath();
 if(!path)throw Error("restore-maintenance-not-configured");
 const record:MaintenanceMarker={
  version:1,operationId:randomUUID(),createdAt:new Date().toISOString(),
  purpose:"offline-restore"
 };
 const f=await open(path,"wx",0o600);
 try{await f.writeFile(JSON.stringify(record));await f.sync();}
 finally{await f.close();}
 return record;
}
/** Read-only inspection: release and restart must remain an operator action. */
export async function inspectOfflineRestoreMaintenance():Promise<MaintenanceMarker|null>{
 const path=restoreMaintenanceMarkerPath();
 if(!path)throw Error("restore-maintenance-not-configured");
 const stat=await lstat(path).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
 if(!stat)return null;
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>2048)
  throw Error("restore-maintenance-marker-invalid");
 const v=JSON.parse(await readFile(path,"utf8")) as MaintenanceMarker;
 if(v.version!==1||v.purpose!=="offline-restore"||!UUID.test(v.operationId)||
  !Number.isFinite(Date.parse(v.createdAt))||
  new Date(v.createdAt).toISOString()!==v.createdAt)
  throw Error("restore-maintenance-marker-invalid");
 return v;
}
