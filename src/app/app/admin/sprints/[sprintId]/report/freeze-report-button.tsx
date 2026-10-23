"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function FreezeReportButton({sprintId,label,errorLabel}:{sprintId:string;label:string;errorLabel:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 async function freeze(){
  setBusy(true);setError(false);
  try{
   const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/render-references",{method:"POST"});
   if(!r.ok)throw Error("freeze-failed");
   const data=await r.json() as {id:string};
   if(!/^[a-f0-9-]{36}$/i.test(data.id))throw Error("freeze-invalid");
   router.push("/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report/preview?reference="+encodeURIComponent(data.id));
  }catch{setError(true);}finally{setBusy(false);}
 }
 return <><button className="btn btn-outline-primary" type="button" disabled={busy} onClick={()=>void freeze()}>{label}</button>
 {error&&<span role="alert" className="text-danger">{errorLabel}</span>}</>;
}
