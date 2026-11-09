/**
 * SMN-40 — Privacy barrier for restoring older backups.
 *
 * A verified backup proves byte integrity, NOT that its personal data may
 * legally be put back into circulation. Erasure evidence must come from a
 * protected store outside the PostgreSQL database being replaced.
 */
export type ErasureEvidence =
 | Readonly<{state:"unavailable";reason:"ledger-not-implemented"|"ledger-unavailable"|"ledger-untrusted"}>
 | Readonly<{state:"verified";source:"external-append-only";coverageStart:string;
   checkedAt:string;latestErasureAt:string|null;entriesAfterBackup:number;
   signatureVerified:true;completeHistory:boolean}>;

export type PrivacyDecision=Readonly<{
 permitted:boolean;
 code:"missing-backup-date"|"untrusted-erasure-history"|"coverage-gap"|
 "previously-erased-data"|"privacy-check-passed";
 note:"external-copies-not-controlled";
}>;

function validUtc(value:string):boolean{
 const ms=Date.parse(value);
 return Number.isFinite(ms)&&new Date(ms).toISOString()===value;
}

/** Pure fail-closed verdict: no user-supplied permission flags. */
export function evaluateErasureProtection(
 backupCreatedAt:string|null,evidence:ErasureEvidence
):PrivacyDecision{
 const deny=(code:PrivacyDecision["code"]):PrivacyDecision=>({
  permitted:false,code,note:"external-copies-not-controlled"
 });
 if(!backupCreatedAt||!validUtc(backupCreatedAt))return deny("missing-backup-date");
 if(evidence.state!=="verified"||evidence.source!=="external-append-only"||
  evidence.signatureVerified!==true||evidence.completeHistory!==true||
  !validUtc(evidence.coverageStart)||!validUtc(evidence.checkedAt)||
  (evidence.latestErasureAt!==null&&!validUtc(evidence.latestErasureAt))||
  !Number.isSafeInteger(evidence.entriesAfterBackup)||evidence.entriesAfterBackup<0)
  return deny("untrusted-erasure-history");
 if(evidence.coverageStart>backupCreatedAt||evidence.checkedAt<backupCreatedAt||
  (evidence.latestErasureAt!==null&&evidence.latestErasureAt>evidence.checkedAt))
  return deny("coverage-gap");
 if(evidence.entriesAfterBackup>0||
  (evidence.latestErasureAt!==null&&evidence.latestErasureAt>backupCreatedAt))
  return deny("previously-erased-data");
 return {permitted:true,code:"privacy-check-passed",note:"external-copies-not-controlled"};
}

/**
 * A configured ledger covers only the period since its explicitly anchored
 * enrollment. Never interpret earlier history as complete or automatically
 * trust missing files as an empty journal.
 */
export async function currentErasureEvidence(
 backupCreatedAt?:string
):Promise<ErasureEvidence>{
 if(!backupCreatedAt||!validUtc(backupCreatedAt))
  return {state:"unavailable",reason:"ledger-untrusted"};
 try{
  const {readErasureLedger}=await import("./erasure-ledger");
  const state=await readErasureLedger();
  const {hasUnresolvedErasureIntent}=await import("./erasure-intent");
  if(await hasUnresolvedErasureIntent())
   return {state:"unavailable",reason:"ledger-untrusted"};
  // A missing pre-enrollment history must never turn into a false permission.
  if(state.coverageStart>backupCreatedAt)
   return {state:"unavailable",reason:"ledger-untrusted"};
  const subsequent=state.markers.filter(entry=>entry.occurredAt>backupCreatedAt);
  // No destructive SMN-39 executor or SMN-36 audit bridge is wired yet.
  // Therefore the cryptographic chain is authentic but NOT a complete
  // history of every possible personal-data deletion in this installation.
  return {state:"verified",source:"external-append-only",
   coverageStart:state.coverageStart,checkedAt:state.checkedAt,
   latestErasureAt:state.markers.at(-1)?.occurredAt??null,
   entriesAfterBackup:subsequent.length,
   signatureVerified:true,completeHistory:false};
 }catch{
  return {state:"unavailable",reason:"ledger-unavailable"};
 }
}
