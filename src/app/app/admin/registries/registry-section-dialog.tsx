"use client";

import {useEffect,useId,useRef,useState,type ReactNode,type SyntheticEvent} from "react";
import {useTranslation} from "@/i18n/client";
import RegistryDialogPortal,{useRegistryPortalReady} from "./registry-dialog-portal";

/** Native modal: only ask to discard after a user actually changes a field.
 * The child editor owns the server transaction and calls onSaved after success. */
export default function RegistrySectionDialog({title,onDismiss,children,wide=false,submitFormId}:{
 title:ReactNode;onDismiss:()=>void;children:ReactNode;wide?:boolean;submitFormId?:string;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registryEdit."+key) as Parameters<typeof t>[0]);
 const portalReady=useRegistryPortalReady();
 const ref=useRef<HTMLDialogElement>(null);
 const origin=useRef<HTMLElement|null>(null);
 const [dirty,setDirty]=useState(false);
 const titleId=useId();
 useEffect(()=>{
  const element=ref.current;
  if(!element)return;
  if(!origin.current||!element.contains(document.activeElement))
   origin.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(!element.open)element.showModal();
  return()=>{
   // L’événement onClose est réservé à une fermeture explicite, pas au cleanup StrictMode.
  };
 },[portalReady]);
 useEffect(()=>{
  if(!dirty)return;
  const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",guard);
  return()=>window.removeEventListener("beforeunload",guard);
 },[dirty]);
 const close=()=>{
  if(dirty&&!window.confirm(tr("discard")))return;
  ref.current?.close();
 };
 const cancel=(event:SyntheticEvent<HTMLDialogElement>)=>{
  event.preventDefault();close();
 };
 return <RegistryDialogPortal><dialog ref={ref} className={"smn-registry-section-dialog smn-cockpit-modal"+(wide?" smn-registry-section-dialog-wide":"")} data-registry-dirty={dirty}
  aria-labelledby={titleId} onCancel={cancel} onClose={()=>{origin.current?.focus();onDismiss();}}>
  <div className="smn-registry-section-dialog-layout"
   onChangeCapture={()=>setDirty(true)} onInputCapture={()=>setDirty(true)}>
   <header className="smn-registry-section-dialog-header smn-cockpit-modal-header">
    <h2 id={titleId} className="h5 mb-0">{title}</h2>
    <button type="button" className="btn-close" onClick={close}
     aria-label={tr("cancel")}/>
   </header>
   <div className="smn-registry-section-dialog-content smn-cockpit-modal-body">
    {children}
   </div>
   <footer className="smn-registry-section-dialog-footer smn-cockpit-modal-footer">
    {submitFormId&&<button type="submit" form={submitFormId} className="btn btn-primary">{t("common.save")}</button>}
    <button type="button" className="btn btn-outline-secondary" onClick={close}
     >{tr("cancel")}</button>
   </footer>
  </div>
 </dialog></RegistryDialogPortal>;
}
