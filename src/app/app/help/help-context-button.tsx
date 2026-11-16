"use client";

import {useEffect,useId,useRef,useState} from "react";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../bootstrap-icon";
import {SafeHelpMarkdown} from "./safe-markdown";

type ArticlePayload=Readonly<{
 articleId:string;contentLocale:string;isFallback:boolean;markdown:string;
}>;
type State={status:"loading"}|{status:"unavailable"}|{status:"ready";article:ArticlePayload};
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function competingModal():boolean{
 return !!document.querySelector(
  'dialog[open], [role="dialog"][aria-modal="true"], .modal.show, .modal.d-block'
 );
}

/** A button meant for a page header. Integration into screens is tracked separately. */
export function HelpContextButton({articleId,screenTitle,className=""}:{
 articleId:string;screenTitle:string;className?:string;
}){
 const t=useTranslation();
 const [open,setOpen]=useState(false);
 const [state,setState]=useState<State>({status:"loading"});
 const dialog=useRef<HTMLDialogElement>(null);
 const opener=useRef<HTMLButtonElement>(null);
 const titleId=useId();
 const guideHref="/app/help?article="+encodeURIComponent(articleId);

 function close(){setOpen(false);}
 function launch(){
  if(open)return;
  // Never stack two modal dialogs. A new tab preserves dirty forms and filters.
  if(competingModal()){
   window.open(guideHref,"_blank","noopener,noreferrer");
   return;
  }
  setState({status:"loading"});
  setOpen(true);
 }

 useEffect(()=>{
  if(!open)return;
  const node=dialog.current;
  if(!node)return;
  try{node.showModal();}catch{queueMicrotask(()=>setOpen(false));return;}
  const first=node.querySelector<HTMLElement>('[data-initial-focus="true"]');
  (first??node).focus();
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close();return;}
   if(event.key!=="Tab")return;
   const items=Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter(item=>item.getClientRects().length>0);
   if(!items.length){event.preventDefault();node.focus();return;}
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&(document.activeElement===first||!node.contains(document.activeElement))){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&(document.activeElement===last||!node.contains(document.activeElement))){
    event.preventDefault();first.focus();
   }
  };
  document.addEventListener("keydown",keydown,true);
  return ()=>{
   document.removeEventListener("keydown",keydown,true);
   if(node.open)node.close();
   opener.current?.focus();
  };
 },[open]);

 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  async function load(){
   try{
    const response=await fetch("/api/help/articles/"+encodeURIComponent(articleId),{
     method:"GET",cache:"no-store",signal:controller.signal
    });
    if(!response.ok)throw Error("help-article-unavailable");
    const data=await response.json() as Partial<ArticlePayload>;
    if(data.articleId!==articleId||typeof data.markdown!=="string"||
     typeof data.contentLocale!=="string"||typeof data.isFallback!=="boolean")
     throw Error("help-article-invalid");
    if(!controller.signal.aborted)setState({status:"ready",article:data as ArticlePayload});
   }catch(error){
    if(!controller.signal.aborted&&!(error instanceof DOMException&&error.name==="AbortError"))
     setState({status:"unavailable"});
   }
  }
  void load();
  return ()=>controller.abort();
 },[open,articleId]);

 return <>
  <button ref={opener} type="button" className={(className||"btn d-inline-flex align-items-center gap-2")+" smn-help-header-button"}
   onClick={launch}>
   <BootstrapIcon name="question-circle"/>{t("navigation.entries.help")}
  </button>
  {open&&<dialog ref={dialog} className="smn-cockpit-modal smn-help-dialog"
   aria-modal="true" aria-labelledby={titleId}
   onCancel={event=>{event.preventDefault();close();}}>
   <div className="smn-cockpit-modal-header">
    <h2 id={titleId} className="h5 m-0 d-flex align-items-center gap-2">
     <BootstrapIcon name="question-circle"/>{t("navigation.entries.help")} — {screenTitle}
    </h2>
    <button type="button" className="btn-close" onClick={close}
     aria-label={t("helpCenter.close")} data-initial-focus="true"/>
   </div>
   <div className="smn-cockpit-modal-body" aria-live="polite">
    {state.status==="loading"?<p role="status">{t("helpCenter.loading")}</p>:
     state.status==="unavailable"?<p role="alert">{t("helpCenter.articleUnavailable")}</p>:
     <>
      {state.article.isFallback&&<p role="status" className="alert alert-info">{t("helpCenter.fallback")}</p>}
      <SafeHelpMarkdown markdown={state.article.markdown}/>
     </>}
   </div>
   <div className="smn-cockpit-modal-footer">
    <Link href={guideHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
     {t("helpCenter.fullGuide")}
    </Link>
    <button type="button" className="btn btn-primary" onClick={close}>{t("helpCenter.close")}</button>
   </div>
  </dialog>}
 </>;
}
