/**
 * SMN-39 — exceptional personal-data erasure/anonymisation policy.
 * Pure validation: this is NOT a deletion service and does not establish
 * that a name has become anonymous. No caller-controlled "force" override.
 */
export type ErasureMode="erase"|"anonymize";
export type ImpactCategory="personal-records"|"associations"|"calendars"|"history"|
 "free-text"|"private-files"|"archived-pdf-txt"|"collective-indicators"|"managed-backups";
export const IMPACT_CATEGORIES:readonly ImpactCategory[]=[
 "personal-records","associations","calendars","history","free-text","private-files",
 "archived-pdf-txt","collective-indicators","managed-backups"
];
export type ImpactFinding=Readonly<{
 category:ImpactCategory;
 state:"inspected"|"unknown"|"failed";
 affectedCount:number|null;
 action:"erase"|"restrict-access"|"redact-as-new-version"|"preserve-with-justification"|"review";
 justificationRecorded:boolean;
 reidentificationRisk:"excluded"|"possible"|"unknown";
}>;
export type ErasureImpactPlan=Readonly<{
 planId:string;installationId:string;subjectToken:string;mode:ErasureMode;
 capturedAt:string;expiresAt:string;scopeRevision:string;
 findings:readonly ImpactFinding[];
 backupAndExternalCopyWarningAcknowledged:boolean;
}>;
export type ErasureGuard=Readonly<{
 decision:"blocked"|"eligible-for-confirmation";
 blockers:readonly string[];
 requiresDistinctConfirmation:true;
}>;
const iso=(x:string)=>typeof x==="string"&&!Number.isNaN(Date.parse(x))&&
 new Date(x).toISOString()===x;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Uses accepted UUID form, not an arbitrary client-provided path.
const safeId=(value:string)=>/^[a-zA-Z0-9_-]{8,120}$/.test(value);
export function assessErasurePlan(plan:ErasureImpactPlan,now=new Date()):ErasureGuard{
 const blockers=new Set<string>();
 if(!safeId(plan.planId)||!safeId(plan.installationId)||!safeId(plan.subjectToken)||
  !safeId(plan.scopeRevision)||!["erase","anonymize"].includes(plan.mode))
  blockers.add("invalid-scope");
 if(!iso(plan.capturedAt)||!iso(plan.expiresAt)||!Number.isFinite(now.getTime())||
  Date.parse(plan.capturedAt)>now.getTime()||
  Date.parse(plan.expiresAt)<=now.getTime()||
  Date.parse(plan.expiresAt)-Date.parse(plan.capturedAt)>15*60_000)
  blockers.add("stale-impact");
 if(plan.backupAndExternalCopyWarningAcknowledged!==true)
  blockers.add("backup-warning-unacknowledged");
 if(plan.findings.length!==IMPACT_CATEGORIES.length||
  new Set(plan.findings.map(f=>f.category)).size!==IMPACT_CATEGORIES.length||
  IMPACT_CATEGORIES.some(category=>!plan.findings.some(f=>f.category===category)))
  blockers.add("impact-incomplete");
 for(const finding of plan.findings){
  if(!IMPACT_CATEGORIES.includes(finding.category)||finding.state!=="inspected"||
   !Number.isSafeInteger(finding.affectedCount)||finding.affectedCount===null||
   finding.affectedCount<0)blockers.add("impact-incomplete");
  if(finding.affectedCount!==null&&finding.affectedCount>0){
   if(finding.action==="review"||!finding.justificationRecorded)
    blockers.add("action-unjustified");
   if(finding.category==="archived-pdf-txt"&&
    !["restrict-access","redact-as-new-version"].includes(finding.action))
    blockers.add("immutable-archive");
   if(finding.category==="collective-indicators"&&
    finding.action==="preserve-with-justification"&&
    finding.reidentificationRisk!=="excluded")
    blockers.add("collective-reidentification-risk");
   if(plan.mode==="anonymize"&&finding.reidentificationRisk!=="excluded")
    blockers.add("anonymization-unproven");
  }
 }
 return {decision:blockers.size?"blocked":"eligible-for-confirmation",
  blockers:[...blockers],requiresDistinctConfirmation:true};
}
export type ErasureConfirmation=Readonly<{
 planId:string;scopeRevision:string;confirmedText:string;
}>;
export function isDistinctErasureConfirmation(
 plan:ErasureImpactPlan,confirmation:ErasureConfirmation
):boolean{
 return confirmation.planId===plan.planId&&
  confirmation.scopeRevision===plan.scopeRevision&&
  confirmation.confirmedText==="EFFACER "+plan.planId;
}
