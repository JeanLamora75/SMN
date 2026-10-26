"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {canConfirmAnnualDiagnostic,diagnosticDate,
 parseValidationDiagnostic,type AnnualIssueCode,type ValidationDiagnostic,type ValidationIssue}
 from "@/lib/countries/annual-validation";
import type {TranslationKey} from "@/i18n/catalog";

type State={kind:"loading"}|{kind:"error"}|{kind:"ready";diagnostic:ValidationDiagnostic};
type Props={
 code:string;name:string;year:number;inspectedFingerprint:string;
 onCancel:()=>void;onCertified:()=>void;onInspectDates:(date:string|null)=>void;
};
const issueKeys:Record<AnnualIssueCode,TranslationKey>={
 "country-archived":"countries.validationIssueArchived",
 "empty-year":"countries.validationIssueEmpty",
 "invalid-coverage":"countries.validationIssueCoverageInvalid",
 "invalid-date":"countries.validationIssueDate",
 "invalid-name":"countries.validationIssueName",
 "duplicate-date":"countries.validationIssueDuplicate",
 "count-mismatch":"countries.validationIssueCount",
 "coverage-missing":"countries.validationIssueCoverageMissing",
 "source-missing":"countries.validationIssueSourceMissing",
 "coverage-note":"countries.validationIssueCoverageNote",
 "national-completeness-unverified":"countries.validationIssueCompleteness",
 "national-only":"countries.validationIssueNational"
};

