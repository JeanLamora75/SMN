"use client";

import {useEffect,useId,useRef,useState,type FormEvent,type SyntheticEvent} from "react";
import {useTranslation} from "@/i18n/client";
import type {RegistryType} from "@/lib/registry-types";

export type DescriptionEditItem={
 id:string;teamId:string;type:RegistryType;title:string;occurredOn:string;
 status:string;description:string|null;owner?:string|null;dueOn:string|null;
 comment?:string|null;revision?:number;
};

/** Focused edit uses the existing optimistic-concurrency API, never a new
 * unaudited write path. Keep the draft and dialog open on error/409. */
export default function RegistryDescriptionEditor({item,onSaved,onDismiss}:{
 item:DescriptionEditItem;onSaved:()=>void;onDismiss:()=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registrySummary."+key) as Parameters<typeof t>[0]);
 const dialog=useRef<HTMLDialogElement>(null);
 const textarea=useRef<HTMLTextAreaElement>(null);
 const titleId=useId();
 const original=item.description??"";
 const [draft,setDraft]=useState(original);
 const [busy,setBusy]=useState(false);
 const [failure,setFailure]=useState<"conflict"|"error"|null>(null);
 const dirty=draft!==original;
 useEffect(()=>{
  const element=dialog.current;
  if(element&&!element.open){element.showModal();textarea.current?.focus();}
  return()=>{if(element?.open)element.close();};
 },[]);
 const close=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(tr("discardChanges")))return;
  dialog.current?.close();
 };
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(busy||typeof item.revision!=="number"||!Number.isSafeInteger(item.revision)||item.revision<1)return;
  setBusy(true);setFailure(null);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     revision:item.revision,teamId:item.teamId,type:item.type,title:item.title,
     occurredOn:item.occurredOn,status:item.status,
     description:draft||null,owner:item.owner??null,dueOn:item.dueOn,
     comment:item.comment??null
    })
   });
   if(response.status===409){setFailure("conflict");return;}
   if(!response.ok)throw Error("save-unavailable");
   const result=await response.json() as {ok?:boolean;revision?:number};
   if(!result.ok||typeof result.revision!=="number"||!Number.isSafeInteger(result.revision))throw Error("save-unconfirmed");
   onSaved();
  }catch{setFailure("error");}
  finally{setBusy(false);}
 };
 const cancelEvent=(e:SyntheticEvent<HTMLDialogElement>)=>{
  e.preventDefault();close();
 };
 return <dialog ref={dialog} className="smn-registry-description-dialog smn-cockpit-modal" data-registry-dirty={dirty}
  aria-labelledby={titleId} onCancel={cancelEvent} onClose={onDismiss}>
  <form onSubmit={submit} className="d-grid gap-3">
   <div className="smn-cockpit-modal-header d-flex justify-content-between align-items-center gap-3">
    <h2 id={titleId} className="h5 mb-0">{tr("editDescription")}</h2>
    <button type="button" className="btn-close" disabled={busy} onClick={close}
     aria-label={tr("cancel")}/>
   </div>
   <label className="form-label mb-0" htmlFor={titleId+"-description"}>
    {tr("description")}
   </label>
   <textarea ref={textarea} id={titleId+"-description"} className="form-control"
    rows={7} maxLength={4000} value={draft} disabled={busy}
    onChange={e=>setDraft(e.target.value)}/>
   {failure&&<p role="alert" className="alert alert-danger mb-0">{tr(failure)}</p>}
   <footer className="smn-cockpit-modal-footer d-flex justify-content-end gap-2 flex-wrap">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={close}>{tr("cancel")}</button>
    <button type="submit" className="btn btn-primary"
     disabled={busy||!dirty||typeof item.revision!=="number"||!Number.isSafeInteger(item.revision)}>
     {busy?tr("saving"):tr("save")}
    </button>
   </footer>
  </form>
 </dialog>;
}
