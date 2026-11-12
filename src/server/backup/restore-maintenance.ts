import {open,lstat,readFile,mkdir} from "node:fs/promises";
import {join} from "node:path";
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
 version:1;operationId:string;createdAt:string;purpose:"offline-restore"|"offline-reset"
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
export function localRestoreMaintenanceLockPath():string{
 return join(process.cwd(),"updates","restore-maintenance.lock");
}
export async function restoreMaintenanceActive():Promise<boolean>{
 try{await lstat(localRestoreMaintenanceLockPath());return true;}
 catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")return true;}
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
 return beginOfflineMaintenance("offline-restore");
}
/** Shared maintenance fence for a disposable reset rehearsal.
 * The active reset route remains blocked. */
export async function beginOfflineResetMaintenance():Promise<MaintenanceMarker>{
 return beginOfflineMaintenance("offline-reset");
}
async function beginOfflineMaintenance(
 purpose:MaintenanceMarker["purpose"]
):Promise<MaintenanceMarker>{
 const path=restoreMaintenanceMarkerPath();
 if(!path)throw Error("restore-maintenance-not-configured");
 const record:MaintenanceMarker={
  version:1,operationId:randomUUID(),createdAt:new Date().toISOString(),
  purpose
 };
 const local=localRestoreMaintenanceLockPath();
 await mkdir(join(process.cwd(),"updates"),{recursive:true,mode:0o700});
 const dir=await lstat(join(process.cwd(),"updates"));
 if(!dir.isDirectory()||dir.isSymbolicLink())
  throw Error("restore-maintenance-local-dir-unsafe");
 // Create the local fail-closed gate FIRST; an external marker write failure
 // must not make a migration window accessible from the ordinary launcher.
 const lock=await open(local,"wx",0o600);
 try{await lock.writeFile(JSON.stringify(record));await lock.sync();}
 finally{await lock.close();}
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
 if(v.version!==1||
  (v.purpose!=="offline-restore"&&v.purpose!=="offline-reset")||
  !UUID.test(v.operationId)||
  !Number.isFinite(Date.parse(v.createdAt))||
  new Date(v.createdAt).toISOString()!==v.createdAt)
  throw Error("restore-maintenance-marker-invalid");
 return v;
}
