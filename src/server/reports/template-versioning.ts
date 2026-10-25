import type {Client} from "pg";
import {getReportDocument} from "./report-documents";
import {listReportTemplates} from "./templates";
import type {ReportTemplate} from "@/lib/report-templates";

type Snapshot={id:string;revision:number;sections:ReportTemplate["sections"];content:ReportTemplate["content"]};
export function compareTemplateVersions(snapshot:Snapshot,current:ReportTemplate){
 const sectionChanges=JSON.stringify(snapshot.sections)!==JSON.stringify(current.sections);
 const contentChanges=JSON.stringify(snapshot.content)!==JSON.stringify(current.content);
 return {fromVersion:snapshot.revision,toVersion:current.revision,
  sectionsChanged:sectionChanges,contentChanged:contentChanges,
  isNewer:current.revision>snapshot.revision};
}
export async function readTemplateUpdateOffer(db:Client,sprintId:string,documentId:string){
 const doc=await getReportDocument(db,sprintId,documentId);
 if(!doc)return null;
 const saved=doc.content as {templateSnapshot?:Snapshot}|null;
 const snap=saved?.templateSnapshot;
 if(!snap||snap.id!==doc.templateId||snap.revision!==doc.templateVersion)return {available:false as const,reason:"snapshot-unavailable"};
 const latest=(await listReportTemplates(db)).find(t=>t.id===doc.templateId);
 if(!latest||latest.revision<=doc.templateVersion)return {available:false as const,reason:"up-to-date"};
 return {available:true as const,comparison:compareTemplateVersions(snap,latest)};
}
