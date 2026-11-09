/**
 * SMN-37: a reset is never authorized by a preview or a typed phrase alone.
 * Missing verified rollback, protected erasure history and coordinated
 * database/file cutover are hard blockers, not user-overridable warnings.
 */
export const RESET_CONFIRMATION="REINITIALISER MON INSTALLATION" as const;
export const RESET_RISKS=[
 "database-overwrite","private-files","archives-and-snapshots",
 "accounts-and-sessions","historical-links","erasure-ledger",
 "backup-before-reset","rollback-not-qualified","external-copies"
] as const;
export const RESET_BLOCKERS=[
 "rollback-not-qualified","erasure-ledger-not-qualified",
 "files-and-db-atomicity-not-qualified","sessions-not-qualified"
] as const;
export function assessResetRequest(
 confirmation:unknown,adminAuthorized:boolean
):{canExecute:false;reason:"forbidden"|"confirmation-required"|"reset-blocked";
 blockers:readonly string[]}{
 if(!adminAuthorized)return {canExecute:false,reason:"forbidden",blockers:RESET_BLOCKERS};
 if(confirmation!==RESET_CONFIRMATION)return {
  canExecute:false,reason:"confirmation-required",blockers:RESET_BLOCKERS
 };
 return {canExecute:false,reason:"reset-blocked",blockers:RESET_BLOCKERS};
}
