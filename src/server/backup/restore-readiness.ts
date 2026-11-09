import type {RestorePreview} from "./preview";

export type RestoreGate={
 decision:"blocked";archiveId:string;checkedAt:string;
 blockers:readonly string[];warnings:readonly string[];
 approval:"required-after-qualification";canExecute:false;
};
/**
 * SMN-34: never treat successful archive verification as permission to overwrite
 * an installation. Restoring requires an isolated pg_restore rehearsal, a
 * recoverable checkpoint, a privacy erasure check (SMN-40), and a proven cutover.
 * These prerequisites cannot be bypassed through client-provided flags.
 */
export function assessRestoreGate(preview:RestorePreview):RestoreGate{
 const blockers=new Set<string>();
 const warnings:string[]=[];
 if(preview.archive.status!=="verified"||!preview.archive.integrityVerified)
  blockers.add("archive-not-verified");
 if(preview.archive.installationSource!==preview.current.installationSource)
  blockers.add("different-installation");
 if(preview.archive.schemaVersion!==preview.current.schemaVersion)
  blockers.add("schema-incompatible");
 if(preview.archive.postgresVersion?.split(".")[0]!==preview.current.postgresVersion.split(".")[0])
  blockers.add("postgres-incompatible");
 if(preview.archive.applicationVersion!==preview.current.applicationVersion)
  blockers.add("application-incompatible");
 if(preview.current.documentCount===null)blockers.add("current-documents-unavailable");
 if(!preview.archive.createdAt)blockers.add("archive-date-unavailable");
 if(preview.issues.includes("snapshot-older"))warnings.push("potential-data-loss");
 // These cannot be inferred from the presence of a backup or asserted by a request.
 blockers.add("privacy-erasures-unverified");
 blockers.add("isolated-restore-unverified");
 blockers.add("rollback-checkpoint-unverified");
 blockers.add("atomic-cutover-unverified");
 blockers.add("session-reset-unverified");
 return {decision:"blocked",archiveId:preview.id,checkedAt:new Date().toISOString(),
  blockers:[...blockers],warnings,approval:"required-after-qualification",canExecute:false};
}
