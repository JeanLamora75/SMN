import type {Client} from "pg";
import type {ReportDocument} from "./report-documents";
import {getReportDocument} from "./report-documents";
import {inspectDocumentQuality} from "@/lib/report-export-quality";
import {isReportBlock} from "@/lib/report-studio-blocks";
export async function inspectPdfEligibility(db:Client,sprintId:string,documentId:string){
 const doc=await getReportDocument(db,sprintId,documentId);
 if(!doc)return null;
 return inspectStudioDocumentEligibility(doc);
}
export function inspectStudioDocumentEligibility(doc:ReportDocument){
 const issues=inspectDocumentQuality(doc.content);
 const content=doc.content as {blocks?:unknown[];sections?:Array<{key:string;visible:boolean}>}|null;
 const visibleSections=new Set((Array.isArray(content?.sections)?content.sections:[]).filter(x=>x.visible).map(x=>x.key));
 // Fail closed: current PDF renderer cannot faithfully reproduce these visual blocks.
 for(const block of Array.isArray(content?.blocks)?content.blocks:[]){
  if(isReportBlock(block)&&block.visible&&visibleSections.has(block.sectionKey)&&["chart","image","table"].includes(block.kind))
   issues.push({code:"unsupported-pdf-block",severity:"error",target:block.sectionKey});
 }
 return {document:doc,warnings:issues.filter(i=>i.severity==="warning"),errors:issues.filter(i=>i.severity==="error"),exportable:issues.every(i=>i.severity!=="error")};
}
