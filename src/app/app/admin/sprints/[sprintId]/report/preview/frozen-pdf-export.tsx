"use client";
import {useRef,useState} from "react";
export default function FrozenPdfExport({sprintId,reference,label,errorLabel}:{sprintId:string;reference:string;label:string;errorLabel:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 const operation=useRef<string|null>(null);
 async function generate(){
 setBusy(true);setError(false);
 try{
  if(!operation.current)operation.current=crypto.randomUUID();
  const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/pdf",{
   method:"POST",headers:{"Content-Type":"application/json","X-SMN-Export-Operation":operation.current},body:JSON.stringify({reference})});
  if(!r.ok)throw Error("pdf-failed");
  const blob=await r.blob();
  if(blob.type!=="application/pdf"||blob.size<32)throw Error("pdf-invalid");
  const url=URL.createObjectURL(blob);
  try{const a=document.createElement("a");a.href=url;a.download="SMN-report-"+sprintId+".pdf";a.click();operation.current=null;}
  finally{setTimeout(()=>URL.revokeObjectURL(url),60000);}
 }catch{setError(true);}finally{setBusy(false);}
 }
 return <div className="d-print-none my-3">
 <button className="btn btn-primary" type="button" disabled={busy} onClick={()=>void generate()}>{label}</button>
 {error&&<span role="alert" className="text-danger ms-2">{errorLabel}</span>}
 </div>;
}
