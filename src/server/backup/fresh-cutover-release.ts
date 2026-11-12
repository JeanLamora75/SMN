import {lstat,readFile,rename} from "node:fs/promises";
import {join} from "node:path";
import {canBindLoopback} from "../bootstrap/managed-port";
import {inspectOfflineRestoreMaintenance,localRestoreMaintenanceLockPath,
 restoreMaintenanceMarkerPath} from "./restore-maintenance";
import {inspectOfflineCutoverJournal}
 from "../../../scripts/smn-40-cutover-postcheck";

/** Final OFFLINE operator release. The source must have been independently
 * frozen and retired; there is no trusted remote source handshake.
 * The marker is ARCHIVED, not deleted, and remains in effect until the
 * last local rename succeeds. Restarting the web server creates a fresh
 * in-memory session store and requires login again.
 */
export async function releaseVerifiedNewComputerCutover(
 journal:string,receipt:string
){
 if(process.platform!=="win32"||
  process.env.SMN_DATABASE_URL||
  process.env.SMN40_RELEASE_OFFLINE_CONFIRM!==
   "INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED")
  throw Error("migration-release-not-authorized");
 // Signed checks, database/files/ledger equivalence, no PG sessions.
 const report=await inspectOfflineCutoverJournal(journal,receipt);
 const marker=await inspectOfflineRestoreMaintenance();
 const external=restoreMaintenanceMarkerPath();
 if(!marker||marker.purpose!=="offline-restore"||!external)
  throw Error("migration-release-maintenance-not-verified");
 const local=localRestoreMaintenanceLockPath();
 const state=await lstat(local);
 if(!state.isFile()||state.isSymbolicLink()||state.size<20||state.size>2048)
  throw Error("migration-release-local-gate-invalid");
 const localRecord=JSON.parse(await readFile(local,"utf8")) as {
  version?:number;operationId?:string;purpose?:string
 };
 if(localRecord.version!==1||localRecord.operationId!==marker.operationId||
   localRecord.purpose!=="offline-restore")
  throw Error("migration-release-gates-disagree");
 // Ordinary Windows launcher always binds port 3003.
 if(!await canBindLoopback(3003))
  throw Error("migration-release-web-server-still-running");
 const externalParked=external+".released-"+marker.operationId;
 const localParked=join(process.cwd(),"updates",
  "restore-maintenance.released-"+marker.operationId+".json");
 for(const name of [externalParked,localParked]){
  try{await lstat(name);throw Error("migration-release-archive-occupied");}
  catch(e){
   if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
  }
 }
 // The local gate is renamed LAST. A crash between these moves still
 // denies normal SMN launch, requiring explicit manual recovery.
 await rename(external,externalParked);
 await rename(local,localParked);
 return {mode:"offline-migration-release" as const,
  archiveId:report.archiveId,maintenanceReleased:true as const,
  maintenanceEvidencePreserved:true as const,
  localLauncherMayRestart:true as const,
  allSessionsMustBeReauthenticated:true as const,
  sourceRetirementIndependentlyVerified:false as const,
  operatorSignoffRequired:true as const};
}
