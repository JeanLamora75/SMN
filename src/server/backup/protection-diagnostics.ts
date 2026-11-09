import "server-only";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";
import {backupInventory} from "./verification";
import {backupRootPath} from "./runner";
import {classifyBackupEvidence,classifyCleanupEvidence,blockedOperation,
 type OperationEvidence,unresolvedOperation} from "./operation-diagnostics";
import {inspectUnfinishedBackupArtifacts} from "./operation-artifacts";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Marker={id:string;createdAt:string;status:"running"|"success"|"failed"|"cancelled"};
async function marker(root:string):Promise<Marker|null>{
 try{
  const file=join(root,"last-attempt.json"),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1024)return null;
  const x=JSON.parse(await readFile(file,"utf8")) as Partial<Marker>;
  if(!UUID.test(x.id??"")||!["running","success","failed","cancelled"].includes(x.status??"")||
   typeof x.createdAt!=="string"||!Number.isFinite(Date.parse(x.createdAt)))return null;
  return x as Marker;
 }catch{return null;}
}
type CleanupMarker={operationId:string;startedAt:string;status:string;
 planned:number;processed:number;failed:number;inFlight:string|null;
 plannedIds:string[];processedIds:string[]};
async function cleanupMarker(root:string):Promise<CleanupMarker|null>{
 try{
  const file=join(root,"last-cleanup.json"),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>25000)return null;
  const x=JSON.parse(await readFile(file,"utf8")) as Partial<CleanupMarker>;
  if(!UUID.test(x.operationId??"")||typeof x.startedAt!=="string"||
   !Number.isFinite(Date.parse(x.startedAt))||
   !["running","success","partial","failed"].includes(x.status??"")||
   ![x.planned,x.processed,x.failed].every(v=>Number.isSafeInteger(v)&&
    typeof v==="number"&&v>=0)||
   x.processed!+x.failed!>x.planned!||
   !Array.isArray(x.plannedIds)||!Array.isArray(x.processedIds)||
   x.plannedIds.length!==x.planned||x.processedIds.length!==x.processed||
   x.plannedIds.length>200||x.processedIds.length>200||
   x.plannedIds.some(id=>typeof id!=="string"||!UUID.test(id))||
   x.processedIds.some(id=>typeof id!=="string"||!UUID.test(id))||
   x.inFlight!==null&&(typeof x.inFlight!=="string"||!UUID.test(x.inFlight))||
   new Set(x.plannedIds).size!==x.plannedIds.length||
   new Set(x.processedIds).size!==x.processedIds.length||
   x.processedIds.some(id=>!x.plannedIds!.includes(id)))return null;
  return x as CleanupMarker;
 }catch{return null;}
}
async function currentlyRunning(db:Client):Promise<{
 backup:boolean;cleanup:boolean
}>{
 const result=await db.query<{application_name:string}>(`
  SELECT a.application_name FROM pg_catalog.pg_locks l
  JOIN pg_catalog.pg_stat_activity a ON a.pid=l.pid
  WHERE l.locktype='advisory' AND l.granted
   AND l.classid='20261021'::oid AND l.objid='30'::oid`);
 return {
  backup:result.rows.some(r=>r.application_name==="smn-manual-backup"),
  cleanup:result.rows.some(r=>r.application_name==="smn-retention-cleanup")
 };
}
/**
 * Only the latest manual backup is claimed. Purge and restore are separately
 * represented as blocked/unconfirmed unless independently audited.
 */
export async function readProtectionDiagnostics(db:Client):Promise<{
 operations:OperationEvidence[];checkedAt:string
}>{
 const checkedAt=new Date().toISOString();
 const root=backupRootPath();
 const [previous,cleanup,artifacts]=await Promise.all([
  marker(root),cleanupMarker(root),inspectUnfinishedBackupArtifacts(root)
 ]);
 const hasMarker=async(name:string)=>{
  try{await lstat(join(root,name));return true;}
  catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return false;throw error;}
 };
 const operations:OperationEvidence[]=[];
 const running=await currentlyRunning(db);
 if(previous){
  const inventory=await backupInventory(root);
  const item=inventory.find(x=>x.id===previous.id);
  operations.push(classifyBackupEvidence({
   operationId:previous.id,startedAt:previous.createdAt,checkedAt,
   marker:previous.status,running:running.backup,
   packageVerified:item?.status==="verified"&&item.integrityVerified===true,
   packageExists:!!item
  }));
 }
 if(!previous&&await hasMarker("last-attempt.json"))
  operations.push(unresolvedOperation("backup",checkedAt,"invalid-operation-marker",1));
 const unpublished=artifacts.stagingBackupIds.filter(id=>
  !(running.backup&&previous?.status==="running"&&previous.id===id)).length+
  artifacts.unknownBackupArtifacts;
 if(unpublished>0)operations.push(unresolvedOperation(
  "backup",checkedAt,"unpublished-backup-artifact",unpublished));
 if(!cleanup&&await hasMarker("last-cleanup.json"))
  operations.push(unresolvedOperation("retention-cleanup",checkedAt,
   "invalid-operation-marker",1));
 const pending=artifacts.retentionPendingIds.filter(id=>
  !(running.cleanup&&cleanup?.status==="running"&&cleanup.inFlight===id)).length+
  artifacts.unknownRetentionArtifacts;
 if(pending>0)operations.push(unresolvedOperation("retention-cleanup",checkedAt,
  "pending-retention-tombstone",pending));
 if(cleanup){
  const recorded=classifyCleanupEvidence({
   operationId:cleanup.operationId,startedAt:cleanup.startedAt,checkedAt,
   planned:cleanup.planned,processed:cleanup.processed,failed:cleanup.failed,
   running:running.cleanup&&cleanup.status==="running"
  });
  // Verify each recorded successful removal through *both* its audit row
  // and absence of the managed package. No success from the journal alone.
  let verified=0;
  let uncertain=cleanup.processed;
  try{
   verified=0;
   for(const id of cleanup.processedIds){
    const audit=await db.query<{n:string}>(`
     SELECT count(*)::text AS n FROM public.smn_backup_retention_audit
     WHERE package_id=$1 AND action='package_deleted'`,[id]);
    const exists=await lstat(join(root,"packages",id)).then(()=>true,
     (error:NodeJS.ErrnoException)=>{if(error.code==="ENOENT")return false;throw error;});
    if(!exists&&Number(audit.rows[0]?.n)>=1)verified++;
   }
   uncertain=cleanup.processed-verified;
  }catch{verified=0;uncertain=cleanup.processed;}
  const fullyVerified=cleanup.status==="success"&&
   verified===cleanup.planned&&cleanup.failed===0&&cleanup.inFlight===null&&pending===0;
  operations.push({...recorded,
   status:fullyVerified?"succeeded":
    running.cleanup&&cleanup.status==="running"?"running":
    verified>0||uncertain>0||cleanup.inFlight||pending>0?"partial":"interrupted",
   reason:fullyVerified?"cleanup-complete":
    verified>0||uncertain>0||cleanup.inFlight||pending>0?"partial-cleanup":"unverifiable-state",
   recovery:fullyVerified?"recheck":"reinspect-inventory-before-retry",
   processed:verified,
   unprocessed:Math.max(0,cleanup.planned-verified-cleanup.failed),
   failed:cleanup.failed+uncertain
  });
 }
 operations.push(blockedOperation("restore",checkedAt));
 operations.push(blockedOperation("installation-reset",checkedAt));
 return {operations,checkedAt};
}
