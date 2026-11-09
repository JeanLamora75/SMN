import {randomUUID} from "node:crypto";
import {lstat,rename,rm} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";
import {privateFolder,safeAtomicJson} from "./files";
import type {BackupInventoryEntry} from "./verification";
import {withAtomicBusinessUnit,atomicCommit,atomicAbort} from "./atomic-unit";

const MAX_DAYS=3650;
const DAY_MS=86400_000;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type RetentionPolicy=Readonly<{days:number;revision:number;updatedAt:string}>;
export type RetentionResult={ok:true;policy:RetentionPolicy;changed:boolean}|
 {ok:false;error:"invalid-input"|"conflict"|"unavailable"};

export function parseRetentionInput(input:unknown):{days:number;revision:number}|null{
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const v=input as Record<string,unknown>;
 if(Object.keys(v).length!==2||!Object.hasOwn(v,"days")||!Object.hasOwn(v,"revision")||
  !Number.isSafeInteger(v.days)||typeof v.days!=="number"||v.days<1||v.days>MAX_DAYS||
  !Number.isSafeInteger(v.revision)||typeof v.revision!=="number"||v.revision<0)return null;
 return {days:v.days,revision:v.revision};
}
type Row={days:number;revision:number;updated_at:Date};
const select="SELECT days,revision,updated_at FROM public.smn_backup_retention WHERE installation_id='singleton'";
function project(row:Row):RetentionPolicy{
 if(!Number.isSafeInteger(row.days)||row.days<1||row.days>MAX_DAYS||
  !Number.isSafeInteger(row.revision)||row.revision<0||
  !(row.updated_at instanceof Date)||Number.isNaN(row.updated_at.valueOf()))
  throw new Error("retention-policy-corrupt");
 return {days:row.days,revision:row.revision,updatedAt:row.updated_at.toISOString()};
}
export async function readBackupRetention(client:Client):Promise<RetentionPolicy>{
 const result=await client.query<Row>(select);
 if(result.rowCount!==1)throw new Error("retention-unavailable");
 return project(result.rows[0]);
}
export async function updateBackupRetention(client:Client,actorId:string,
 raw:unknown):Promise<RetentionResult>{
 const input=parseRetentionInput(raw);
 if(!input||!actorId)return {ok:false,error:"invalid-input"};
 return withAtomicBusinessUnit<RetentionResult>(client,async()=>{
  await client.query("SELECT pg_advisory_xact_lock(20261021,30)");
  const existing=await client.query<Row>(select+" FOR UPDATE");
  if(existing.rowCount!==1)
   return atomicAbort({ok:false as const,error:"unavailable" as const});
  const previous=project(existing.rows[0]);
  if(previous.revision!==input.revision)
   return atomicAbort({ok:false as const,error:"conflict" as const});
  if(previous.days===input.days)
   return atomicCommit({ok:true as const,policy:previous,changed:false});
  const updated=await client.query<Row>(`UPDATE public.smn_backup_retention
    SET days=$1,revision=revision+1,updated_at=now(),updated_by=$2
    WHERE installation_id='singleton' AND revision=$3
    RETURNING days,revision,updated_at`,[input.days,actorId,input.revision]);
  if(updated.rowCount!==1)throw new Error("retention-update-conflict");
  await client.query(`INSERT INTO public.smn_backup_retention_audit
    (id,installation_id,actor_id,action,old_days,new_days)
    VALUES ($1,'singleton',$2,'policy_changed',$3,$4)`,
    [randomUUID(),actorId,previous.days,input.days]);
  return atomicCommit({ok:true as const,policy:project(updated.rows[0]),changed:true});
 });
}

/** Age counted in elapsed UTC days, never from timestamps or paths supplied by the browser. */
export function expiredManagedBackups(entries:readonly BackupInventoryEntry[],days:number,
 now:Date=new Date()):BackupInventoryEntry[]{
 if(!Number.isSafeInteger(days)||days<1||days>MAX_DAYS||!Number.isFinite(now.getTime()))
  throw new Error("retention-policy-invalid");
 const cutoff=now.getTime()-days*DAY_MS;
 return entries.filter(item=>
  UUID.test(item.id)&&item.status==="verified"&&item.integrityVerified===true&&
  typeof item.createdAt==="string"&&
  Number.isFinite(Date.parse(item.createdAt))&&Date.parse(item.createdAt)<cutoff);
}

