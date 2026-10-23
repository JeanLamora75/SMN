"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import type {ReviewEntry,ReviewKind,ReviewProjection} from "@/lib/sprint-review-analysis";
import {REVIEW_MAX_LENGTH} from "@/lib/sprint-review-analysis";
import BootstrapIcon from "../../../bootstrap-icon";

const kinds=["manual","ai"] as const;
const titleKey={manual:"sprintDetail.reviewManualTitle",
 ai:"sprintDetail.reviewAiTitle"} as const;

export default function SprintReviewPanel({data,sprintId,status,canManage,locale,timeZone}:{
 data:ReviewProjection|null;sprintId:string;status:string;
 canManage:boolean;locale:"fr"|"en";timeZone:string;
}){
 const t=useTranslation(),router=useRouter();
 const dialog=useRef<HTMLDialogElement>(null);
 const textarea=useRef<HTMLTextAreaElement>(null);
 const originButton=useRef<HTMLButtonElement|null>(null);
 const [editing,setEditing]=useState<ReviewKind|null>(null);
 const [text,setText]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const model=data?.state==="available"?data:null;
 const editable=!!model&&canManage&&status!=="closed";
 const entry=editing&&model?model[editing]:null;
 const dirty=editing!==null&&entry!==null&&text!==(entry.body??"");
 const humanReview=(e:ReviewEntry)=>e.origin==="ai-generated"?
  t("sprintDetail.reviewAiGenerated"):e.origin==="human-edited-ai"?
  t("sprintDetail.reviewHumanEditedAi"):e.kind==="ai"&&e.revision>0?
  t("sprintDetail.reviewAiManuallyAuthored"):
  t("sprintDetail.reviewHumanOrigin");

 useEffect(()=>{
  const d=dialog.current;
  if(editing&&d&&!d.open){d.showModal();textarea.current?.focus();}
  return()=>{if(d?.open)d.close();};
 },[editing]);
 useEffect(()=>{if(!editing)originButton.current?.focus();},[editing]);
 useEffect(()=>{
  if(!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   event.preventDefault();event.returnValue="";
  };
  window.addEventListener("beforeunload",beforeUnload);
  return()=>window.removeEventListener("beforeunload",beforeUnload);
 },[dirty]);

 function begin(kind:ReviewKind,button:HTMLButtonElement){
  if(!editable||busy)return;
  originButton.current=button;
  setEditing(kind);setText(model![kind].body??"");
  setError("");setNotice("");
 }
 function close(){
  if(busy)return;
  if(dirty&&!window.confirm(t("sprintReview.discard")))return;
  setEditing(null);setError("");
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!editable||!editing||!entry||busy||text.length>REVIEW_MAX_LENGTH||
   !dirty)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/sprints/review-analysis",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,kind:editing,revision:entry.revision,body:text})
   });
   const result=await response.json();
   if(!response.ok||!result.ok){
    const key=result.error==="conflict"?"sprintDetail.reviewConflict":
     result.error==="closed-period"?"sprintDetail.reviewClosed":
     "sprintDetail.reviewSaveError";
    setError(t(key));return;
   }
   setNotice(t("sprintDetail.reviewSaved"));
   setEditing(null);router.refresh();
  }catch{setError(t("sprintDetail.reviewSaveError"));}
  finally{setBusy(false);}
 }
 const formatDate=(raw:string)=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone
 }).format(new Date(raw));
 return <section aria-label={t("sprintDetail.tabs.review")}>
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.review")}</h2>
  <p className="small text-secondary">{t("sprintDetail.reviewExplanation")}</p>
  {data?.state==="unavailable"||!data?
   <div className="alert alert-warning" role="status">
    {t(data?.state==="unavailable"&&data.reason==="history-missing"?
     "sprintDetail.reviewHistoricalUnavailable":"sprintDetail.reviewUnavailable")}
   </div>:
   <div className="row g-3">
    {kinds.map(kind=>{
     const item=model![kind];
     return <div className="col-12 col-lg-6" key={kind}>
      <article className="border rounded-3 p-3 p-md-4 h-100">
       <header className="d-flex justify-content-between align-items-start gap-2 mb-3">
        <h3 className="h6 mb-0">{t(titleKey[kind])}</h3>
        {editable&&<button type="button" className="btn btn-link btn-sm p-1"
         title={t("sprintDetail.reviewEdit",{field:t(titleKey[kind])})}
         aria-label={t("sprintDetail.reviewEdit",{field:t(titleKey[kind])})}
         onClick={event=>begin(kind,event.currentTarget)}>
         <BootstrapIcon name="pencil-square"/>
        </button>}
       </header>
       {item.body?
        <p className="mb-3" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>
         {item.body}
        </p>:
        <p className="text-secondary mb-3">{t("sprintDetail.reviewEmpty")}</p>}
       {item.revision>0?
        <div className="small text-secondary d-grid gap-1">
         <span>{t("sprintDetail.reviewVersion",{version:item.revision})}</span>
         {item.updatedAt&&<span>{t("sprintDetail.reviewUpdatedAt",{
          date:formatDate(item.updatedAt)
         })}</span>}
         <span>{t("sprintDetail.reviewAuthor",{
          author:item.updatedByName??t("sprintDetail.reviewUnknownAuthor")
         })}</span>
         <span>{humanReview(item)}</span>
        </div>:
        <p className="small text-secondary">{t("sprintDetail.reviewNotSaved")}</p>}
       {kind==="ai"&&<p className="small text-secondary mt-3 mb-0">
        {t("sprintDetail.reviewAiNoGenerator")}
       </p>}
      </article>
     </div>;
    })}
   </div>}
  {model?.source==="closure-snapshot"&&
   <p className="small text-secondary mt-3">
    {t("sprintDetail.reviewSnapshot",{version:model.snapshotVersion??"?"})}
   </p>}
  {notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
  {editing!==null&&editable&&<dialog ref={dialog}
   className="smn-sprint-edit-dialog" aria-labelledby="smn-review-editor-title"
   onCancel={e=>{e.preventDefault();close();}}>
   <div className="modal-content bg-body border rounded-4 shadow p-3 p-md-4">
    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
     <h3 className="h5 mb-0" id="smn-review-editor-title">
      {t("sprintDetail.reviewEdit",{field:t(titleKey[editing])})}
     </h3>
     <button type="button" className="btn-close" aria-label={t("sprintDetail.close")}
      onClick={close} disabled={busy}/>
    </div>
    <form onSubmit={save} className="d-grid gap-3">
     <div>
      <label className="form-label" htmlFor="smn-review-text">
       {t(titleKey[editing])}
      </label>
      <textarea id="smn-review-text" ref={textarea}
       value={text} rows={9} maxLength={REVIEW_MAX_LENGTH}
       className="form-control" disabled={busy}
       onChange={e=>setText(e.target.value)}/>
      <p className="small text-secondary mt-2 mb-0">
       {t("sprintDetail.reviewCharCount",{
        count:text.length,max:REVIEW_MAX_LENGTH
       })}
      </p>
     </div>
     {editing==="ai"&&<p className="small text-secondary mb-0">
      {t("sprintDetail.reviewAiManuallyEntered")}
     </p>}
     {dirty&&<p role="status" className="small text-warning mb-0">
      {t("sprintReview.unsaved")}
     </p>}
     {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
     <div className="d-flex justify-content-end flex-wrap gap-2">
      <button type="button" className="btn btn-outline-secondary"
       disabled={busy} onClick={close}>{t("sprintDetail.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={busy||!dirty||text.length>REVIEW_MAX_LENGTH}>
       {t("sprintDetail.save")}
      </button>
     </div>
    </form>
   </div>
  </dialog>}
 </section>;
}