/** Inline confirmation; never opens a second native dialog. */
export default function CountryYearValidationPanel({
 code,name,year,inspectedFingerprint,onCancel,onCertified,onInspectDates
}:Props){
 const t=useTranslation();
 const [state,setState]=useState<State>({kind:"loading"});
 const [checked,setChecked]=useState(false);
 const [busy,setBusy]=useState(false);
 const [conflict,setConflict]=useState(false);
 const [error,setError]=useState("");
 const heading=useRef<HTMLHeadingElement>(null);
 const inFlight=useRef(false);
 const url="/api/admin/countries/"+encodeURIComponent(code)+
  "/calendar/validate?year="+year;
 const loadDiagnostic=useCallback(async(signal?:AbortSignal)=>{
  const response=await fetch(url,{cache:"no-store",signal});
  if(!response.ok)throw Error("diagnostic-unavailable");
  const body=await response.json() as {diagnostic?:unknown};
  const parsed=parseValidationDiagnostic(body.diagnostic,code,year);
  if(!parsed)throw Error("diagnostic-invalid");
  return parsed;
 },[url,code,year]);
 const reload=()=>{
  setChecked(false);setState({kind:"loading"});
  void loadDiagnostic().then(d=>setState({kind:"ready",diagnostic:d}))
   .catch(()=>setState({kind:"error"}));
 };
 useEffect(()=>{
  const controller=new AbortController();
  setChecked(false);
  void loadDiagnostic(controller.signal)
   .then(d=>{if(!controller.signal.aborted)setState({kind:"ready",diagnostic:d});})
   .catch(()=>{if(!controller.signal.aborted)setState({kind:"error"});});
  heading.current?.focus();
  return ()=>controller.abort();
 },[loadDiagnostic]);
 const diagnostic=state.kind==="ready"?state.diagnostic:null;
 const stale=conflict||!!diagnostic&&diagnostic.fingerprint!==inspectedFingerprint;
 const allowed=canConfirmAnnualDiagnostic(diagnostic,checked,stale,busy);
 const issueLabel=(issue:ValidationIssue):string=>t(issueKeys[issue.code]);
 const showIssue=(issue:ValidationIssue,index:number)=>(
  <li key={issue.code+":"+index} className="mb-2">
   <span>{issueLabel(issue)}</span>
   {issue.details&&<span className="d-block small text-muted">{issue.details}</span>}
   <button type="button" className="btn btn-link btn-sm p-0 mt-1"
    disabled={busy} onClick={()=>onInspectDates(diagnosticDate(issue))}>
    {diagnosticDate(issue)?t("countries.validationGoToDate"):
     t("countries.validationReviewDates")}
   </button>
  </li>
 );
 const validate=async()=>{
  if(!allowed||!diagnostic||inFlight.current)return;
  inFlight.current=true;setBusy(true);setError("");
  try{
   const response=await fetch(url.split("?")[0],{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({year,fingerprint:diagnostic.fingerprint,
     confirmComplete:true,source:"manual-review"})
   });
   if(response.ok){
    const raw=await response.json() as {ok?:boolean};
    if(raw.ok!==true)throw Error("validation-response-invalid");
    onCertified();
    return;
   }
   if(response.status===409){
    setChecked(false);setConflict(true);setError(t("countries.validationConflict"));
    setState({kind:"loading"});
    try{
     const latest=await loadDiagnostic();
     setState({kind:"ready",diagnostic:latest});
    }catch{setState({kind:"error"});}
   }else if(response.status===422){
    setChecked(false);setConflict(true);setError(t("countries.validationBlocked"));
    setState({kind:"loading"});
    try{
     const latest=await loadDiagnostic();
     setState({kind:"ready",diagnostic:latest});
    }catch{setState({kind:"error"});}
   }else if(response.status===403){
    setChecked(false);setError(t("countries.forbidden"));
   }else{
    setChecked(false);setError(t("countries.validationServerError"));
   }
  }catch{
   setChecked(false);setError(t("countries.validationServerError"));
  }finally{inFlight.current=false;setBusy(false);}
 };
 return <section className="border rounded-3 p-3 p-md-4 mt-3"
  aria-labelledby="country-validation-heading">
  <h3 id="country-validation-heading" ref={heading} tabIndex={-1} className="h5">
   {t("countries.validationPanelTitle")}
  </h3>
  <p className="small text-muted">{t("countries.validationIntro")}</p>
  <div className="d-flex flex-wrap gap-3 mb-3">
   <div><strong>{t("countries.csvCountry")} :</strong> {name} ({code})</div>
   <div><strong>{t("countries.yearLabel")} :</strong> {year}</div>
   <div><strong>{t("countries.validationScope")} :</strong> {t("countries.validationNational")}</div>
   <div><strong>{t("countries.validationCount")} :</strong> {diagnostic?.count??"—"}</div>
  </div>
  {state.kind==="loading"&&<p role="status">{t("countries.loading")}</p>}
  {state.kind==="error"&&<div role="alert" className="alert alert-warning">
   <p>{t("countries.validationDiagnosticError")}</p>
   <button type="button" className="btn btn-outline-primary btn-sm"
    onClick={reload}>{t("common.retry")}</button>
  </div>}
  {diagnostic&&<>
   <p className="small text-muted">{t("countries.validationSource")} :
    {" "}{diagnostic.source??t("countries.validationSourceUnknown")}
   </p>
   {diagnostic.administrativeValidated&&<div className="alert alert-success" role="status">
    {t("countries.validationAlreadyDone")}
   </div>}
   {stale&&<div className="alert alert-warning" role="alert">
    {error||t("countries.validationStale")}
    <div className="mt-2">
     <button type="button" className="btn btn-outline-primary btn-sm"
      onClick={()=>onInspectDates(null)}>{t("countries.validationReviewDates")}</button>
    </div>
   </div>}
   <div className="mb-3">
    <h4 className="h6">{t("countries.validationBlocking",{count:diagnostic.blocking.length})}</h4>
    {diagnostic.blocking.length?
     <ul className="text-danger mb-0">{diagnostic.blocking.map(showIssue)}</ul>:
     <p className="small text-success mb-0">{t("countries.validationNoBlocking")}</p>}
   </div>
   <div className="mb-3">
    <h4 className="h6">{t("countries.validationWarnings",{count:diagnostic.warnings.length})}</h4>
    {diagnostic.warnings.length?
     <ul className="mb-0">{diagnostic.warnings.map(showIssue)}</ul>:
     <p className="small text-muted">{t("countries.validationNoWarnings")}</p>}
   </div>
   {diagnostic.blocking.length>0&&<p role="alert" className="alert alert-danger">
    {t("countries.validationBlocked")}
   </p>}
   {!diagnostic.administrativeValidated&&<label className="d-flex align-items-start gap-2 mb-3">
    <input type="checkbox" className="form-check-input mt-1" checked={checked}
     disabled={busy||stale||diagnostic.blocking.length>0||diagnostic.count===0}
     onChange={event=>setChecked(event.target.checked)}/>
    <span>{t("countries.validationConfirmText",{country:name,year})}</span>
   </label>}
  </>}
  {error&&!stale&&<p role="alert" className="alert alert-danger">{error}</p>}
  {state.kind==="ready"&&!allowed&&!diagnostic?.administrativeValidated&&
   <p id="country-validation-disabled" className="small text-muted">
    {t(stale?"countries.validationNeedRefresh":
     diagnostic?.blocking.length?"countries.validationNeedFix":
     "countries.validationNeedConsent")}
   </p>}
  <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
   <button type="button" className="btn btn-outline-secondary" disabled={busy}
    onClick={onCancel}>{t("countries.cancel")}</button>
   <button type="button" className="btn btn-primary" disabled={!allowed}
    aria-describedby={!allowed&&state.kind==="ready"&&!diagnostic?.administrativeValidated?
     "country-validation-disabled":undefined}
    onClick={()=>void validate()}>
    {busy?t("countries.loading"):t("countries.validationConfirm")}
   </button>
  </div>
 </section>;
}
