// Windows portable launcher: fail-closed when a configured external maintenance
// marker exists. This is an admission/stop signal, NOT proof that all writers
// or PostgreSQL connections have stopped.
import {lstat} from "node:fs/promises";
import path from "node:path";

function inside(candidate,root){
 const d=path.relative(path.resolve(root),path.resolve(candidate));
 return d===""||(!d.startsWith(".."+path.sep)&&d!==".."&&!path.isAbsolute(d));
}
export function validateLauncherMaintenanceMarker(marker,root,backupDir){
 if(typeof marker!=="string"||!marker||!path.isAbsolute(marker)||
  path.resolve(marker)!==marker||typeof root!=="string"||!root)
  return false;
 if(inside(marker,root))return false;
 if(backupDir&&(!path.isAbsolute(backupDir)||inside(marker,backupDir)))
  return false;
 return true;
}
export async function launcherMaintenanceBlocked(marker,root,backupDir){
 if(marker===undefined||marker===null||marker==="")return false;
 if(!validateLauncherMaintenanceMarker(marker,root,backupDir))return true;
 try{
  // Presence, including a corrupted file, directory or symlink, blocks launch.
  await lstat(marker);
  return true;
 }catch(error){
  // ENOENT is the ONLY state permitting a fresh launch.
  return error?.code!=="ENOENT";
 }
}
