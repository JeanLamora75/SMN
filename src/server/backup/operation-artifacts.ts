import {lstat,readdir} from "node:fs/promises";
import {join} from "node:path";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const BACKUP=/^\.([a-f0-9-]{36})\.partial$/i;
const PURGE=/^\.retention-removing-([a-f0-9-]{36})$/i;
export type UnfinishedArtifacts=Readonly<{
 stagingBackupIds:readonly string[];
 retentionPendingIds:readonly string[];
 unknownBackupArtifacts:number;
 unknownRetentionArtifacts:number;
}>;
/**
 * Read-only inventory of crash leftovers. No private path, file name or
 * content is returned to the API. An unexpected symlink/shape is uncertain,
 * never proof that the operation completed.
 */
export async function inspectUnfinishedBackupArtifacts(root:string):Promise<UnfinishedArtifacts>{
 const path=join(root,"packages");
 const st=await lstat(path).catch((err:NodeJS.ErrnoException)=>{
  if(err.code==="ENOENT")return null;
  throw err;
 });
 if(!st)return {stagingBackupIds:[],retentionPendingIds:[],
  unknownBackupArtifacts:0,unknownRetentionArtifacts:0};
 if(!st.isDirectory()||st.isSymbolicLink())throw Error("operation-packages-unsafe");
 const names=await readdir(path);
 if(names.length>2500)throw Error("operation-packages-over-limit");
 const stagingBackupIds:string[]=[],retentionPendingIds:string[]=[];
 let unknownBackupArtifacts=0,unknownRetentionArtifacts=0;
 for(const name of names){
  const backup=name.match(BACKUP),retention=name.match(PURGE);
  if(!backup&&!retention&&!name.startsWith(".retention-removing-")&&
   !name.endsWith(".partial"))continue;
  const found=await lstat(join(path,name));
  const valid=found.isDirectory()&&!found.isSymbolicLink();
  if(backup&&UUID.test(backup[1])&&valid)stagingBackupIds.push(backup[1]);
  else if(retention&&UUID.test(retention[1])&&valid)retentionPendingIds.push(retention[1]);
  else if(name.startsWith(".retention-removing-"))unknownRetentionArtifacts++;
  else unknownBackupArtifacts++;
 }
 return {stagingBackupIds:stagingBackupIds.sort(),
  retentionPendingIds:retentionPendingIds.sort(),
  unknownBackupArtifacts,unknownRetentionArtifacts};
}

/** Staging is not interrupted if the exact operation still holds its lock. */
export function unresolvedArtifactCounts(
 artifacts:UnfinishedArtifacts,active:{
  backupId:string|null;cleanupId:string|null
 }):Readonly<{backup:number;cleanup:number}>{
 return {
  backup:artifacts.stagingBackupIds.filter(id=>id!==active.backupId).length+
   artifacts.unknownBackupArtifacts,
  cleanup:artifacts.retentionPendingIds.filter(id=>id!==active.cleanupId).length+
   artifacts.unknownRetentionArtifacts
 };
}
