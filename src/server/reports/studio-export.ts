import type {Client} from "pg";
import {getReportDocument} from "./report-documents";
import {inspectDocumentQuality} from "@/lib/report-export-quality";
import {isReportBlock} from "@/lib/report-studio-blocks";
export async function inspectPdfEligibility(db:Client,sprintId:string,documentId:string){
 const doc=await getReportDocument(db,sprintId,documentId);
 if(!doc)return null;
 const issues=inspectDocumentQuality(doc.content);
 const content=doc.content as {blocks?:unknown[]}|null;
 // Fail closed: current PDF renderer cannot faithfully reproduce these visual blocks.
 for(const block of Array.isArray(content?.blocks)?content.blocks:[]){
  if(isReportBlock(block)&&block.visible&&["chart","image","table"].includes(block.kind))
   issues.push({code:"invalid-block",severity:"error",target:block.sectionKey});
 }
 return {document:doc,warnings:issues.filter(i=>i.severity==="warning"),errors:issues.filter(i=>i.severity==="error"),exportable:issues.every(i=>i.severity!=="error")};
}
