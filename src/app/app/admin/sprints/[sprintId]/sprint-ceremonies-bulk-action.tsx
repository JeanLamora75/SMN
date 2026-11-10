"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";

const types=["planning","daily","review","retrospective","custom","exceptional"] as const;
type Kind=typeof types[number];
type Counts=Record<Kind,number>;

export default function SprintCeremoniesBulkAction({sprintId,teamId,total}:{
 sprintId:string;teamId:string;total:number;
}){
 const t=useTranslation();
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [open,setOpen]=useState(false);
 const [counts,setCounts]=useState<Counts|null>(null);
 const [selected,setSelected]=useState<Kind[]>([]);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const create=total===0;
 const operation=create?"create":"delete";
 const tr=(key:string)=>t(("sprintCeremoniesBulk."+key) as Parameters<typeof t>[0]);
 const selectedCount=counts?selected.reduce((n,key)=>n+counts[key],0):0;
 const visibleTypes=counts?types.filter(key=>counts[key]>0):[];
 const openSelection=async()=>{
  setError(null);setSuccess(null);setBusy(true);
  try{
   const url="/api/admin/sprints/"+encodeURIComponent(sprintId)+
    "/ceremonies-bulk?"+new URLSearchParams({teamId});
   const response=await fetch(url,{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const data=await response.json() as {state?:string;counts?:Counts};
   if(data.state!=="available"||!data.counts||
    types.some(key=>!Number.isSafeInteger(data.counts?.[key])||data.counts![key]<0))
    throw Error("unavailable");
   if(types.reduce((n,key)=>n+data.counts![key],0)!==total){
    setError(tr("state-changed"));router.refresh();return;
   }
   setCounts(data.counts);
   setSelected(types.filter(key=>data.counts![key]>0));
   setOpen(true);
  }catch{setError(tr("unavailable"));}
  finally{setBusy(false);}
 };
 const submit=async()=>{
  if(busy||!create&&(!counts||selectedCount===0))return;
  if(!create&&!window.confirm(t("sprintCeremoniesBulk.confirmSelected",{
   count:selectedCount,types:selected.map(key=>tr("type."+key)).join(", ")
  })))return;
  setError(null);setSuccess(null);setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/"+encodeURIComponent(sprintId)+"/ceremonies-bulk",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,operation,expectedCount:total,
     ...(create?{}:{types:selected})})
   });
   const data=await response.json() as {ok?:boolean;error?:string;count?:number};
   if(!response.ok||!data.ok){
    const key=data.error&&["protected","state-changed","linked-data","no-templates","incomplete-schema"].includes(data.error)?
     data.error:"unavailable";
    setError(tr(key));return;
   }
   setOpen(false);setCounts(null);setSelected([]);
   setSuccess(tr(create?"created":"deleted"));
   router.refresh();
  }catch{setError(tr("unavailable"));}
  finally{setBusy(false);}
 };
 return <div className="d-flex flex-column align-items-start gap-1" aria-live="polite">
  <button type="button" disabled={busy}
   className={"btn btn-sm "+(create?"btn-primary":"btn-outline-danger")}
   onClick={()=>void (create?submit():openSelection())}>
   {busy?tr("working"):tr(create?"create":"deleteAll")}
  </button>
  {open&&counts&&<div className="card shadow-sm p-3 mt-2" role="dialog"
   aria-modal="true" aria-label={tr("chooseTypes")}>
   <h3 className="h6 mb-2">{tr("chooseTypes")}</h3>
   <p className="small text-secondary">{tr("chooseTypesHelp")}</p>
   <div className="d-flex flex-column gap-2 mb-3">
    {visibleTypes.map(key=><label key={key} className="form-check d-flex gap-2 align-items-center">
     <input type="checkbox" className="form-check-input mt-0"
      checked={selected.includes(key)} disabled={busy}
      onChange={e=>setSelected(before=>e.target.checked?
       [...before,key]:before.filter(value=>value!==key))}/>
     <span>{tr("type."+key)} ({counts[key]})</span>
    </label>)}
   </div>
   <p className="small fw-semibold">{t("sprintCeremoniesBulk.selectedCount",{count:selectedCount})}</p>
   <div className="d-flex flex-wrap gap-2">
    <button type="button" className="btn btn-danger btn-sm"
     disabled={busy||selectedCount===0} onClick={()=>void submit()}>
     {tr("continueDelete")}
    </button>
    <button type="button" className="btn btn-outline-secondary btn-sm"
     disabled={busy} onClick={()=>{setOpen(false);setError(null);}}>
     {tr("cancel")}
    </button>
   </div>
  </div>}
  {error&&<span role="alert" className="small text-danger">{error}</span>}
  {success&&<span role="status" className="small text-success">{success}</span>}
 </div>;
}
