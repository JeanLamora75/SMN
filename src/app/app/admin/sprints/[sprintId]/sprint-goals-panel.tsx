"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import type {SprintDetailGoal,SprintDetailGoals,SprintGoalEvaluation} from "@/server/sprints/goals-detail-read";
import BootstrapIcon from "../../../bootstrap-icon";

const states:readonly SprintGoalEvaluation[]=[
 "not_evaluated","achieved","partially_achieved","not_achieved"
];
const labels={
 not_evaluated:"sprintGoals.not_evaluated",
 achieved:"sprintGoals.achieved",
 partially_achieved:"sprintGoals.partially_achieved",
 not_achieved:"sprintGoals.not_achieved"
} as const;

export default function SprintGoalsPanel({sprintId,status,canManage,data}:{
 sprintId:string;status:string;canManage:boolean;data:SprintDetailGoals;
}){
 const t=useTranslation(),router=useRouter();
 const modal=useRef<HTMLDialogElement>(null);
 const titleInput=useRef<HTMLInputElement>(null);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const [title,setTitle]=useState("");
 const [comment,setComment]=useState("");
 const [evaluation,setEvaluation]=useState<SprintGoalEvaluation>("not_evaluated");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const isNew=editing==="new";
 const items=data.state==="available"?data.items:[];
 const original=editing&&!isNew?items.find(g=>g.id===editing):null;
 const dirty=editing!==null&&(title!==(original?.title??"")||
  comment!==(original?.comment??"")||
  evaluation!==(original?.evaluation??"not_evaluated"));
 const editable=canManage&&status!=="closed";
 useEffect(()=>{
  const dialog=modal.current;
  if(editing!==null&&dialog&&!dialog.open){
   dialog.showModal();titleInput.current?.focus();
  }
  return()=>{if(dialog?.open)dialog.close();};
 },[editing]);
 useEffect(()=>{
  if(editing===null)trigger.current?.focus();
 },[editing]);
 useEffect(()=>{
  if(!dirty)return;
  const beforeUnload=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
  window.addEventListener("beforeunload",beforeUnload);
  return()=>window.removeEventListener("beforeunload",beforeUnload);
 },[dirty]);

 function openNew(button:HTMLButtonElement){
  if(!editable)return;
  trigger.current=button;
  setTitle("");setComment("");setEvaluation("not_evaluated");
  setError("");setNotice("");setEditing("new");
 }
 function openEdit(goal:SprintDetailGoal,button:HTMLButtonElement){
  if(!editable)return;
  trigger.current=button;
  setTitle(goal.title);setComment(goal.comment??"");
  setEvaluation(goal.evaluation);setError("");setNotice("");
  setEditing(goal.id);
 }
 function dismiss(){
  if(busy)return;
  if(dirty&&!window.confirm(t("sprintReview.discard")))return;
  setError("");setEditing(null);
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!editable||busy||!title.trim()||title.trim().length>240)return;
  const current=original;
  if(!isNew&&!current){setError(t("sprintDetail.goalsConflict"));return;}
  const payload=isNew?
   {sprintId,title:title.trim(),comment,evaluation:"not_evaluated" as const}:
   {sprintId,id:current!.id,revision:current!.revision,
    title:title.trim(),comment,evaluation};
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/sprints/goals",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   const answer=await response.json();
   if(!response.ok||!answer.ok){
    if(answer.error==="conflict"){setError(t("sprintDetail.goalsConflict"));return;}
    if(answer.error==="closed-period"){setError(t("sprintDetail.goalsClosed"));return;}
    setError(t("sprintGoals.error"));return;
   }
   setEditing(null);setNotice(t("sprintGoals.saved"));router.refresh();
  }catch{setError(t("sprintGoals.error"));}
  finally{setBusy(false);}
 }
 return <div className="d-grid gap-3">
  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
   <h2 className="h5 d-flex align-items-center gap-2 mb-0">
    <BootstrapIcon name="bullseye"/>{t("dashboard.cockpit.allSprintGoals")}
   </h2>
   {canManage&&status!=="closed"&&
    <button type="button" className="btn btn-primary btn-sm"
     onClick={e=>openNew(e.currentTarget)} disabled={busy}>
     {t("sprintDetail.goalsAdd")}
    </button>}
  </div>
  {data.state==="unavailable"?<div role="status" className="alert alert-warning mb-0">
   {t("dashboard.cockpit.notAvailable")}
  </div>:items.length===0?
   <p className="text-secondary mb-0">{t("dashboard.cockpit.goalNotSpecified")}</p>:
   <ul className="list-group list-group-flush">
    {items.map(goal=><li key={goal.id}
     className="list-group-item bg-transparent px-0 py-3 d-flex align-items-start justify-content-between gap-3">
     <div className="flex-grow-1" style={{minWidth:0}}>
      <p className="fw-semibold mb-1 text-break">{goal.title}</p>
      <span className="badge text-bg-secondary">{t(labels[goal.evaluation])}</span>
      {goal.historicalRecordedAt&&<p className="small text-secondary mt-2 mb-0">Origine : saisie manuelle rétrospective · Enregistré le {goal.historicalRecordedAt}{goal.historicalSource?` · Source : ${goal.historicalSource}`:""}</p>}
      {goal.description&&<p className="small mt-2 mb-0" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}><strong>Description historique :</strong> {goal.description}</p>}
      {goal.comment&&<p className="small text-secondary mt-2 mb-0"
       style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{goal.comment}</p>}
     </div>
     {editable&&<button type="button" className="btn btn-outline-secondary btn-sm flex-shrink-0"
      onClick={e=>openEdit(goal,e.currentTarget)}
      aria-label={t("sprintDetail.goalsEditNamed",{name:goal.title})}
      title={t("sprintDetail.goalsEditNamed",{name:goal.title})}>
      <BootstrapIcon name="pencil-square"/>
     </button>}
    </li>)}
   </ul>}
  {status==="closed"&&data.state==="available"&&
   <p className="small text-secondary mb-0">
    {t("sprintDetail.goalsHistorical",{version:data.snapshotVersion??"?"})}
   </p>}
  {notice&&<p role="status" className="alert alert-success mb-0">{notice}</p>}
  {editing!==null&&editable&&
   <dialog ref={modal} className="smn-sprint-edit-dialog"
    aria-labelledby="smn-sprint-goal-title"
    onCancel={e=>{e.preventDefault();dismiss();}}>
    <div className="modal-content bg-body border rounded-4 shadow p-3 p-md-4">
     <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
      <h3 className="h5 mb-0" id="smn-sprint-goal-title">
       {t(isNew?"sprintDetail.goalsCreateTitle":"sprintDetail.goalsEditTitle")}
      </h3>
      <button type="button" className="btn-close" onClick={dismiss}
       disabled={busy} aria-label={t("sprintDetail.close")}/>
     </div>
     <form onSubmit={save} className="d-grid gap-3">
      <div>
       <label htmlFor="smn-goal-title" className="form-label">{t("sprintGoals.goal")}</label>
       <input ref={titleInput} autoFocus id="smn-goal-title"
        className="form-control" required maxLength={240}
        value={title} disabled={busy} onChange={e=>setTitle(e.target.value)}/>
      </div>
      {!isNew?<div>
       <label htmlFor="smn-goal-evaluation" className="form-label">{t("sprintGoals.evaluation")}</label>
       <select id="smn-goal-evaluation" className="form-select" value={evaluation}
        onChange={e=>setEvaluation(e.target.value as SprintGoalEvaluation)} disabled={busy}>
        {states.map(state=><option key={state} value={state}>{t(labels[state])}</option>)}
       </select>
      </div>:<p className="small text-secondary mb-0">
       {t("sprintDetail.goalsNewUnevaluated")}
      </p>}
      <div>
       <label htmlFor="smn-goal-comment" className="form-label">{t("sprintGoals.comment")}</label>
       <textarea id="smn-goal-comment" className="form-control" rows={4}
        maxLength={2000} value={comment} disabled={busy}
        onChange={e=>setComment(e.target.value)}/>
      </div>
      {dirty&&<p className="small text-warning mb-0" role="status">{t("sprintReview.unsaved")}</p>}
      {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
      <div className="d-flex justify-content-end flex-wrap gap-2">
       <button type="button" className="btn btn-outline-secondary"
        disabled={busy} onClick={dismiss}>{t("sprintDetail.cancel")}</button>
       <button type="submit" className="btn btn-primary"
        disabled={busy||!title.trim()||title.trim().length>240}>
        {t("sprintDetail.save")}
       </button>
      </div>
     </form>
    </div>
   </dialog>}
 </div>;
}
