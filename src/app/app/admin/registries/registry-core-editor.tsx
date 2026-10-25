"use client";

import {useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {registryStatuses,type RegistryType} from "@/lib/registry-types";
import {obstacleTransition} from "@/lib/obstacle-lifecycle";

export type RegistryEditItem={
 id:string;teamId:string;type:RegistryType;title:string;occurredOn:string;status:string;
 description:string|null;owner?:string|null;dueOn:string|null;comment?:string|null;revision?:number;
};
export type RegistryCoreSection="general"|"status";

/** One grouped change through the existing optimistic, audited PATCH API.
 * Untouched fields are sent unchanged to preserve the legacy contract. */
export default function RegistryCoreEditor({item,section,onSaved}:{
 item:RegistryEditItem;section:RegistryCoreSection;onSaved:()=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registryEdit."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const [title,setTitle]=useState(item.title);
 const [date,setDate]=useState(item.occurredOn);
 const [owner,setOwner]=useState(item.owner??"");
 const [due,setDue]=useState(item.dueOn??"");
 const [status,setStatus]=useState(item.status);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<"conflict"|"unavailable"|"invalidTransition"|null>(null);
 const general=section==="general";
 const dirty=general?(title!==item.title||date!==item.occurredOn||
  owner!==(item.owner??"")||due!==(item.dueOn??"")):status!==item.status;
 const transition=item.type==="obstacle"?obstacleTransition(item.status,status):null;
 const valid=typeof item.revision==="number"&&Number.isSafeInteger(item.revision)&&item.revision>=1&&
  (!general||!!title.trim())&&(!transition||transition.valid);
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!dirty||!valid||busy)return;
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({revision:item.revision,teamId:item.teamId,
     type:item.type,title:general?title.trim():item.title,
     occurredOn:general?date:item.occurredOn,status:general?item.status:status,
     description:item.description,owner:general?(owner.trim()||null):item.owner??null,
     dueOn:general?(due||null):item.dueOn,comment:item.comment??null})
   });
   if(response.status===409){setError("conflict");return;}
   if(response.status===503){setError("unavailable");return;}
   if(response.status===400){setError("invalidTransition");return;}
   if(!response.ok)throw Error("save-failed");
   const result=await response.json() as {ok?:boolean;revision?:number};
   if(!result.ok||typeof result.revision!=="number"||!Number.isSafeInteger(result.revision))throw Error("unconfirmed");
   onSaved();
  }catch{setError("unavailable");}
  finally{setBusy(false);}
 };
 return <form className="smn-registry-section-form" onSubmit={save}>
  {general?<div className="row g-2">
   <div className="col-12">
    <label className="form-label" htmlFor="registry-edit-title">{label("titleField")}</label>
    <input id="registry-edit-title" className="form-control" value={title} autoFocus
     maxLength={240} required disabled={busy} onChange={e=>setTitle(e.target.value)}/>
   </div>
   <div className="col-sm-6">
    <label className="form-label" htmlFor="registry-edit-date">{label("date")}</label>
    <input id="registry-edit-date" className="form-control" type="date" value={date}
     required disabled={busy} onChange={e=>setDate(e.target.value)}/>
   </div>
   <div className="col-sm-6">
    <label className="form-label" htmlFor="registry-edit-due">{label("due")}</label>
    <input id="registry-edit-due" className="form-control" type="date" value={due}
     disabled={busy} onChange={e=>setDue(e.target.value)}/>
   </div>
   <div className="col-12">
    <label className="form-label" htmlFor="registry-edit-owner">{label("owner")}</label>
    <input id="registry-edit-owner" className="form-control" maxLength={200} value={owner}
     disabled={busy} onChange={e=>setOwner(e.target.value)}/>
   </div>
  </div>:<div>
   <label className="form-label" htmlFor="registry-edit-status">{tr("status")}</label>
   <select id="registry-edit-status" className="form-select" value={status} autoFocus
    disabled={busy} onChange={e=>setStatus(e.target.value)}>
    {registryStatuses[item.type].map(s=><option value={s} key={s}>{label(s)}</option>)}
   </select>
   {transition?.valid&&transition.reopened&&<p className="small text-body-secondary mt-2 mb-0">
    {t("obstacleLifecycle.reopening")}</p>}
  </div>}
  {error&&<p className="alert alert-danger mb-0" role="alert">{tr(error)}</p>}
  <div className="smn-registry-section-save">
   <button className="btn btn-primary" type="submit" disabled={!dirty||!valid||busy}>
    {busy?tr("saving"):tr("save")}
   </button>
  </div>
 </form>;
}
