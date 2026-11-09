import type {TranslationKey} from "@/i18n/catalog";
"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Target={id:string;label:string};
type Impact={
 memberId:string;memberLabel:string;mode:"erase"|"anonymize";capturedAt:string;
 complete:false;canExecute:false;scopeRevision:string|null;revisionReason:string;
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
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading||!memberId)return;
  setResult(null);setValidation(null);setError("");setLoading(true);
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
   <div className="d-flex flex-wrap gap-2 align-items-center">
    <button className="btn btn-outline-secondary" type="button"
     onClick={()=>{setResult(null);setValidation(null);}}>{t("erasure.close")}</button>
    <span className="small text-secondary">{t("erasure.noAction")}</span>
   </div>
  </div>}
 </section>;
}
