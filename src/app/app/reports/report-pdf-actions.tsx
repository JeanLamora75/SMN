"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
export default function ReportPdfActions({sprintId,documentId,readOnly}:{sprintId:string;documentId:string;readOnly:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsPdf."+k) as Parameters<typeof t>[0]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[archiveUrl,setArchiveUrl]=useState("");
 const endpoint="/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/documents/"+encodeURIComponent(documentId)+"/pdf";
 const run=async(archive:boolean,ack=false):Promise<void>=>{
  if(busy||readOnly)return;setBusy(true);setError("");
  try{
   const response=await fetch(endpoint,{method:archive?"PUT":"POST",headers:ack?{"x-smn-ack-warnings":"true"}:{}});
   if(response.status===409){const body=await response.json();if(body.error==="warnings-require-confirmation"&&window.confirm(tr("warnings"))) {setBusy(false);return run(archive,true);}throw Error(tr("warnings"));}
   if(!response.ok)throw Error(tr("failed"));
   if(archive){const result=await response.json() as {archiveId:string};setArchiveUrl("/api/admin/reports/archives/"+encodeURIComponent(result.archiveId)+"/download");}
   else {const blob=await response.blob(),url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="SMN-report.pdf";link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  }catch(e){setError(e instanceof Error?e.message:tr("failed"));}finally{setBusy(false);}
 };
 if(readOnly)return null;
 return <section className="d-flex flex-wrap gap-2 align-items-center border rounded p-3">
  <button className="btn btn-primary" type="button" disabled={busy} onClick={()=>void run(false)}>{tr("export")}</button>
  <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={()=>{if(window.confirm(tr("confirmArchive")))void run(true);}}>{tr("archive")}</button>
  {archiveUrl&&<a href={archiveUrl}>{tr("downloadArchive")}</a>}
  {error&&<p role="alert" className="text-danger mb-0">{error}</p>}
 </section>;
}
