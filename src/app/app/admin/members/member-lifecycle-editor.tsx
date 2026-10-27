"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Assignment={id:string;teamId:string;startOn:string;endOn:string|null};
type Impact={memberId:string;teamId:string;displayName:string;revision:number;
 archived:boolean;archivedAt:string|null;today:string;activeCount:number;
 assignments:Assignment[];referenceCount:number;canDelete:boolean};
type Action="close"|"archive"|"reactivate"|"delete";
export default function MemberLifecycleEditor({memberId,onSaved,onCancel,onDirtyChange}:{
 memberId:string;onSaved:(action:Action,warning:boolean)=>void;onCancel:()=>void;onDirtyChange?:(dirty:boolean,busy:boolean)=>void;
}){
 const t=useTranslation();
 const [impact,setImpact]=useState<Impact|null>(null);
 const [phase,setPhase]=useState<"loading"|"ready"|"error">("loading");
 const [endOn,setEndOn]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [warning,setWarning]=useState("");
 const open=impact?.assignments.find(a=>a.endOn===null)??null;
 const changed=Boolean(open&&endOn!==impact?.today)||confirmation!=="";
 useUnsavedChanges(changed||busy,t("draft.leaveWarning"));
 useEffect(()=>{onDirtyChange?.(changed,busy);},[changed,busy,onDirtyChange]);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/lifecycle",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Impact>;})
   .then(data=>{
    if(!active)return;
    if(data.memberId!==memberId||!Array.isArray(data.assignments))throw Error("invalid");
    setImpact(data);setEndOn(data.today);setPhase("ready");
   }).catch(()=>{if(active)setPhase("error");});
  return ()=>{active=false;};
 },[memberId]);
 const cancel=()=>{
  if(busy)return;
  if(changed&&!window.confirm(t("draft.discardWarning")))return;
  onCancel();
 };
 const perform=async(action:Action)=>{
  if(!impact||busy)return;
  setError("");setWarning("");
  if(action==="delete"&&confirmation!=="SUPPRIMER"){
   setError(t("members.lifecycle.typeConfirmation"));return;
  }
  if(action==="close"&&(!open||endOn<open.startOn||endOn>impact.today)){
   setError(t("members.lifecycle.badDate"));return;
  }
  if(!window.confirm(t(action==="delete"?"members.lifecycle.deleteConfirm":
   action==="close"?"members.lifecycle.closeConfirm":
   action==="archive"?"members.lifecycle.archiveConfirm":
   "members.lifecycle.reactivateConfirm")))return;
  setBusy(true);
  try{
   const body=action==="close"?{action,assignmentId:open!.id,endOn,revision:impact.revision}:
    action==="delete"?{action,revision:impact.revision,confirmation:"SUPPRIMER"}:
    {action,revision:impact.revision};
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/lifecycle",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
   });
   const result=await response.json() as {ok?:boolean;error?:string;warning?:string};
   if(!response.ok||!result.ok){
    setError(t(result.error==="historical-references"?"members.lifecycle.references":
     result.error==="assignment-still-open"?"members.lifecycle.closeFirst":
     result.error==="future-version"?"members.lifecycle.futureVersion":
     result.error==="conflict"?"members.lifecycle.conflict":
     result.error==="business-data"?"members.lifecycle.hasBusinessData":
     result.error==="cascade-risk"?"members.lifecycle.cascadeRisk":
     result.error==="invalid-date"?"members.lifecycle.badDate":"members.lifecycle.failed"));
    return;
   }
   if(result.warning==="team-below-three")setWarning(t("members.lifecycle.smallTeam"));
   onSaved(action,result.warning==="team-below-three");
  }catch{setError(t("members.lifecycle.failed"));}
  finally{setBusy(false);}
 };
 const submitClose=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void perform("close");};
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="lifecycle-heading">
  <h3 className="h5" id="lifecycle-heading">{t("members.lifecycle.title")}</h3>
  {phase==="loading"&&<p role="status">{t("members.lifecycle.loading")}</p>}
  {phase==="error"&&<p role="alert" className="alert alert-warning">{t("members.lifecycle.failedLoad")}</p>}
  {impact&&phase==="ready"&&<>
   <p className="mb-0">{impact.displayName} — {t(impact.archived?
    "members.lifecycle.archived":"members.lifecycle.notArchived")}</p>
   <p className="small text-secondary mb-0">{t("members.lifecycle.referencesCount",
    {count:impact.referenceCount})}</p>
   <h4 className="h6 mb-0">{t("members.lifecycle.history")}</h4>
   {impact.assignments.length===0?<p>{t("members.lifecycle.noAssignments")}</p>:
    <div className="table-responsive"><table className="table table-sm">
     <thead><tr><th>{t("members.lifecycle.from")}</th><th>{t("members.lifecycle.until")}</th></tr></thead>
     <tbody>{impact.assignments.map(a=><tr key={a.id}><td>{a.startOn}</td>
      <td>{a.endOn??t("members.lifecycle.current")}</td></tr>)}</tbody>
    </table></div>}
   {open&&!impact.archived&&<form onSubmit={submitClose} className="d-grid gap-2">
    <label htmlFor="member-last-day" className="form-label mb-0">{t("members.lifecycle.endOn")}</label>
    <div className="d-flex gap-2 flex-wrap">
     <input id="member-last-day" type="date" className="form-control" style={{maxWidth:"260px"}}
      min={open.startOn} max={impact.today} value={endOn} required disabled={busy}
      onChange={e=>setEndOn(e.target.value)}/>
     <button className="btn btn-outline-warning" type="submit" disabled={busy}>
      {t("members.lifecycle.close")}</button>
    </div>
    <p className="small text-secondary">{t("members.lifecycle.closeHelp")}</p>
   </form>}
   {!open&&!impact.archived&&<button type="button" disabled={busy}
    className="btn btn-outline-secondary align-self-start" onClick={()=>void perform("archive")}>
    {t("members.lifecycle.archive")}</button>}
   {impact.archived&&<button type="button" disabled={busy}
    className="btn btn-outline-primary align-self-start" onClick={()=>void perform("reactivate")}>
    {t("members.lifecycle.reactivate")}</button>}
   <div className="border-top pt-3 d-grid gap-2">
    <h4 className="h6 mb-0">{t("members.lifecycle.deleteTitle")}</h4>
    <p className="small text-secondary mb-0">{t(impact.canDelete?
     "members.lifecycle.deleteHelp":"members.lifecycle.noDelete")}</p>
    {impact.canDelete&&<>
     <label htmlFor="delete-member-confirmation" className="form-label mb-0">
      {t("members.lifecycle.confirmLabel")}</label>
     <input id="delete-member-confirmation" className="form-control" style={{maxWidth:"320px"}}
      value={confirmation} autoComplete="off" disabled={busy}
      onChange={e=>setConfirmation(e.target.value)}/>
     <button type="button" className="btn btn-outline-danger align-self-start"
      disabled={busy||confirmation!=="SUPPRIMER"} onClick={()=>void perform("delete")}>
      {t("members.lifecycle.delete")}</button>
    </>}
   </div>
  </>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {warning&&<p role="status" className="alert alert-warning">{warning}</p>}
  <button type="button" disabled={busy} className="btn btn-outline-secondary align-self-start" onClick={cancel}>
   {t("members.profile.cancel")}</button>
 </section>;
}
