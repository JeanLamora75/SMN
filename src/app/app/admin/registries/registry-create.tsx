"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryStatuses,registryTypes,type RegistryType} from "@/lib/registry-types";
type Response={ok:boolean;id?:string;error?:string};
const today=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
};
export default function RegistryCreate({teamId,canManage}:{teamId:string|null;canManage:boolean}){
 const t=useTranslation();
 const [type,setType]=useState<RegistryType>("risk");
 const [title,setTitle]=useState("");
 const [date,setDate]=useState(today);
 const [status,setStatus]=useState<string>(registryStatuses.risk[0]);
 const [description,setDescription]=useState("");
 const [owner,setOwner]=useState("");
 const [due,setDue]=useState("");
 const [comment,setComment]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<{ok:boolean;message:string}|null>(null);
 const translate=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const changeType=(next:RegistryType)=>{setType(next);setStatus(registryStatuses[next][0]);setNotice(null);};
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!teamId||!canManage||busy)return;
  setBusy(true);setNotice(null);
  try{
   const response=await fetch("/api/admin/registries",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,type,title,occurredOn:date,status,
      description:description||null,owner:owner||null,dueOn:due||null,comment:comment||null})});
   const result=await response.json() as Response;
   if(!response.ok||!result.ok||!result.id)throw Error(result.error??"failed");
   setNotice({ok:true,message:translate("success").replace("{id}",result.id)});
   setTitle("");setDescription("");setOwner("");setDue("");setComment("");
  }catch{setNotice({ok:false,message:translate("failed")});}
  finally{setBusy(false);}
 };
 return <div className="d-grid gap-3">
  <header><h1>{translate("title")}</h1><p className="text-body-secondary">{translate("intro")}</p></header>
  {!teamId?<div role="alert" className="alert alert-warning">{translate("unavailable")}</div>:
   !canManage?<div role="status" className="alert alert-info">{translate("readonly")}</div>:
  <form className="card p-3 p-lg-4 d-grid gap-3" onSubmit={save}>
   <div className="row g-3">
    <div className="col-md-6"><label className="form-label" htmlFor="registry-type">{translate("type")}</label>
     <select id="registry-type" className="form-select" value={type} onChange={e=>changeType(e.target.value as RegistryType)}>
      {registryTypes.map(item=><option key={item} value={item}>{translate(item)}</option>)}
     </select></div>
    <div className="col-md-6"><label className="form-label" htmlFor="registry-date">{translate("date")}</label>
     <input id="registry-date" type="date" className="form-control" value={date} required onChange={e=>setDate(e.target.value)}/></div>
    <div className="col-md-8"><label className="form-label" htmlFor="registry-title">{translate("titleField")}</label>
     <input id="registry-title" className="form-control" maxLength={240} required value={title} onChange={e=>setTitle(e.target.value)}/></div>
    <div className="col-md-4"><label className="form-label" htmlFor="registry-status">{translate("status")}</label>
     <select id="registry-status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
      {registryStatuses[type].map(s=><option key={s} value={s}>{translate(s)}</option>)}
     </select></div>
    <div className="col-12"><label className="form-label" htmlFor="registry-description">{translate("description")}</label>
     <textarea id="registry-description" className="form-control" rows={3} maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}/></div>
    <div className="col-md-6"><label className="form-label" htmlFor="registry-owner">{translate("owner")}</label>
     <input id="registry-owner" className="form-control" maxLength={200} value={owner} onChange={e=>setOwner(e.target.value)}/></div>
    <div className="col-md-6"><label className="form-label" htmlFor="registry-due">{translate("due")}</label>
     <input id="registry-due" type="date" className="form-control" value={due} onChange={e=>setDue(e.target.value)}/></div>
    <div className="col-12"><label className="form-label" htmlFor="registry-comment">{translate("comment")}</label>
     <textarea id="registry-comment" className="form-control" rows={2} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></div>
   </div>
   <div className="d-flex justify-content-end">
    <button type="submit" className="btn btn-primary" disabled={busy||!title.trim()}>{busy?translate("creating"):translate("create")}</button>
   </div>
   {notice&&<div role={notice.ok?"status":"alert"} className={notice.ok?"alert alert-success":"alert alert-danger"}>{notice.message}</div>}
  </form>}
 </div>;
}