/** Caller has authenticated, acquired the backup advisory lock and freshly verified this UUID. */
export async function deleteVerifiedManagedPackage(root:string,id:string):Promise<void>{
 if(!UUID.test(id))throw new Error("retention-id-invalid");
 const packages=join(root,"packages");
 await privateFolder(root);
 await privateFolder(packages);
 const target=join(packages,id);
 const stat=await lstat(target);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error("retention-package-invalid");
 const pending=join(packages,".retention-removing-"+id);
 // Never use a user-supplied path. The transient name isn't shown as a valid backup.
 await rename(target,pending);
 await rm(pending,{recursive:true,force:true});
}

/** An active package can never be deleted while the same DB backup lock is held. */
export async function executeBackupRetention(client:Client,root:string,actorId:string,
 expectedRevision:number,confirmedIds:unknown):Promise<
 {ok:true;deleted:string[];days:number;checkedAt:string}|
 {ok:false;error:"invalid-input"|"conflict"|"unavailable"}>{
 if(!actorId||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
  !Array.isArray(confirmedIds)||confirmedIds.length>200||
  confirmedIds.some(id=>typeof id!=="string"||!UUID.test(id))||
  new Set(confirmedIds).size!==confirmedIds.length)
  return {ok:false,error:"invalid-input"};
 // Delayed import keeps pure policy helpers independent from verification infrastructure.
 const {backupInventory}=await import("./verification");
 const lock=await client.query<{acquired:boolean}>(
  "SELECT pg_try_advisory_lock(20261021,30) AS acquired");
 if(lock.rows[0]?.acquired!==true)return {ok:false,error:"conflict"};
 try{
  // Distinguish an actual cleanup from policy writes sharing the same lock.
  await client.query("SELECT set_config('application_name','smn-retention-cleanup',false)");
  const policy=await readBackupRetention(client);
  if(policy.revision!==expectedRevision)return {ok:false,error:"conflict"};
  const entries=await backupInventory(root);
  const eligible=expiredManagedBackups(entries,policy.days);
  const expected=[...confirmedIds].sort();
  if(JSON.stringify(eligible.map(e=>e.id).sort())!==JSON.stringify(expected))
   return {ok:false,error:"conflict"};
  const deleted:string[]=[];
  const operationId=randomUUID(),startedAt=new Date().toISOString();
  let inFlight:string|null=null;
  const log=async(status:"running"|"success"|"partial"|"failed",failed:number)=>
   safeAtomicJson(join(root,"last-cleanup.json"),{
    operationId,startedAt,status,planned:eligible.length,
    processed:deleted.length,failed,inFlight,
    plannedIds:eligible.map(x=>x.id),processedIds:[...deleted],
    checkedAt:new Date().toISOString()
   });
  await log("running",0);
  try{
   for(const item of eligible){
    inFlight=item.id;
    await log("running",0);
    await deleteVerifiedManagedPackage(root,item.id);
    await client.query(`INSERT INTO public.smn_backup_retention_audit
      (id,installation_id,actor_id,action,old_days,new_days,package_id)
      VALUES($1,'singleton',$2,'package_deleted',$3,$3,$4)`,
      [randomUUID(),actorId,policy.days,item.id]);
    deleted.push(item.id);
    inFlight=null;
    await log("running",0);
   }
   await log("success",0);
  }catch{
   // The package may have been removed before an audit write failed.
   // No success claim: reconciliation requires inspection of inventory/audit.
   await log(deleted.length>0||inFlight?"partial":"failed",inFlight?1:0)
    .catch(()=>undefined);
   throw new Error("cleanup-interrupted-review-required");
  }
  return {ok:true,deleted,days:policy.days,checkedAt:new Date().toISOString()};
 }finally{
  await client.query("SELECT pg_advisory_unlock(20261021,30)").catch(()=>undefined);
 }
}
