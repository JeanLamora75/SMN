import type {ErasureMode} from "./exceptional-erasure-policy";
import type {TableImpact} from "./erasure-impact-graph";

/**
 * SMN-38/39 qualification is a read-only explanation, never an authorization
 * to erase a historical identity. Human content review, collective-data
 * retention decisions and globally complete anti-reintroduction evidence
 * must be provided independently before a new executor can be developed.
 */
export type HistoricalReviewStep=
 "business-history"|"unverified-relations"|"free-text"|
 "archive-content"|"collective-retention"|"reintroduction-proof"|
 "external-copies"|"anonymization-risk";

export type HistoricalPrivacyQualification=Readonly<{
 scope:"bounded-provisional"|"historical-or-unqualified";
 historicalErasurePermitted:false;
 historicalAnonymizationPermitted:false;
 unknownSources:number;
 positiveReferenceSources:number;
 pending:readonly HistoricalReviewStep[];
}>;

export function assessHistoricalPrivacyQualification(input:Readonly<{
 mode:ErasureMode;observedTables:readonly TableImpact[];
 boundedProvisionalEligible:boolean;
}>):HistoricalPrivacyQualification{
 const unknownSources=input.observedTables.filter(x=>
  x.state==="unknown"||x.count===null).length;
 const positiveReferenceSources=input.observedTables.filter(x=>
  x.state==="inspected"&&x.count!==null&&x.count>0&&
  x.category!=="personal-records").length;
 if(input.boundedProvisionalEligible&&input.mode==="erase")
  return {scope:"bounded-provisional",historicalErasurePermitted:false,
   historicalAnonymizationPermitted:false,unknownSources,
   positiveReferenceSources,pending:[]};
 const pending:HistoricalReviewStep[]=["business-history"];
 if(unknownSources)pending.push("unverified-relations");
 if(input.observedTables.some(x=>x.category==="free-text"&&
  (x.state==="unknown"||x.count===null||x.count>0)))
  pending.push("free-text");
 pending.push("archive-content","collective-retention",
  "reintroduction-proof","external-copies");
 if(input.mode==="anonymize")pending.push("anonymization-risk");
 return {scope:"historical-or-unqualified",
  historicalErasurePermitted:false,historicalAnonymizationPermitted:false,
  unknownSources,positiveReferenceSources,pending};
}
