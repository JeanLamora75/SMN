/**
 * SMN-41 — Never infer success from a request, a stale "success" cache or
 * the absence of a running process. Only materialized and freshly verified
 * results count as success. These diagnostics contain codes and counts only.
 */
export type OperationKind="backup"|"retention-cleanup"|"restore"|"installation-reset";
export type OperationStatus="running"|"succeeded"|"failed"|"cancelled"|"interrupted"|"partial"|"blocked";
export type OperationEvidence=Readonly<{
 kind:OperationKind;operationId:string;startedAt:string;checkedAt:string;
 status:OperationStatus;reason:string;recovery:string;
 processed:number;unprocessed:number;failed:number;
 measuredRpoMinutes:null;measuredRtoMinutes:null;
 indicativeRpoHours:24;indicativeRtoMinutes:60;
 targetsValidated:false;
}>;
export const OBJECTIVES={
 indicativeRpoHours:24,indicativeRtoMinutes:60,targetsValidated:false
} as const;
export const REASONS=[
 "verified-package","package-absent","package-invalid","operation-running",
 "interrupted-before-publication","partial-cleanup","cleanup-complete",
 "cleanup-failed","restore-not-enabled","reset-not-enabled",
 "unverifiable-state","cancelled-before-write"
] as const;
export function sanitizeOperationCode(code:unknown):string{
 return typeof code==="string"&&(REASONS as readonly string[]).includes(code)?
  code:"unverifiable-state";
}
export function classifyBackupEvidence(input:{
 operationId:string;startedAt:string;checkedAt:string;
 marker:"running"|"success"|"failed"|"cancelled";
 running:boolean;packageVerified:boolean;packageExists:boolean;
}):OperationEvidence{
 const status:OperationStatus=input.packageVerified?"succeeded":
  input.running&&input.marker==="running"?"running":
  input.marker==="cancelled"&&!input.packageExists?"cancelled":
  input.marker==="running"?"interrupted":"failed";
 const reason=status==="succeeded"?"verified-package":
  status==="running"?"operation-running":
  status==="interrupted"?"interrupted-before-publication":
  status==="cancelled"?"cancelled-before-write":
  input.packageExists?"package-invalid":"package-absent";
 const recovery=status==="succeeded"?"recheck":
  status==="running"?"wait-and-refresh":
  status==="cancelled"?"start-new-operation":"verify-and-retry-new-operation";
 return {kind:"backup",operationId:input.operationId,startedAt:input.startedAt,
  checkedAt:input.checkedAt,status,reason,recovery,
  processed:status==="succeeded"?1:0,
  unprocessed:status==="succeeded"?0:1,failed:status==="failed"?1:0,
  measuredRpoMinutes:null,measuredRtoMinutes:null,...OBJECTIVES};
}
export function classifyCleanupEvidence(input:{
 operationId:string;startedAt:string;checkedAt:string;
 planned:number;processed:number;failed:number;running:boolean;
}):OperationEvidence{
 const {planned,processed,failed}=input;
 if(![planned,processed,failed].every(Number.isSafeInteger)||
  planned<0||processed<0||failed<0||processed+failed>planned)
  throw Error("cleanup-evidence-invalid");
 const unprocessed=planned-processed-failed;
 const status:OperationStatus=input.running?"running":
  processed===planned?"succeeded":
  processed>0?"partial":"failed";
 return {kind:"retention-cleanup",operationId:input.operationId,
  startedAt:input.startedAt,checkedAt:input.checkedAt,status,
  reason:status==="succeeded"?"cleanup-complete":
   status==="partial"?"partial-cleanup":"cleanup-failed",
  recovery:status==="succeeded"?"recheck":status==="running"?"wait-and-refresh":
   "reinspect-inventory-before-retry",
  processed,failed,unprocessed,
  measuredRpoMinutes:null,measuredRtoMinutes:null,...OBJECTIVES};
}
export function blockedOperation(kind:"restore"|"installation-reset",
 checkedAt:string):OperationEvidence{
 return {kind,operationId:"not-executed",startedAt:checkedAt,checkedAt,
  status:"blocked",reason:kind==="restore"?"restore-not-enabled":"reset-not-enabled",
  recovery:"resolve-blockers",processed:0,failed:0,unprocessed:0,
  measuredRpoMinutes:null,measuredRtoMinutes:null,...OBJECTIVES};
}
