"use client";
import {useState} from "react";
export default function KanbanPdfExport({periodId,referenceId}:{periodId:string;referenceId:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function exportPdf(){
  if(busy)return;
  setBusy(true);setError("");
  const operationId=crypto.randomUUID();
  try{
   const response=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/pdf",{
    method:"POST",headers:{"Content-Type":"application/json","x-smn-export-operation":operationId},
    body:JSON.stringify({reference:referenceId})
   });
   if(!response.ok)throw Error("export");
   const blob=await response.blob();
   if(blob.type!=="application/pdf")throw Error("invalid-pdf");
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;link.download="SMN-kanban-"+periodId+".pdf";document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch{setError("L'export ou l'archivage du PDF a échoué. Aucun succès n'est confirmé.");}
  finally{setBusy(false);}
 }
 return <div className="d-print-none my-3">
  <button type="button" className="btn btn-primary" disabled={busy} onClick={exportPdf}>{busy?"Export en cours…":"Exporter et archiver le PDF"}</button>
  {error&&<p className="alert alert-warning mt-2" role="alert">{error}</p>}
 </div>;
}
