import "server-only";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";
import {backupInventory} from "./verification";
import {backupRootPath} from "./runner";
import {classifyBackupEvidence,blockedOperation,
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
 const previous=await marker(root);
 const operations:OperationEvidence[]=[];
 if(previous){
  const [inventory,running]=await Promise.all([backupInventory(root),currentlyRunning(db)]);
  const item=inventory.find(x=>x.id===previous.id);
  operations.push(classifyBackupEvidence({
   operationId:previous.id,startedAt:previous.createdAt,checkedAt,
   marker:previous.status,running,
   packageVerified:item?.status==="verified"&&item.integrityVerified===true,
   packageExists:!!item
  }));
 }
 operations.push(blockedOperation("restore",checkedAt));
 operations.push(blockedOperation("installation-reset",checkedAt));
 return {operations,checkedAt};
}
