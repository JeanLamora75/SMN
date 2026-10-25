import {createHash} from "node:crypto";
import type {ReportDocument} from "./report-documents";
/** Deterministic fingerprint of the exact persisted report input used by PDF rendering. */
function canonical(value:unknown):string{
 if(value===null||typeof value!=="object")return JSON.stringify(value)??"null";
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 const record=value as Record<string,unknown>;
 return "{"+Object.keys(record).sort().filter(key=>record[key]!==undefined).map(key=>JSON.stringify(key)+":"+canonical(record[key])).join(",")+"}";
}
export function studioArchiveReference(doc:ReportDocument){
 const payload={documentId:doc.id,documentRevision:doc.revision,sprintId:doc.sprintId,teamId:doc.teamId,
 title:doc.title,language:doc.language,templateId:doc.templateId,templateVersion:doc.templateVersion,content:doc.content};
 return {documentId:doc.id,documentRevision:doc.revision,sourceSha256:createHash("sha256").update(canonical(payload)).digest("hex")};
}
