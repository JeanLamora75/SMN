"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";

export default function SprintCeremoniesBulkAction({sprintId,teamId,total}:{
 sprintId:string;teamId:string;total:number;
}){
 const t=useTranslation();
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const create=total===0;
 const operation=create?"create":"delete";
 const tr=(key:string)=>t(("sprintCeremoniesBulk."+key) as Parameters<typeof t>[0]);
 const submit=async()=>{
  if(busy)return;
  if(!create&&!window.confirm(t("sprintCeremoniesBulk.confirmDelete",{count:total})))return;
  setError(null);setSuccess(null);setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/"+encodeURIComponent(sprintId)+"/ceremonies-bulk",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,operation,expectedCount:total})
   });
   const data=await response.json() as {ok?:boolean;error?:string;count?:number};
   if(!response.ok||!data.ok){
    const key=data.error&&["protected","state-changed","linked-data","no-templates","incomplete-schema"].includes(data.error)?
     data.error:"unavailable";
    setError(tr(key));return;
   }
   setSuccess(tr(create?"created":"deleted"));
   router.refresh();
  }catch{setError(tr("unavailable"));}
  finally{setBusy(false);}
 };
 return <div className="d-flex flex-column align-items-start gap-1" aria-live="polite">
  <button type="button" disabled={busy}
   className={"btn btn-sm "+(create?"btn-primary":"btn-outline-danger")}
   onClick={()=>void submit()}>
   {busy?tr("working"):tr(create?"create":"deleteAll")}
  </button>
  {error&&<span role="alert" className="small text-danger">{error}</span>}
  {success&&<span role="status" className="small text-success">{success}</span>}
 </div>;
}
