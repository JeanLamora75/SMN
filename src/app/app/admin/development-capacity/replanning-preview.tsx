"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Reference={jh:number|null;status:"calculated"|"not-calculable";missing:string[]};
type Preview={oldStart:string;oldEnd:string;newStart:string;newEnd:string;
 revision:number;previewDigest:string;before:Reference;after:Reference;
 referenceDeltaJh:number|null;manualPlannedJh:number|null;manualActualJh:number|null;
 retainedBeforeJh:number|null;proposedRetainedAfterJh:number|null;
 initialFrozenJh:number|null;initialFrozenSource:string|null;
 originalClosed:boolean;targetOccupied:boolean;canConfirm:boolean;
 blockers:("closed"|"target-in-use"|"same-period"|"missing-reference")[]};
const numberText=(n:number)=>n.toLocaleString("fr-FR",{maximumFractionDigits:4})+" JH";
export default function ReplanningPreview({start,end}:{start:string;end:string}){
 const t=useTranslation();
 const [newStart,setNewStart]=useState(start);
 const [newEnd,setNewEnd]=useState(end);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 useUnsavedChanges(loading,t("draft.leaveWarning"));
 const changeDates=(setter:(v:string)=>void,value:string)=>{
  setter(value);setPreview(null);setConfirmed(false);setMessage("");setError("");
 };
 const fetchPreview=async()=>{
  setLoading(true);setError("");setMessage("");setConfirmed(false);setPreview(null);
  try{
   const params=new URLSearchParams({oldStart:start,oldEnd:end,newStart,newEnd});
   const response=await fetch("/api/admin/capacity-replanning?"+params.toString(),
    {cache:"no-store"});
   const body=await response.json();
   if(!response.ok||!body.ok){
    setError(body.error==="calculation-error"?"replanning.errorCalculation":
     body.error==="period-not-found"?"replanning.errorNoPeriod":
     "replanning.errorPreview");
    return;
   }
   setPreview(body.preview as Preview);
  }catch{setError("replanning.errorCalculation");}
  finally{setLoading(false);}
 };
 const confirm=async()=>{
  if(!preview||!preview.canConfirm||confirmed||loading)return;
  if(!window.confirm(t("replanning.confirmQuestion")))return;
  setLoading(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/capacity-replanning",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({oldStart:start,oldEnd:end,newStart,newEnd,
     revision:preview.revision,previewDigest:preview.previewDigest,
     eventId:crypto.randomUUID()})
   });
   const body=await response.json();
   if(!response.ok||!body.ok){
    setPreview(null);
    setError(response.status===423?"replanning.errorClosed":
     response.status===409?"replanning.errorStale":
     body.error==="not-calculable"?"replanning.errorCalculation":
     "replanning.errorConfirm");
    return;
   }
   setConfirmed(true);setPreview(body.preview as Preview);
   setMessage("replanning.confirmed");
  }catch{setPreview(null);setError("replanning.errorConfirm");}
  finally{setLoading(false);}
 };
 const render=(value:number|null)=>value===null?
  t("replanning.notCalculable"):numberText(value);
 const blockerKeys={
  "closed":"replanning.blockClosed",
  "target-in-use":"replanning.blockTarget",
  "same-period":"replanning.blockSame",
  "missing-reference":"replanning.blockMissing",
 } as const;
 const blocker=(value:Preview["blockers"][number])=>t(blockerKeys[value]);
 return <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="replanning-title">
  <h2 id="replanning-title" className="h5">{t("replanning.title")}</h2>
  <p className="small text-secondary">{t("replanning.intro")}</p>
  <div className="row g-2">
   <div className="col-md-6">
    <label htmlFor="replan-start" className="form-label">{t("replanning.newStart")}</label>
    <input id="replan-start" className="form-control" type="date" value={newStart}
     onChange={e=>changeDates(setNewStart,e.target.value)} disabled={loading}/>
   </div>
   <div className="col-md-6">
    <label htmlFor="replan-end" className="form-label">{t("replanning.newEnd")}</label>
    <input id="replan-end" className="form-control" type="date" value={newEnd}
     onChange={e=>changeDates(setNewEnd,e.target.value)} disabled={loading}/>
   </div>
  </div>
  <button type="button" className="btn btn-outline-primary align-self-start"
   disabled={loading} onClick={()=>void fetchPreview()}>{t("replanning.preview")}</button>
  {error&&<p role="alert" className="alert alert-warning">{t(error as "replanning.errorPreview")}</p>}
  {message&&<p role="status" className="alert alert-success">{t(message as "replanning.confirmed")}</p>}
  {preview&&<>
   <p className="small text-secondary">{confirmed?t("replanning.savedTarget"):
    t("replanning.unsaved")}</p>
   <div className="table-responsive">
    <table className="table table-sm align-middle">
     <thead><tr><th scope="col">{t("replanning.metric")}</th>
      <th scope="col">{t("replanning.before")}</th>
      <th scope="col">{t("replanning.after")}</th></tr></thead>
     <tbody>
      <tr><th scope="row">{t("replanning.period")}</th>
       <td>{start} → {end}</td><td>{newStart} → {newEnd}</td></tr>
      <tr><th scope="row">{t("replanning.reference")}</th>
       <td>{render(preview.before.jh)}</td><td>{render(preview.after.jh)}</td></tr>
      <tr><th scope="row">{t("replanning.retained")}</th>
       <td>{render(preview.retainedBeforeJh)}</td>
       <td>{render(preview.proposedRetainedAfterJh)}</td></tr>
     </tbody>
    </table>
   </div>
   <p>{t("replanning.referenceDelta")}: <strong>
    {render(preview.referenceDeltaJh)}</strong></p>
   <p>{t("replanning.initialFrozen")}: {render(preview.initialFrozenJh)}</p>
   <p>{t("replanning.manualPlanned")}: {render(preview.manualPlannedJh)}</p>
   <p>{t("replanning.manualActual")}: {render(preview.manualActualJh)}</p>
   <p className="small text-secondary">{t("replanning.manualNotice")}</p>
   {(preview.before.missing.length>0||preview.after.missing.length>0)&&
    <p className="alert alert-warning">{t("replanning.missing")}
     {" "+[...new Set([...preview.before.missing,...preview.after.missing])].join(", ")}</p>}
   {preview.blockers.length>0&&<div className="alert alert-warning">
    <p>{t("replanning.blocked")}</p>
    <ul>{preview.blockers.map(b=><li key={b}>{blocker(b)}</li>)}</ul>
   </div>}
   {!confirmed&&<button type="button" className="btn btn-primary align-self-start"
    disabled={loading||!preview.canConfirm} onClick={()=>void confirm()}>
    {t("replanning.confirm")}</button>}
   <p className="small text-secondary">{t("replanning.scopeNotice")}</p>
  </>}
 </section>;
}
