import {createHash} from "node:crypto";
export type ExportOutcome={status:"success";archiveId:string}|{status:"failed";code:ExportFailureCode};
export type ExportFailureCode="pdf-render-failed"|"pdf-invalid"|"archive-write-failed"|"archive-integrity-failed"|"retry-conflict"|"export-unavailable";
export function publicExportFailure(e:unknown):ExportFailureCode{
 if(e instanceof Error&&e.message==="invalid-pdf")return "pdf-invalid";
 if(e instanceof Error&&e.message==="archive-integrity-failed")return "archive-integrity-failed";
 if(e instanceof Error&&e.message==="retry-conflict")return "retry-conflict";
 return "archive-write-failed";
}
/** Only stable event codes may be logged: never raw SQL errors, tokens, file paths or PDF text. */
export function safeExportDiagnostic(code:ExportFailureCode,operationId:string){
 return {event:"smn-report-export",status:"failed" as const,code,
  reference:createHash("sha256").update(operationId).digest("hex").slice(0,16)};
}
export function validExportOperationId(v:unknown):v is string{
 return typeof v==="string"&&/^[a-f0-9-]{36}$/i.test(v);
}
