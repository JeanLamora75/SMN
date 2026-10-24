"use client";
import Link from "next/link";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
export default function MaterializeRisk({id,teamId,title,description,canManage,onSaved}:{id:string;teamId:string;title:string;description:string;canManage:boolean;onSaved?:()=>void}){
 const t=useTranslation(),tr=(k:string)=>t(("riskMaterialize."+k) as Parameters<typeof t>[0]);
 const [open,setOpen]=useState(false),[draftTitle,setDraftTitle]=useState(""),[draftDescription,setDraftDescription]=useState("");
 const [error,setError]=useState(false),[busy,setBusy]=useState(false),[created,setCreated]=useState<string|null>(null);
 const start=()=>{setDraftTitle(title.slice(0,240));setDraftDescription(description.slice(0,4000));setOpen(true);setCreated(null);setError(false);};
 const cancel=()=>{setOpen(false);setDraftTitle("");setDraftDescription("");setError(false);};
 const confirm=async()=>{
  if(!draftTitle.trim()||busy)return;
  setBusy(true);setError(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/materialize",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,type:"obstacle",title:draftTitle,description:draftDescription||null,occurredOn:today(),status:"open",owner:null,dueOn:null,comment:null})});
   if(!response.ok)throw Error("create-failed");
   const result=await response.json() as {ok:boolean;id:string};
   if(!result.ok||!result.id)throw Error("create-failed");
   setCreated(result.id);setOpen(false);onSaved?.();
  }catch{setError(true);}finally{setBusy(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  <p className="text-body-secondary">{tr("suggestion")}</p>
  {canManage&&!open&&<button type="button" className="btn btn-outline-primary align-self-start" onClick={start}>{tr("launch")}</button>}
  {open&&canManage&&<div className="d-grid gap-3">
   <p>{tr("intro")}</p>
   <div><label className="form-label" htmlFor="materialized-title">{tr("title")}</label>
    <input id="materialized-title" className="form-control" required maxLength={240} value={draftTitle} onChange={e=>setDraftTitle(e.target.value)}/></div>
   <div><label className="form-label" htmlFor="materialized-description">{tr("description")}</label>
    <textarea id="materialized-description" className="form-control" rows={3} maxLength={4000} value={draftDescription} onChange={e=>setDraftDescription(e.target.value)}/></div>
   <div className="d-flex gap-2">
    <button type="button" className="btn btn-primary" disabled={!draftTitle.trim()||busy} onClick={()=>void confirm()}>{tr("confirm")}</button>
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={cancel}>{tr("cancel")}</button>
   </div>
  </div>}
  {created&&<p role="status" className="mt-2"><Link href={"/app/admin/registries/"+encodeURIComponent(created)}>{tr("success")}</Link></p>}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
