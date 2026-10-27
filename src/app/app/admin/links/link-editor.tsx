"use client";
import {useEffect,useId,useState} from "react";
import type {LinkEntry} from "@/lib/links-display";
import {useTranslation} from "@/i18n/client";

type Category={id:string;name:string};
export default function LinkEditor({teamId,categories,item,onClose,onSaved}:{
 teamId:string;categories:Category[];item:LinkEntry|null;onClose:()=>void;onSaved:()=>void;
}){
 const t=useTranslation(),id=useId();
 const [title,setTitle]=useState(item?.title??"");
 const [url,setUrl]=useState(item?.url??"");
 const [description,setDescription]=useState(item?.description??"");
 const [categoryId,setCategoryId]=useState(item?.categoryId??categories[0]?.id??"");
 const [scope,setScope]=useState<"EQUIPE"|"TRANSVERSE">(item?.scope??"EQUIPE");
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!pending)onClose();};
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[onClose,pending]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(pending)return;
  setError("");
  try{
   const parsed=new URL(url.trim());
   if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password)throw Error("invalid");
  }catch{setError(t("links.invalidUrl"));return;}
  setPending(true);
  try{
   const response=await fetch(item?"/api/admin/links/"+encodeURIComponent(item.id):"/api/admin/links",{
    method:item?"PUT":"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title,url,description,categoryId,scope,teamId:scope==="EQUIPE"?teamId:null,...(item?{revision:item.revision}:{})})
   });
   if(!response.ok)throw Error(String(response.status));
   onSaved();
  }catch(e){setError(e instanceof Error&&e.message==="409"?t("links.conflict"):t("links.saveError"));}
  finally{setPending(false);}
 };
 return <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id+"-title"} style={{background:"var(--bs-modal-backdrop-bg, rgba(0,0,0,.55))"}}>
  <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div className="modal-content">
   <div className="modal-header"><h2 className="modal-title fs-5" id={id+"-title"}>{item?t("links.edit"):t("links.add")}</h2>
    <button type="button" className="btn-close" aria-label={t("links.cancel")} onClick={onClose} disabled={pending}/></div>
   <form onSubmit={submit}><div className="modal-body d-grid gap-3">
    {error&&<div role="alert" className="alert alert-danger">{error}</div>}
    <div><label htmlFor={id+"-name"} className="form-label">{t("links.titleField")} *</label><input id={id+"-name"} className="form-control" required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} disabled={pending}/></div>
    <div><label htmlFor={id+"-url"} className="form-label">{t("links.urlField")} *</label><input id={id+"-url"} className="form-control" type="url" required maxLength={2048} value={url} onChange={e=>setUrl(e.target.value)} disabled={pending}/></div>
    <div><label htmlFor={id+"-description"} className="form-label">{t("links.descriptionField")}</label><textarea id={id+"-description"} className="form-control" maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)} disabled={pending}/></div>
    <div className="row g-3">
     <div className="col-md-6"><label htmlFor={id+"-category"} className="form-label">{t("links.category")} *</label><select id={id+"-category"} className="form-select" required value={categoryId} onChange={e=>setCategoryId(e.target.value)} disabled={pending}>{!categories.length&&<option value="">{t("links.noCategories")}</option>}{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
     <div className="col-md-6"><label htmlFor={id+"-scope"} className="form-label">{t("links.scope")} *</label><select id={id+"-scope"} className="form-select" value={scope} onChange={e=>setScope(e.target.value as "EQUIPE"|"TRANSVERSE")} disabled={pending}><option value="EQUIPE">{t("links.specific")}</option><option value="TRANSVERSE">{t("links.transverse")}</option></select></div>
    </div>
   </div><div className="modal-footer">
    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={pending}>{t("links.cancel")}</button>
    <button type="submit" className="btn btn-primary" disabled={pending||!categoryId}>{pending?t("links.saving"):t("links.save")}</button>
   </div></form>
  </div></div>
 </div>;
}
