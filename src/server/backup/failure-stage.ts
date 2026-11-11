/** Diagnostic local sans détails d'exception, identifiants ni chemins privés. */
export const BACKUP_FAILURE_STAGES=[
 "connection","schema-check","advisory-lock","record-start",
 "encryption-key","private-documents","office-pdf-inventory","staging",
 "installation-metadata","wal-start","pg-dump","document-encryption",
 "archive-encryption","source-recheck","wal-consistency",
 "manifest-encryption","publication-fence","publish"
] as const;
export type BackupFailureStage=(typeof BACKUP_FAILURE_STAGES)[number];
export function safeBackupFailureStage(value:unknown):BackupFailureStage|"unknown"{
 return typeof value==="string"&&
  (BACKUP_FAILURE_STAGES as readonly string[]).includes(value)
  ?value as BackupFailureStage:"unknown";
}
