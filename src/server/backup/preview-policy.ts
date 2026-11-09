import type {BackupInventoryEntry} from "./verification";
export type PreviewIssue="archive-not-verified"|"source-unconfirmed"|"different-installation"|
 "schema-newer"|"schema-older"|"postgres-incompatible"|"application-incompatible"|
 "privacy-not-cleared"|"snapshot-older"|"current-documents-unavailable"|"current-unavailable";
export type CurrentBackupState=Readonly<{
 installationSource:string;schemaVersion:number;postgresVersion:string;
 applicationVersion:string;documentCount:number|null;
}>;
/** Pure policy: a preview cannot grant permission to restore. */
export function evaluatePreview(archive:BackupInventoryEntry,current:CurrentBackupState,
 now=new Date()):PreviewIssue[]{
 const issues:PreviewIssue[]=[];
 if(archive.status!=="verified"||!archive.integrityVerified)issues.push("archive-not-verified");
 if(!archive.installationSource||archive.installationSource==="singleton (legacy)")
  issues.push("source-unconfirmed");
 else if(archive.installationSource!==current.installationSource)
  issues.push("different-installation");
 if(archive.schemaVersion!==null){
  if(archive.schemaVersion>current.schemaVersion)issues.push("schema-newer");
  if(archive.schemaVersion<current.schemaVersion)issues.push("schema-older");
 }
 if(!archive.postgresVersion||archive.postgresVersion.split(".")[0]!==current.postgresVersion.split(".")[0])
  issues.push("postgres-incompatible");
 if(!archive.applicationVersion||archive.applicationVersion!==current.applicationVersion)
  issues.push("application-incompatible");
 if(archive.createdAt&&new Date(archive.createdAt).getTime()<now.getTime()-60_000)
  issues.push("snapshot-older");
 if(current.documentCount===null)issues.push("current-documents-unavailable");
 // SMN-40 must establish the erasure ledger before any restore is authorized.
 issues.push("privacy-not-cleared");
 return issues;
}

