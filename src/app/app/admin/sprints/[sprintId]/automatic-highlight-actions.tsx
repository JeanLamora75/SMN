"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../../bootstrap-icon";

export default function AutomaticHighlightActions({id,teamId,title}:{
 id:string;teamId:string;title:string;
}){
 const router=useRouter(),t=useTranslation(),dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false),[name,setName]=useState(title);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const tr=(key:"edit"|"delete"|"heading"|"save"|"cancel"|"confirm"|"error"|"conflict"|"title")=>
  t(("sprintHighlight."+key) as Parameters<typeof t>[0]);
 useEffect(()=>{if(open&&dialog.current&&!dialog.current.open)dialog.current.showModal();
  return()=>{if(dialog.current?.open)dialog.current.close();};
 },[open]);
 const close=()=>{if(!busy){setOpen(false);setError("");}};
 async function change(action:"PATCH"|"DELETE"){
  if(busy||action==="PATCH"&&!name.trim())return;
  if(action==="DELETE"&&!window.confirm(tr("confirm").replace("{title}",title)))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/registries/automatic-highlights/"+encodeURIComponent(id),{
    method:action,headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,expectedTitle:title,...(action==="PATCH"?{title:name.trim()}:{})})
   });
   if(!response.ok){setError(tr(response.status===409?"conflict":"error"));return;}
   setOpen(false);router.refresh();
  }catch{setError(tr("error"));}
  finally{setBusy(false);}
 }
 return <>
  <button type="button" className="smn-sprint-register-edit" aria-haspopup="dialog"
   aria-label={tr("edit")+": "+title} title={tr("edit")+": "+title}
   onClick={()=>{setName(title);setError("");setOpen(true);}}>
   <BootstrapIcon name="pencil-square"/>
  </button>
  <button type="button" className="smn-sprint-register-edit smn-sprint-register-delete"
   aria-label={tr("delete")+": "+title} title={tr("delete")+": "+title}
   disabled={busy} onClick={()=>void change("DELETE")}>
   <BootstrapIcon name="trash3"/>
  </button>
  {error&&!open&&<span role="alert" className="small text-danger">{error}</span>}
  {open&&typeof document!=="undefined"&&createPortal(
   <dialog ref={dialog} className="smn-sprint-edit-dialog"
    aria-labelledby={"highlight-title-"+id}
    onCancel={event=>{if(busy)event.preventDefault();else close();}}>
    <div className="modal-content smn-cockpit-modal">
     <header className="smn-cockpit-modal-header">
      <h2 className="h5 mb-0" id={"highlight-title-"+id}>{tr("heading")}</h2>
      <button className="btn-close" type="button" disabled={busy} aria-label={tr("cancel")} onClick={close}/>
     </header>
     <div className="smn-cockpit-modal-body">
      <form className="d-grid gap-3" onSubmit={event=>{event.preventDefault();void change("PATCH");}}>
       <label className="form-label" htmlFor={"highlight-name-"+id}>{tr("title")}
        <input id={"highlight-name-"+id} className="form-control" maxLength={240} required
         value={name} disabled={busy} onChange={event=>setName(event.target.value)}/>
       </label>
       {error&&<p className="alert alert-warning" role="alert">{error}</p>}
       <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={close}>{tr("cancel")}</button>
        <button type="submit" className="btn btn-primary" disabled={busy||!name.trim()||name.trim()===title}>{tr("save")}</button>
       </div>
      </form>
     </div>
    </div>
   </dialog>,document.body)}
 </>;
}
