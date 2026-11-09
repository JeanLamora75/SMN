"use client";
import type {TranslationKey} from "@/i18n/catalog";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Target={id:string;label:string};
type Impact={
 memberId:string;memberLabel:string;mode:"erase"|"anonymize";capturedAt:string;
 complete:false;canExecute:false;restrictedEligible?:boolean;dependentEligible?:boolean;scopeRevision:string|null;revisionReason:string;
 plan:{planId:string;token:string;expiresAt:string;executionPermitted:false}|null;
 findings:{category:string;state:string;affectedCount:number|null}[];
 observedTables:{table:string;count:number|null;state:"inspected"|"unknown";
  scope:"direct"|"indirect"|"text-match"|"team-archive"}[];
 warnings:string[];
};
export default function ErasureImpactAdmin(){
 const t=useTranslation();
 const [targets,setTargets]=useState<Target[]>([]);
 const [memberId,setMemberId]=useState("");
 const [mode,setMode]=useState<"erase"|"anonymize">("erase");
 const [result,setResult]=useState<Impact|null>(null);
 const [loading,setLoading]=useState(false);
 const [validating,setValidating]=useState(false);
 const [validation,setValidation]=useState<"unchanged"|"stale"|"failed"|null>(null);
 const [error,setError]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [copiesAcknowledged,setCopiesAcknowledged]=useState(false);
 const [executing,setExecuting]=useState(false);
 const [executed,setExecuted]=useState(false);
 const [archives,setArchives]=useState<{
  inventorySha256:string;candidates:{filename?:string;kind:string;sha256:string;bytes:number}[]
 }|null>(null);
 const [archiveLoading,setArchiveLoading]=useState(false);
 const [archiveError,setArchiveError]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch("/api/admin/erasure/preview",{cache:"no-store"}).then(async response=>{
   if(!response.ok)throw new Error("unavailable");
   return response.json() as Promise<{targets:Target[]}>;
  }).then(data=>{
   if(!active)return;
   if(!Array.isArray(data.targets))throw new Error("invalid-result");
   setTargets(data.targets);
  }).catch(()=>{if(active)setError(t("erasure.unavailable"));});
  return ()=>{active=false;};
 },[t]);
 async function validatePlan(){
  if(!result?.plan||validating)return;
  setValidation(null);setValidating(true);
  try{
   const response=await fetch("/api/admin/erasure/preview/validate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token:result.plan.token}),cache:"no-store"
   });
   const data=await response.json() as {
    status?:string;revisionVerified?:boolean;executionPermitted?:boolean
   };
   if(data.executionPermitted!==false)throw new Error("invalid-result");
   setValidation(response.ok&&data.status==="unchanged"&&
    data.revisionVerified===true?"unchanged":"stale");
  }catch{setValidation("failed");}
  finally{setValidating(false);}
 }
 async function reviewManagedArchives(){
  if(archiveLoading)return;
  setArchiveLoading(true);setArchiveError(false);setArchives(null);
  try{
   const response=await fetch("/api/admin/erasure/archive-review",{
    method:"GET",cache:"no-store"
   });
   if(!response.ok)throw Error("archive-review-failed");
   const value=await response.json() as {
    inventory?:{inventorySha256:string;
     candidates:{filename?:string;kind:string;sha256:string;bytes:number}[]}
   };
   if(!Array.isArray(value.inventory?.candidates))throw Error("invalid-inventory");
   setArchives(value.inventory);
  }catch{setArchiveError(true);}
  finally{setArchiveLoading(false);}
 }
 async function executeRestricted(){
  if(!result?.plan||!(result.restrictedEligible||result.dependentEligible)||
   validation!=="unchanged"||
   !copiesAcknowledged||confirmation!=="EFFACER "+result.plan.planId||executing)return;
  setExecuting(true);setError("");
  try{
   const response=await fetch("/api/admin/erasure/execute",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token:result.plan.token,confirmation,
     acknowledgeExternalCopies:true}),cache:"no-store"
   });
   const data=await response.json() as {status?:string;affectedRows?:number};
   if(!response.ok||data.status!=="erased"||
    typeof data.affectedRows!=="number"||data.affectedRows<1)
    throw new Error("execution-blocked");
   setExecuted(true);setResult(null);setValidation(null);
   setTargets(list=>list.filter(item=>item.id!==memberId));
   setMemberId("");
  }catch{setError(t("erasure.executionFailed"));}
  finally{setExecuting(false);setConfirmation("");setCopiesAcknowledged(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading||!memberId)return;
  setResult(null);setValidation(null);setExecuted(false);
  setConfirmation("");setCopiesAcknowledged(false);setError("");setLoading(true);
  try{
   const response=await fetch("/api/admin/erasure/preview",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({memberId,mode}),cache:"no-store"
   });
   if(!response.ok)throw new Error("impact-unavailable");
   const data=await response.json() as Impact;
   if(data.memberId!==memberId||data.canExecute!==false||
    !Array.isArray(data.findings))throw new Error("invalid-preview");
   setResult(data);
  }catch{setError(t("erasure.previewFailed"));}
  finally{setLoading(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="erasure-impact-title">
  <div>
   <h2 className="h5" id="erasure-impact-title">{t("erasure.title")}</h2>
   <p className="small text-secondary">{t("erasure.intro")}</p>
  </div>
  <form onSubmit={submit} className="row g-3 align-items-end">
   <div className="col-md-7">
    <label className="form-label" htmlFor="erasure-member">{t("erasure.target")}</label>
    <select className="form-select" id="erasure-member" required value={memberId}
     onChange={event=>{setMemberId(event.target.value);setResult(null);setValidation(null);}} disabled={loading}>
     <option value="">{t("erasure.selectTarget")}</option>
     {targets.map(target=><option key={target.id} value={target.id}>{target.label}</option>)}
    </select>
   </div>
   <div className="col-md-5">
    <label className="form-label" htmlFor="erasure-mode">{t("erasure.mode")}</label>
    <select className="form-select" id="erasure-mode" value={mode}
     onChange={event=>{setMode(event.target.value as "erase"|"anonymize");setResult(null);setValidation(null);}}
     disabled={loading}>
     <option value="erase">{t("erasure.erase")}</option>
     <option value="anonymize">{t("erasure.anonymize")}</option>
    </select>
   </div>
   <div className="col-12">
    <button type="submit" className="btn btn-outline-primary" disabled={!memberId||loading}>
     {loading?t("erasure.loading"):t("erasure.preview")}
    </button>
   </div>
  </form>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {executed&&<p role="status" className="alert alert-success">{t("erasure.executionSucceeded")}</p>}
  {result&&<div className="d-grid gap-3">
   <p role="status" className="alert alert-warning mb-0">{t("erasure.incomplete")}</p>
   <p className="small mb-0">{t("erasure.targetSummary",{target:result.memberLabel})}</p>
   <div className="table-responsive">
    <table className="table table-sm align-middle">
     <thead><tr><th scope="col">{t("erasure.category")}</th>
      <th scope="col">{t("erasure.count")}</th><th scope="col">{t("erasure.coverage")}</th></tr></thead>
     <tbody>{result.findings.map(item=><tr key={item.category}>
      <th scope="row">{t(("erasure.categories."+item.category) as TranslationKey)}</th>
      <td>{item.affectedCount??t("erasure.unknown")}</td>
      <td>{t(item.state==="inspected"?"erasure.inspected":"erasure.notExhaustive")}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <details>
    <summary>{t("erasure.directReferences")}</summary>
    <div className="table-responsive mt-2"><table className="table table-sm small">
     <thead><tr><th>{t("erasure.table")}</th><th>{t("erasure.count")}</th><th>{t("erasure.coverage")}</th></tr></thead>
     <tbody>{result.observedTables.map((row,i)=><tr key={row.table+"-"+row.scope+"-"+i}>
      <td><code>{row.table}</code></td>
      <td>{row.state==="inspected"?row.count:t("erasure.unknown")}</td>
      <td>{t(row.state==="inspected"?("erasure.scopes."+row.scope) as TranslationKey:"erasure.notExhaustive")}</td>
     </tr>)}</tbody>
    </table></div>
   </details>
   <div className="alert alert-secondary">
    <strong>{t("erasure.warningsTitle")}</strong>
    <ul className="mb-0">{result.warnings.map(w=><li key={w}>
     {t(("erasure.warnings."+w) as TranslationKey)}
    </li>)}</ul>
   </div>
   <div className="border rounded p-3 d-grid gap-2">
    <h3 className="h6 mb-0">{t("erasure.stablePlanTitle")}</h3>
    {result.plan?<div>
     <p className="small mb-1">{t("erasure.stablePlanExpires",{time:new Date(result.plan.expiresAt).toLocaleString()})}</p>
     <p className="small text-secondary">{t("erasure.stablePlanNotice")}</p>
     <button type="button" className="btn btn-outline-primary btn-sm"
      disabled={validating} onClick={validatePlan}>
      {validating?t("erasure.revalidatingPlan"):t("erasure.revalidatePlan")}
     </button>
    </div>:<p className="small text-secondary mb-0">{t("erasure.planUnavailable")}</p>}
    {validation&&<p role="status" className="small mb-0">
     {t(("erasure.planStatuses."+validation) as TranslationKey)}
    </p>}
   </div>
   {(result.restrictedEligible||result.dependentEligible)&&result.plan&&mode==="erase"&&
    <div className="border rounded p-3 d-grid gap-2">
     <h3 className="h6 mb-0">{t(result.dependentEligible?
      "erasure.dependentTitle":"erasure.restrictedTitle")}</h3>
     <p className="small text-secondary mb-0">{t(result.dependentEligible?
      "erasure.dependentNotice":"erasure.restrictedNotice")}</p>
     <label className="form-check">
      <input className="form-check-input" type="checkbox"
       checked={copiesAcknowledged}
       onChange={event=>setCopiesAcknowledged(event.target.checked)}/>
      <span className="form-check-label">{t("erasure.externalCopiesAcknowledgment")}</span>
     </label>
     <label className="form-label mb-0" htmlFor="erasure-confirmation">
      {t("erasure.confirmationLabel",{
       expected:"EFFACER "+result.plan.planId})}
     </label>
     <input id="erasure-confirmation" className="form-control"
      autoComplete="off" value={confirmation}
      onChange={event=>setConfirmation(event.target.value)}/>
     <button type="button" className="btn btn-danger"
      disabled={executing||validation!=="unchanged"||!copiesAcknowledged||
       confirmation!=="EFFACER "+result.plan.planId}
      onClick={executeRestricted}>
      {executing?t("erasure.executing"):t("erasure.executeRestricted")}
     </button>
    </div>}
   <section className="border rounded p-3 d-grid gap-2">
    <h3 className="h6 mb-0">{t("erasure.archiveReviewTitle")}</h3>
    <p className="small text-secondary mb-0">
     {t("erasure.archiveReviewWarning")}
    </p>
    <button type="button" className="btn btn-outline-secondary btn-sm"
     disabled={archiveLoading} onClick={reviewManagedArchives}>
     {archiveLoading?t("erasure.archiveReviewLoading"):t("erasure.archiveReviewButton")}
    </button>
    {archiveError&&<p role="alert" className="small text-danger mb-0">
     {t("erasure.archiveReviewUnavailable")}</p>}
    {archives&&<div className="table-responsive">
     <p className="small text-secondary">
      {t("erasure.archiveReviewCount",{count:archives.candidates.length})}
     </p>
     <table className="table table-sm">
      <thead><tr>
       <th>{t("erasure.archiveName")}</th>
       <th>{t("erasure.archiveType")}</th>
       <th>SHA-256</th>
      </tr></thead>
      <tbody>{archives.candidates.map((item,i)=><tr key={item.sha256+"-"+i}>
       <td>{item.filename??"—"}</td><td>{item.kind}</td>
       <td><code className="small text-break">{item.sha256}</code></td>
      </tr>)}</tbody>
     </table>
    </div>}
   </section>
   <div className="d-flex flex-wrap gap-2 align-items-center">
    <button className="btn btn-outline-secondary" type="button"
     onClick={()=>{setResult(null);setValidation(null);}}>{t("erasure.close")}</button>
    <span className="small text-secondary">{t("erasure.noAction")}</span>
   </div>
  </div>}
 </section>;
}
