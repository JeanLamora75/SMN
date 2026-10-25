import type {Client} from "pg";
import {getReportDocument} from "./report-documents";
import {inspectDocumentQuality} from "@/lib/report-export-quality";
export async function inspectPdfEligibility(db:Client,sprintId:string,documentId:string){
 const doc=await getReportDocument(db,sprintId,documentId);
 if(!doc)return null;
 const issues=inspectDocumentQuality(doc.content);
 return {document:doc,warnings:issues.filter(i=>i.severity==="warning"),errors:issues.filter(i=>i.severity==="error"),exportable:issues.every(i=>i.severity!=="error")};
}
