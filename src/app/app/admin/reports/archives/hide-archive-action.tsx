"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function HideArchiveAction({id,labels}:{id:string;labels:{hide:string;reason:string;confirm:string;error:string}}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 async function hide(){
 const reason=window.prompt(labels.reason);if(!reason?.trim())return;
 if(!window.confirm(labels.confirm))return;
 setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/archives/"+encodeURIComponent(id)+"/visibility",{
 method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"hide",reason})});
 if(!r.ok)throw Error();router.refresh();
 }catch{setError(true);}finally{setBusy(false);}
 }
 return <><button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={()=>void hide()}>{labels.hide}</button>
 {error&&<span role="alert" className="text-danger">{labels.error}</span>}</>;
}
