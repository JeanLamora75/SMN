/**
 * A historical team metric may be retained only after an independent,
 * revision-bound review excludes indirect reidentification. This policy
 * evaluates evidence; it does NOT grant permission to erase a person.
 * A low risk cannot be inferred from a metric label or an arbitrary
 * minimum headcount alone.
 */
export const COLLECTIVE_FAMILIES=[
 "velocity","capacity","story-points-per-day","sprint-report",
 "indicator-v33","dashboard-builder","frozen-snapshot"
] as const;
export type CollectiveFamily=typeof COLLECTIVE_FAMILIES[number];
export type CollectiveRetentionReview=Readonly<{
 family:CollectiveFamily;
 action:"preserve"|"redact"|"remove";
 revisionSha256:string;
 reviewedRevisionSha256:string;
 reviewedAt:string;
 reviewerId:string;
 justification:string;
 /** Review covers composition, single-member teams and indirect clues. */
 directIdentifiersExcluded:boolean;
 indirectIdentifiersExcluded:boolean;
 smallCohortInferenceExcluded:boolean;
 crossReportCorrelationExcluded:boolean;
 historicalSnapshotsChecked:boolean;
}>;
export type CollectiveRetentionVerdict=Readonly<{
 decision:"preserve-with-justification"|"requires-redaction-or-removal"|"blocked";
 code:"qualified"|"redaction-or-removal-required"|"insufficient-evidence";
 canAuthorizeErasure:false;
}>;
const SHA=/^[a-f0-9]{64}$/;
const reviewDate=(v:string)=>typeof v==="string"&&
 Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
/**
 * Redaction and removal must be separately verified in the underlying data
 * and archives. This return value never proves they were carried out.
 */
export function assessCollectiveRetention(
 review:CollectiveRetentionReview|null,now=new Date()
):CollectiveRetentionVerdict{
 const blocked:CollectiveRetentionVerdict={
  decision:"blocked",code:"insufficient-evidence",canAuthorizeErasure:false
 };
 if(!review||!COLLECTIVE_FAMILIES.includes(review.family)||
  !SHA.test(review.revisionSha256)||
  review.reviewedRevisionSha256!==review.revisionSha256||
  !reviewDate(review.reviewedAt)||!Number.isFinite(now.getTime())||
  Date.parse(review.reviewedAt)>now.getTime()||
  !review.reviewerId.trim()||!review.justification.trim())
  return blocked;
 if(review.action==="redact"||review.action==="remove")
  return {decision:"requires-redaction-or-removal",
   code:"redaction-or-removal-required",canAuthorizeErasure:false};
 if(review.action!=="preserve"||
  !review.directIdentifiersExcluded||
  !review.indirectIdentifiersExcluded||
  !review.smallCohortInferenceExcluded||
  !review.crossReportCorrelationExcluded||
  !review.historicalSnapshotsChecked)return blocked;
 return {decision:"preserve-with-justification",
  code:"qualified",canAuthorizeErasure:false};
}
/**
 * A complete review covers every family; a single unreviewed or unsafe
 * family blocks the entire historical preservation decision.
 */
export function assessCollectiveRetentionSet(
 reviews:readonly CollectiveRetentionReview[],
 now=new Date()
):Readonly<{complete:boolean;canAuthorizeErasure:false;
 preserve:readonly CollectiveFamily[];requiresAction:readonly CollectiveFamily[];
 unresolved:readonly CollectiveFamily[]}>{
 const unique=new Map<CollectiveFamily,CollectiveRetentionReview>();
 const duplicates=new Set<CollectiveFamily>();
 for(const review of reviews){
  if(unique.has(review.family))duplicates.add(review.family);
  unique.set(review.family,review);
 }
 const preserve:CollectiveFamily[]=[],requiresAction:CollectiveFamily[]=[],
  unresolved:CollectiveFamily[]=[];
 for(const family of COLLECTIVE_FAMILIES){
  if(duplicates.has(family)){unresolved.push(family);continue;}
  const outcome=assessCollectiveRetention(unique.get(family)??null,now);
  if(outcome.decision==="preserve-with-justification")preserve.push(family);
  else if(outcome.decision==="requires-redaction-or-removal")
   requiresAction.push(family);
  else unresolved.push(family);
 }
 return {complete:unresolved.length===0&&requiresAction.length===0&&
  reviews.length===COLLECTIVE_FAMILIES.length,
  canAuthorizeErasure:false,preserve,requiresAction,unresolved};
}
