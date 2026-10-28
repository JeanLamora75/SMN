"use client";
import {useEffect,useRef,useState,type ChangeEvent} from "react";
import {useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import {detectLocalImportFormat,isExpectedImportPreview,summarizeImportPreview,
 IMPORT_MAX_BYTES,IMPORT_PAGE_SIZE,
 type ImportFormat,type ImportPolicy,type ImportPreview}
 from "@/lib/countries/holiday-import";
import {parseCommittedImport,unchangedImport,type ImportOutcome}
 from "@/lib/countries/import-navigation";

type IcsEvent={id:string;date:string|null;name:string;eligible:boolean;reason:string|null};
type ApiResult={ok:boolean;error?:string;events?:IcsEvent[];
 preview?:unknown;created?:number;replaced?:number;changedYears?:number[]};
type Props={country:{code:string;name:string};onCancel:()=>void;
 onCommitted:(outcome:ImportOutcome)=>void};
const rejectedReasons:Record<string,TranslationKey>={
 "column-count":"countries.csvReasonColumns",
 "invalid-date":"countries.csvReasonDate","invalid-name":"countries.csvReasonName",
 "country-mismatch":"countries.csvReasonCountry",
 "duplicate-in-file":"countries.csvReasonDuplicate",
 "already-identical":"countries.csvReasonIdentical",
 "existing-date":"countries.csvReasonExisting"
};
const eventReasons:Record<string,TranslationKey>={
 "recurrence-unsupported":"ics.recurrence","duration-unsupported":"ics.duration",
 "cancelled":"ics.cancelled","timed-or-invalid-start":"ics.timed",
 "multi-day-or-invalid-end":"ics.multiday","invalid-end":"ics.multiday",
 "invalid-name":"ics.noName","malformed-event":"ics.malformed",
 "nested-component":"ics.nested"
};
const errorLabels:Record<string,TranslationKey>={
 "invalid-ics":"ics.invalidFile","ics-too-large":"ics.tooLarge",
 "invalid-selection":"ics.invalidSelection","invalid-csv":"countries.csvInvalid",
 "csv-too-large":"countries.csvTooLarge","country-not-found":"countries.csvMissingCountry",
 "invalid-input":"countries.importInvalid","service-unavailable":"countries.failed"
};
const pageCount=(length:number)=>Math.max(1,Math.ceil(length/IMPORT_PAGE_SIZE));

export default function CountryHolidayImportPanel({country,onCancel,onCommitted}:Props){
 const t=useTranslation();
 const [format,setFormat]=useState<ImportFormat|null>(null);
 const [filename,setFilename]=useState("");
 const [raw,setRaw]=useState("");
 const [policy,setPolicy]=useState<ImportPolicy>("skip");
 const [events,setEvents]=useState<IcsEvent[]|null>(null);
 const [selected,setSelected]=useState<string[]>([]);
 const [preview,setPreview]=useState<ImportPreview|null>(null);
 const [eventPage,setEventPage]=useState(0);
 const [previewPage,setPreviewPage]=useState(0);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [reading,setReading]=useState(false);
 const requestPending=useRef(false);
 const readGeneration=useRef(0);
 const fileRef=useRef<HTMLInputElement>(null);
 const titleRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{titleRef.current?.focus();},[]);
 const onChangeFile=async(e:ChangeEvent<HTMLInputElement>)=>{
  const file=e.currentTarget.files?.[0];
  const generation=++readGeneration.current;
  setRaw("");setFilename("");setFormat(null);setEvents(null);setSelected([]);
  setPreview(null);setEventPage(0);setPreviewPage(0);setError("");setMessage("");
  if(!file)return;
  const detected=detectLocalImportFormat(file.name);
  if(!detected){setError(t("countries.importUnsupported"));return;}
  if(file.size>IMPORT_MAX_BYTES){setError(t("countries.csvTooLarge"));return;}
  setReading(true);
  try{
   const content=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());
   if(generation!==readGeneration.current)return;
   if(!content.trim()||new TextEncoder().encode(content).length>IMPORT_MAX_BYTES){
    setError(t("countries.importInvalid"));return;
   }
   setFilename(file.name);setFormat(detected);setRaw(content);
  }catch{
   if(generation===readGeneration.current)setError(t("countries.importInvalid"));
  }finally{if(generation===readGeneration.current)setReading(false);}
 };
 const changePolicy=(value:ImportPolicy)=>{
  setPolicy(value);setPreview(null);setPreviewPage(0);setError("");setMessage("");
 };
 const toggle=(id:string,checked:boolean)=>{
  setSelected(old=>checked?[...old,id]:old.filter(s=>s!==id));
  setPreview(null);setPreviewPage(0);setError("");setMessage("");
 };
 const send=async(stage:"inspect"|"preview"|"commit")=>{
  if(requestPending.current||reading||!raw||!format||
    (format==="ics"&&stage!=="inspect"&&selected.length===0)||
    (stage==="commit"&&!preview))return;
  requestPending.current=true;setBusy(true);setError("");setMessage("");
  const savedPreview=preview;
  try{
   const endpoint=format==="csv"?"/api/admin/countries/import-csv":
    "/api/admin/countries/import-ics";
   const request=format==="csv"?
    {stage,country:country.code,policy,csv:raw,
     ...(stage==="commit"?{fingerprint:savedPreview?.fingerprint}:{})}:
    {stage,country:country.code,policy,ics:raw,
     selected:stage==="inspect"?[]:selected,
     ...(stage==="commit"?{fingerprint:savedPreview?.fingerprint}:{})};
   const response=await fetch(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(request)
   });
   const body=await response.json().catch(()=>({ok:false,error:"failed"})) as ApiResult;
   if(response.status===409){
    // Discard both old and returned previews. Require an explicit new analysis.
    setPreview(null);setPreviewPage(0);
    setError(t("countries.csvPreviewExpired")+" "+t("countries.importReanalyse"));
    return;
   }
   if(!response.ok||!body.ok){
    setError(t(errorLabels[body.error??""]??"countries.failed"));
    return;
   }
   if(stage==="inspect"){
    if(!Array.isArray(body.events))throw Error("invalid-inspection");
    setEvents(body.events);setSelected([]);setEventPage(0);
    setPreview(null);setMessage(t("ics.inspected"));
    return;
   }
   if(stage==="preview"){
    if(!isExpectedImportPreview(body.preview,country.code,policy))
     throw Error("invalid-preview");
    setPreview(body.preview);setPreviewPage(0);
    setMessage(t("countries.csvPreviewReady"));
    return;
   }
   // A confirmed 200 means data may already have been written. Never send the
   // same commit again, even if its metadata is incomplete.
   if(!savedPreview)throw Error("missing-confirmed-preview");
   const outcome=parseCommittedImport(body,savedPreview)??{
    committed:true,created:body.created??0,replaced:body.replaced??0,
    rejected:savedPreview.rejected,changedYears:[],
    examinedYears:[],yearsVerified:false
   };
   setPreview(null);
   onCommitted(outcome);
  }catch{
   setError(t("countries.failed"));
  }finally{setBusy(false);requestPending.current=false;}
 };
 const eligible=events?.filter(e=>e.eligible)??[];
 const previewRows=preview?.rows??[];
 const annual=preview?summarizeImportPreview(previewRows):[];
 const anyBusy=busy||reading;
 const canAnalyse=!!raw&&!anyBusy;
 return <section className="border rounded-3 p-3 p-md-4 mt-3"
  aria-labelledby="country-import-heading">
  <div className="d-flex justify-content-between align-items-start gap-2">
   <div>
    <h3 className="h5" id="country-import-heading" tabIndex={-1} ref={titleRef}>
     {t("countries.importTitle")}
    </h3>
    <p className="text-muted small">{t("countries.importIntro")}</p>
   </div>
   <button type="button" className="btn btn-outline-secondary btn-sm"
    disabled={anyBusy} onClick={onCancel}>{t("countries.cancel")}</button>
  </div>
  <div className="d-flex flex-wrap gap-3 mb-3">
   <span><strong>{t("countries.csvCountry")} :</strong> {country.name} ({country.code})</span>
   <span className="text-muted">{t("countries.validationNational")}</span>
  </div>
  <p className="small text-muted">{t("countries.importLocalOnly")}</p>
  <div className="row g-3 align-items-end mb-3">
   <div className="col-12 col-md-7">
    <label className="form-label" htmlFor="smn-unified-import-file">
     {t("countries.importFile")}
    </label>
    <input ref={fileRef} id="smn-unified-import-file" className="form-control"
     type="file" accept=".csv,.ics,text/csv,text/calendar" disabled={anyBusy}
     onChange={event=>{void onChangeFile(event);}}/>
   </div>
   <div className="col-12 col-md-5">
    <label className="form-label" htmlFor="smn-unified-import-policy">
     {t("countries.csvPolicy")}
    </label>
    <select id="smn-unified-import-policy" className="form-select"
     value={policy} disabled={anyBusy}
     onChange={e=>changePolicy(e.target.value as ImportPolicy)}>
     <option value="skip">{t("countries.csvSkip")}</option>
     <option value="replace">{t("countries.csvReplace")}</option>
    </select>
   </div>
  </div>
  {filename&&<p className="small" role="status">
   {filename} · <strong>{format?.toUpperCase()}</strong> · UTF-8
  </p>}
  {format==="csv"&&<p className="small text-muted">
   <code>date;nom;pays</code> · <code>2026-05-01;Fête du Travail;FR</code>
  </p>}
  {format==="ics"&&<p className="small text-muted">{t("ics.noSubscriptions")}</p>}
  {format==="ics"&&<button type="button" className="btn btn-outline-primary"
   disabled={!canAnalyse} onClick={()=>void send("inspect")}>
   {t("ics.inspect")}
  </button>}
  {format==="csv"&&<button type="button" className="btn btn-outline-primary"
   disabled={!canAnalyse} onClick={()=>void send("preview")}>
   {t("countries.csvPreview")}
  </button>}
  {reading&&<p role="status">{t("countries.loading")}</p>}
  {error&&<p className="alert alert-danger mt-3" role="alert">{error}</p>}
  {message&&<p className="alert alert-info mt-3" role="status">{message}</p>}
  {format==="ics"&&events&&<section className="mt-4" aria-labelledby="country-import-events">
   <h4 id="country-import-events" className="h6">{t("ics.events")}</h4>
   <p className="small">{t("ics.eligible",{eligible:eligible.length,total:events.length})}
    {" · "}{t("ics.selected",{count:selected.length})}</p>
   <div className="d-flex flex-wrap gap-2 mb-2">
    <button type="button" className="btn btn-sm btn-outline-secondary"
     disabled={anyBusy} onClick={()=>{
      setSelected(eligible.map(e=>e.id));setPreview(null);setMessage("");setError("");
     }}>{t("ics.selectEligible")}</button>
    <button type="button" className="btn btn-sm btn-outline-secondary"
     disabled={anyBusy} onClick={()=>{
      setSelected([]);setPreview(null);setMessage("");setError("");
     }}>{t("ics.deselect")}</button>
   </div>
   <div className="table-responsive">
    <table className="table table-sm">
     <thead><tr><th scope="col">{t("ics.select")}</th>
      <th scope="col">{t("countries.csvDate")}</th>
      <th scope="col">{t("countries.csvName")}</th>
      <th scope="col">{t("ics.status")}</th></tr></thead>
     <tbody>{events.slice(eventPage*IMPORT_PAGE_SIZE,(eventPage+1)*IMPORT_PAGE_SIZE)
      .map(e=><tr key={e.id}>
       <td><input type="checkbox" className="form-check-input"
        aria-label={t("ics.select")+" "+(e.name||e.id)}
        disabled={!e.eligible||anyBusy} checked={selected.includes(e.id)}
        onChange={change=>toggle(e.id,change.target.checked)}/></td>
       <td>{e.date??"—"}</td><td>{e.name||"—"}</td>
       <td>{e.eligible?t("ics.valid"):
        t(eventReasons[e.reason??""]??"ics.unknown")}</td>
      </tr>)}</tbody>
    </table>
   </div>
   <div className="d-flex align-items-center gap-2 mb-3">
    <button type="button" className="btn btn-sm btn-outline-secondary"
     aria-label={t("countries.importPreviousPage")}
     disabled={eventPage===0||anyBusy} onClick={()=>setEventPage(n=>n-1)}>‹</button>
    <span>{eventPage+1} / {pageCount(events.length)}</span>
    <button type="button" className="btn btn-sm btn-outline-secondary"
     aria-label={t("countries.importNextPage")}
     disabled={eventPage>=pageCount(events.length)-1||anyBusy}
     onClick={()=>setEventPage(n=>n+1)}>›</button>
   </div>
   <button type="button" className="btn btn-outline-primary"
    disabled={anyBusy||selected.length===0}
    onClick={()=>void send("preview")}>{t("ics.previewSelected")}</button>
  </section>}
  {preview&&<section className="mt-4" aria-labelledby="country-import-preview">
   <h4 className="h6" id="country-import-preview">{t("countries.importPreviewTitle")}</h4>
   <p>{t("countries.csvProposed")}: <strong>{preview.proposed}</strong>
    {" · "}{t("countries.csvRejected")}: <strong>{preview.rejected}</strong></p>
   <div className="table-responsive mb-3">
    <table className="table table-sm">
     <thead><tr><th scope="col">{t("countries.yearLabel")}</th>
      <th scope="col">{t("countries.importCreated")}</th>
      <th scope="col">{t("countries.importReplaced")}</th>
      <th scope="col">{t("countries.csvRejected")}</th></tr></thead>
     <tbody>{annual.map(y=><tr key={y.year??"unknown"}>
      <td>{y.year??t("countries.importUnknownYear")}</td>
      <td>{y.created}</td><td>{y.replaced}</td><td>{y.rejected}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <div className="table-responsive">
    <table className="table table-sm table-hover">
     <thead><tr>
      <th scope="col">{t("countries.csvLine")}</th>
      <th scope="col">{t("countries.csvDate")}</th>
      <th scope="col">{t("countries.yearLabel")}</th>
      <th scope="col">{t("countries.csvName")}</th>
      <th scope="col">{t("countries.csvDecision")}</th>
      <th scope="col">{t("countries.csvPrevious")}</th>
      <th scope="col">{t("countries.importReason")}</th>
     </tr></thead>
     <tbody>{previewRows.slice(previewPage*IMPORT_PAGE_SIZE,
      (previewPage+1)*IMPORT_PAGE_SIZE).map((r,i)=><tr key={r.line+":"+i}>
       <td>{r.line}</td><td>{r.date||"—"}</td>
       <td>{/^\d{4}-/.test(r.date)?r.date.slice(0,4):"—"}</td>
       <td>{r.name}</td>
       <td>{r.action==="create"?t("countries.csvWillCreate"):
        r.action==="replace"?t("countries.csvWillReplace"):
        t("countries.csvRejected")}</td>
       <td>{r.previousName??"—"}</td>
       <td>{r.reason?t(rejectedReasons[r.reason]??"countries.csvReasonUnknown"):"—"}</td>
      </tr>)}</tbody>
    </table>
   </div>
   <div className="d-flex align-items-center gap-2 mb-3">
    <button type="button" className="btn btn-sm btn-outline-secondary"
     aria-label={t("countries.importPreviousPage")}
     disabled={previewPage===0||anyBusy} onClick={()=>setPreviewPage(n=>n-1)}>‹</button>
    <span>{previewPage+1} / {pageCount(previewRows.length)}</span>
    <button type="button" className="btn btn-sm btn-outline-secondary"
     aria-label={t("countries.importNextPage")}
     disabled={previewPage>=pageCount(previewRows.length)-1||anyBusy}
     onClick={()=>setPreviewPage(n=>n+1)}>›</button>
   </div>
   <p className="small text-muted">{t("countries.importNoAutoValidation")}</p>
   {preview.proposed===0?
    <div className="alert alert-info" role="status">
     <p>{t("countries.importNoChanges")}</p>
     <button type="button" className="btn btn-outline-primary"
      disabled={anyBusy} onClick={()=>onCommitted(unchangedImport(preview))}>
      {t("countries.importBrowseWithoutChanges")}
     </button>
    </div>:
    <button type="button" className="btn btn-primary" disabled={anyBusy}
     onClick={()=>void send("commit")}>{t("countries.importConfirm")}</button>}
  </section>}
 </section>;
}
