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
   signatureVerified:true;completeHistory:true}>;

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
 if(evidence.coverageStart>backupCreatedAt)return deny("coverage-gap");
 if(evidence.entriesAfterBackup>0||
  (evidence.latestErasureAt!==null&&evidence.latestErasureAt>backupCreatedAt))
  return deny("previously-erased-data");
 return {permitted:true,code:"privacy-check-passed",note:"external-copies-not-controlled"};
}

/**
 * No trusted immutable erasure source has been delivered by SMN-39.
 * Do not interpret absence of entries as evidence of absence of erasures.
 */
export async function currentErasureEvidence():Promise<ErasureEvidence>{
 return {state:"unavailable",reason:"ledger-not-implemented"};
}
