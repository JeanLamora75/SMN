/** Shared Sprint review contract: both sections are edited and versioned independently. */
export const reviewKinds=["manual","ai"] as const;
export type ReviewKind=(typeof reviewKinds)[number];
export type ReviewOrigin="human"|"ai-generated"|"human-edited-ai";
export type ReviewEntry=Readonly<{
 kind:ReviewKind;
 body:string|null;
 revision:number;
 origin:ReviewOrigin|null;
 humanEdited:boolean;
 generationId:string|null;
 updatedAt:string|null;
 updatedBy:string|null;
}>;
export type ReviewProjection=
 |Readonly<{state:"available";source:"current"|"closure-snapshot";snapshotVersion:number|null;
  manual:ReviewEntry;ai:ReviewEntry}>
 |Readonly<{state:"unavailable";reason:"history-missing"|"read-failed"}>;
export const REVIEW_MAX_LENGTH=3000;
export function validReviewKind(raw:unknown):raw is ReviewKind{
 return raw==="manual"||raw==="ai";
}
export function cleanReviewBody(raw:unknown):string|null|undefined{
 if(typeof raw!=="string"||raw.length>REVIEW_MAX_LENGTH)return undefined;
 return raw.trim()||null;
}
export function emptyReview(kind:ReviewKind):ReviewEntry{
 return {kind,body:null,revision:0,origin:null,humanEdited:false,
  generationId:null,updatedAt:null,updatedBy:null};
}
function record(raw:unknown):Record<string,unknown>|null{
 return raw!==null&&typeof raw==="object"&&!Array.isArray(raw)?
  raw as Record<string,unknown>:null;
}
/** Strictly validate persisted and snapshot values; do not invent revisions or provenance. */
export function parseReviewEntry(kind:ReviewKind,raw:unknown):ReviewEntry|null{
 if(raw===null)return emptyReview(kind);
 const entry=record(raw);
 if(!entry||entry.kind!==kind||
  typeof entry.revision!=="number"||
  !Number.isSafeInteger(entry.revision)||entry.revision<1||
  (entry.body!==null&&(typeof entry.body!=="string"||entry.body.length>REVIEW_MAX_LENGTH))||
  !["human","ai-generated","human-edited-ai"].includes(String(entry.origin))||
  typeof entry.humanEdited!=="boolean"||
  (entry.generationId!==null&&typeof entry.generationId!=="string")||
  typeof entry.updatedAt!=="string"||!Number.isFinite(Date.parse(entry.updatedAt))||
  (entry.updatedBy!==null&&typeof entry.updatedBy!=="string"))
  return null;
 return {
  kind,body:entry.body as string|null,revision:entry.revision as number,
  origin:entry.origin as ReviewOrigin,humanEdited:entry.humanEdited as boolean,
  generationId:entry.generationId as string|null,
  updatedAt:entry.updatedAt as string,updatedBy:entry.updatedBy as string|null
 };
}
