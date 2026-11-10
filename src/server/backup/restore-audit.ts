import type {RestorePreview} from "./preview";
import type {ErasureEvidence} from "./erasure-protection";
import type {ErasureIntegrity} from "./erasure-completeness";
import {assessRestoreGate} from "./restore-readiness";

/**
 * Sanitized, read-only operator diagnostic. An inventory or a green sandbox
 * cannot certify historical erasure coverage, stop the real Windows service,
 * or replace a witnessed end-to-end recovery drill.
 *
 * This function has NO activation capability; no caller input can set
 * canActivate to true.
 */
export type RestoreAuditInput=Readonly<{
 preview:RestorePreview;
 privacy:ErasureEvidence;
 erasureIntegrity:ErasureIntegrity|null;
 archiveInventory:Readonly<{complete:boolean;counts:Readonly<{
  pdf:number;officeReports:number;officeTemplates:number;privateFiles:number
 }>}>|null;
 platform:string;
 concurrentDatabaseConnections:number|null;
}>;

export type RestoreAuditReport=Readonly<{
 version:1;archiveId:string;checkedAt:string;mode:"read-only";
 canActivate:false;preflightBlockers:readonly string[];
 privacy:Readonly<{status:"blocked";ledgerState:"verified"|"unavailable";
  integrityComplete:boolean;integrityReason:string;coverageComplete:false}>;
 archives:Readonly<{status:"unverified"|"human-review-required"|"inventory-empty-not-cleared";
  inspectionComplete:false;counts:Readonly<{pdf:number;officeReports:number;officeTemplates:number;privateFiles:number}>|null}>;
 execution:Readonly<{status:"not-qualified";productionCutover:false;
  persistentSessionsProven:false;writersStoppedProven:false;
  databaseConnections:Readonly<{status:"unverifiable"|"connections-present"|"none-observed";count:number|null;provesOffline:false}>}>;
 windowsRecette:Readonly<{status:"not-performed";actualWindowsHost:boolean;
  scenariosRequired:14;scenariosWitnessed:0}>;
}>;

export function assessRestoreAudit(input:RestoreAuditInput):RestoreAuditReport{
 const gate=assessRestoreGate(input.preview,input.privacy);
 const counts=input.archiveInventory?.counts??null;
 const archiveTotal=counts?
  counts.pdf+counts.officeReports+counts.officeTemplates+counts.privateFiles:null;
 const validCounts=counts!==null&&
  Object.values(counts).every(v=>Number.isSafeInteger(v)&&v>=0);
 const archiveStatus:RestoreAuditReport["archives"]["status"]=
  !input.archiveInventory?.complete||!validCounts?"unverified":
  archiveTotal===0?"inventory-empty-not-cleared":"human-review-required";
 return {
  version:1,archiveId:input.preview.id,checkedAt:new Date().toISOString(),
  mode:"read-only",canActivate:false,preflightBlockers:gate.blockers,
  privacy:{status:"blocked",ledgerState:input.privacy.state,
   integrityComplete:input.erasureIntegrity?.complete===true,
   integrityReason:input.erasureIntegrity?.reason??"unavailable",
   coverageComplete:false},
  archives:{status:archiveStatus,inspectionComplete:false,
   counts:validCounts?counts:null},
  execution:{status:"not-qualified",productionCutover:false,
   persistentSessionsProven:false,writersStoppedProven:false,
   databaseConnections:assessObservedConnections(input.concurrentDatabaseConnections)},
  windowsRecette:{status:"not-performed",actualWindowsHost:input.platform==="win32",
   scenariosRequired:14,scenariosWitnessed:0}
 };
}

/** Observing no PostgreSQL connections is never an offline-exclusivity proof.
 * SQL permissions, external writers and race conditions remain unknown. */
export function assessObservedConnections(count:number|null):RestoreAuditReport["execution"]["databaseConnections"]{
 if(count===null||!Number.isSafeInteger(count)||count<0)
  return {status:"unverifiable",count:null,provesOffline:false};
 return {status:count>0?"connections-present":"none-observed",
  count,provesOffline:false};
}
