"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useReportEditing} from "./report-editing-context";
export default function ReportPdfActions({sprintId,documentId,readOnly,teamId}:{sprintId:string;documentId:string;readOnly:boolean;teamId?:string}){
 const editing=useReportEditing();
 const t=useTranslation(),tr=(k:string)=>t(("reportsPdf."+k) as Parameters<typeof t>[0]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[archiveUrl,setArchiveUrl]=useState("");
 const endpoint="/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/documents/"+encodeURIComponent(documentId)+"/pdf"+(teamId?"?teamId="+encodeURIComponent(teamId):"");
 const run=async(archive:boolean,ack=false):Promise<void>=>{
  if(busy||readOnly||editing.busy||editing.dirty)return;setBusy(true);setError("");
  try{
   const response=await fetch(endpoint,{method:archive?"PUT":"POST",headers:{"x-smn-expected-revision":String(editing.revision),...(ack?{"x-smn-ack-warnings":"true"}:{})}});
   if(response.status===409){const body=await response.json();if(body.error==="warnings-require-confirmation"&&window.confirm(tr("warnings"))) {setBusy(false);return run(archive,true);}throw Error(tr("warnings"));}
   if(!response.ok)throw Error(tr("failed"));
   if(archive){const result=await response.json() as {archiveId:string};setArchiveUrl("/api/admin/reports/archives/"+encodeURIComponent(result.archiveId)+"/download"+(teamId?"?teamId="+encodeURIComponent(teamId):""));}
   else {const blob=await response.blob(),url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="SMN-report.pdf";link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  }catch(e){setError(e instanceof Error?e.message:tr("failed"));}finally{setBusy(false);}
 };
 if(readOnly)return null;
 return <section className="d-flex flex-wrap gap-2 align-items-center border rounded p-3">
  <button className="btn btn-primary" type="button" disabled={busy||editing.busy||editing.dirty} onClick={()=>void run(false)}>{tr("export")}</button>
  <button className="btn btn-outline-secondary" type="button" disabled={busy||editing.busy||editing.dirty} onClick={()=>{if(window.confirm(tr("confirmArchive")))void run(true);}}>{tr("archive")}</button>
  {(editing.dirty||editing.busy)&&<p role="status">{tr("saveFirst")}</p>}
  {archiveUrl&&<a href={archiveUrl}>{tr("downloadArchive")}</a>}
  {error&&<p role="alert" className="text-danger mb-0">{error}</p>}
 </section>;
}
