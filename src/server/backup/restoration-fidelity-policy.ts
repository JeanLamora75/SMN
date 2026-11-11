import type {FingerprintSet} from "./restore-row-fingerprint";

/**
 * A backup used for migration or recovery must preserve legitimate personal
 * records, including names and their history. Exceptional erasure is a separate
 * operation and is never inferred merely from identifiability.
 */
export type RecoveryPurpose="computer-migration"|"incident-recovery";
export type RestoreDataHandling=Readonly<{
 purpose:RecoveryPurpose;
 memberIdentity:"preserve" ;
 historicalAssignments:"preserve";
 archivedMembers:"preserve";
 metricsAndReports:"preserve";
 exceptionalErasure:"independent-explicit-workflow";
 automaticAnonymization:false;
}>;
export function recoveryDataHandling(purpose:RecoveryPurpose):RestoreDataHandling{
 if(purpose!=="computer-migration"&&purpose!=="incident-recovery")
  throw Error("unsupported-recovery-purpose");
 return {purpose,memberIdentity:"preserve",historicalAssignments:"preserve",
  archivedMembers:"preserve",metricsAndReports:"preserve",
  exceptionalErasure:"independent-explicit-workflow",
  automaticAnonymization:false};
}
const REQUIRED=[
 "smn_member","smn_member_assignment","smn_member_assignment_version",
 "smn_member_identity_history","smn_member_absence",
 "smn_member_calendar_week","smn_sprint","smn_indicator_definition",
 "smn_indicator_manual_value","smn_indicator_computed_result"
] as const;
/** Verification only. Does not compare the archive to the live state at capture. */
export function assessMemberHistoryRestoration(
 first:FingerprintSet,second:FingerprintSet){
 const a=new Map(first.tables.map(x=>[x.table,x]));
 const b=new Map(second.tables.map(x=>[x.table,x]));
 const missing=REQUIRED.filter(t=>!a.has(t)||!b.has(t));
 const altered=REQUIRED.filter(t=>{
  const left=a.get(t),right=b.get(t);
  return !!left&&!!right&&(left.rows!==right.rows||left.sha256!==right.sha256);
 });
 return {requiredTableCount:REQUIRED.length,
  missingRequiredTableCount:missing.length,
  differingRequiredTableCount:altered.length,
  memberHistoryEvidenceEquivalent:missing.length===0&&altered.length===0,
  personalDataAbsent:false as const,
  identityRedactionNeeded:false as const,
  productionRestorationAuthorized:false as const};
}
