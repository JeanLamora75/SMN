import "server-only";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";
import {backupInventory} from "./verification";
import {backupRootPath} from "./runner";
import {classifyBackupEvidence,classifyCleanupEvidence,blockedOperation,
 type OperationEvidence} from "./operation-diagnostics";
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
 planned:number;processed:number;failed:number};
async function cleanupMarker(root:string):Promise<CleanupMarker|null>{
 try{
  const file=join(root,"last-cleanup.json"),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1200)return null;
  const x=JSON.parse(await readFile(file,"utf8")) as Partial<CleanupMarker>;
  if(!UUID.test(x.operationId??"")||typeof x.startedAt!=="string"||
   !Number.isFinite(Date.parse(x.startedAt))||
   !["running","success","partial","failed"].includes(x.status??"")||
   ![x.planned,x.processed,x.failed].every(v=>Number.isSafeInteger(v)&&v!>=0)||
   x.processed!+x.failed!>x.planned!)return null;
  return x as CleanupMarker;
 }catch{return null;}
}
async function currentlyRunning(db:Client):Promise<boolean>{
 const result=await db.query<{n:string}>(`
  SELECT count(*)::text AS n FROM pg_catalog.pg_locks
  WHERE locktype='advisory' AND granted AND classid=20261021 AND objid=30`);
 return Number(result.rows[0]?.n)>0;
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
 const [previous,cleanup]=await Promise.all([marker(root),cleanupMarker(root)]);
 const operations:OperationEvidence[]=[];
 const running=await currentlyRunning(db);
 if(previous){
  const inventory=await backupInventory(root);
  const item=inventory.find(x=>x.id===previous.id);
  operations.push(classifyBackupEvidence({
   operationId:previous.id,startedAt:previous.createdAt,checkedAt,
   marker:previous.status,running,
   packageVerified:item?.status==="verified"&&item.integrityVerified===true,
   packageExists:!!item
  }));
 }
 if(cleanup){
  const item=classifyCleanupEvidence({
   operationId:cleanup.operationId,startedAt:cleanup.startedAt,checkedAt,
   planned:cleanup.planned,processed:cleanup.processed,failed:cleanup.failed,
   running:running&&cleanup.status==="running"
  });
  // The progress journal is not a transaction: on restart, an unfinalized
  // operation is never declared successful, even if all recorded steps finished.
  operations.push(cleanup.status==="running"&&!running?{
   ...item,status:item.processed>0?"partial":"interrupted",
   reason:item.processed>0?"partial-cleanup":"unverifiable-state",
   recovery:"reinspect-inventory-before-retry"
  }:item);
 }
 operations.push(blockedOperation("restore",checkedAt));
 operations.push(blockedOperation("installation-reset",checkedAt));
 return {operations,checkedAt};
}
