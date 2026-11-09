import type {RestorePreview} from "./preview";
import {evaluateErasureProtection,type ErasureEvidence} from "./erasure-protection";

/** Server-owned evidence ONLY; never deserialize this from a browser. */
export type OfflineRestoreEvidence=Readonly<{
 sandboxRehearsed:boolean;
 sourceCheckpointVerified:boolean;
 allManagedFileVersionsStaged:boolean;
 restorationManifestVerified:boolean;
 appTrafficDrained:boolean;
 sessionStoreReplaced:boolean;
 databaseCutoverJournalVerified:boolean;
 rollbackDatabaseRetained:boolean;
}>;
export type OfflineRestoreDecision=Readonly<{
 eligible:boolean;blockers:readonly string[];
}>;
/**
 * Eligibility checker, not a cutover executor. The offline operator must
 * independently measure every prerequisite against live and reconstructed
 * source state. A signed v4 archive and a green sandbox test alone are not
 * sufficient to activate old personal data.
 */
export function assessOfflineRestoreActivation(
 preview:RestorePreview,privacy:ErasureEvidence,
 evidence:OfflineRestoreEvidence
):OfflineRestoreDecision{
 const blockers:string[]=[];
 if(preview.archive.status!=="verified"||!preview.archive.integrityVerified||
  preview.archive.scopeComplete!==true)
  blockers.push("package-integrity-unverified");
 if(preview.archive.installationSource!==preview.current.installationSource)
  blockers.push("installation-identity-mismatch");
 if(preview.archive.schemaVersion!==preview.current.schemaVersion||
  preview.archive.postgresVersion?.split(".")[0]!==preview.current.postgresVersion.split(".")[0]||
  preview.archive.applicationVersion!==preview.current.applicationVersion)
  blockers.push("runtime-compatibility-unverified");
 const p=evaluateErasureProtection(preview.archive.createdAt,privacy);
 if(!p.permitted)blockers.push(p.code);
 const requirements={
  sandboxRehearsed:"sandbox-rehearsal-incomplete",
  sourceCheckpointVerified:"source-checkpoint-missing",
  allManagedFileVersionsStaged:"managed-files-not-staged",
  restorationManifestVerified:"file-manifest-unverified",
  appTrafficDrained:"live-traffic-not-drained",
  sessionStoreReplaced:"sessions-not-invalidated",
  databaseCutoverJournalVerified:"cutover-journal-unverified",
  rollbackDatabaseRetained:"rollback-database-unverified"
 } as const;
 for(const [name,code] of Object.entries(requirements))
  if(evidence[name as keyof OfflineRestoreEvidence]!==true)blockers.push(code);
 // Approval is not an execution token. No production activation endpoint
 // is provided by this module.
 return {eligible:blockers.length===0,blockers};
}
