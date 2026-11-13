"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
import BootstrapIcon from "../bootstrap-icon";
import {useLocale,useTranslation} from "@/i18n/client";
import type {TicketScope} from "@/server/tickets/snapshot-storage";

type Snapshot={snapshotId:string;businessDate:string;originalFilename:string};
type CsvDiagnostic={line:number;column:string;code:string;message:string;severity:"error"|"warning"};
type Preview={valid:boolean;rowCount:number;errors:CsvDiagnostic[];warnings:CsvDiagnostic[]};
type ImportProps={
 scope:TicketScope;cycleName:string;
 onClose:()=>void;onSaved:(snapshotId:string)=>void;
};
const MAX_FILE_BYTES=8*1024*1024;
const errorKeys={
 "invalid-input":"invalidInput","size-limit":"sizeLimit","missing-header":"missingHeader",
 "missing-column":"missingColumn","duplicate-column":"duplicateColumn",
 "duplicate-or-blank-header":"duplicateOrBlankHeader","row-limit":"rowLimit",
 "empty":"empty","column-count":"columnCount","missing-jira-id":"missingJiraId",
 "duplicate-jira-id":"duplicateJiraId","unclosed-quote":"unclosedQuote",
 "csv-syntax":"csvSyntax","unreadable-story-points":"unreadableStoryPoints",
} as const;
type ErrorCode=keyof typeof errorKeys;

export default function TicketsImportDialog({scope,cycleName,onClose,onSaved}:ImportProps){
 const t=useTranslation(),locale=useLocale();
 const dialog=useRef<HTMLDialogElement>(null);
 const busyRef=useRef(false);
 const abort=useRef<AbortController|null>(null);
 const [file,setFile]=useState<File|null>(null);
 const [businessDate,setBusinessDate]=useState("");
 const [stage,setStage]=useState<"form"|"confirm">("form");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [csv,setCsv]=useState<string|null>(null);
 const [existing,setExisting]=useState<Snapshot|null>(null);
 const localeCode=locale==="en"?"en-GB":"fr-FR";
 const displayDate=(date:string)=>new Intl.DateTimeFormat(localeCode,{
  day:"2-digit",month:"long",year:"numeric",timeZone:"UTC",
 }).format(new Date(date+"T00:00:00Z"));

 useEffect(()=>{
  const node=dialog.current;
  node?.showModal();
  return ()=>{abort.current?.abort();node?.close();};
 },[]);
 function close(){
  if(busyRef.current)return;
  onClose();
 }
 function clearValidation(){
  setPreview(null);setCsv(null);setMessage("");setExisting(null);setStage("form");
 }
 async function listCurrent(signal:AbortSignal):Promise<Snapshot[]>{
  const params=new URLSearchParams({teamId:scope.teamId,cycleId:scope.cycleId,mode:scope.mode});
  const response=await fetch("/api/admin/tickets/snapshots?"+params.toString(),{
   cache:"no-store",signal,
  });
  if(!response.ok)throw Error("list-failed");
  const data=await response.json() as {snapshots?:Snapshot[]};
  if(!Array.isArray(data.snapshots))throw Error("list-invalid");
  return data.snapshots;
 }
 async function performSave(content:string,expected?:string){
  if(!file||busyRef.current)return;
  busyRef.current=true;setBusy(true);setMessage("");
  const controller=new AbortController();abort.current=controller;
  try{
   const response=await fetch("/api/admin/tickets/snapshots",{
    method:"POST",headers:{"Content-Type":"application/json"},
    signal:controller.signal,
    body:JSON.stringify({
     teamId:scope.teamId,cycleId:scope.cycleId,mode:scope.mode,
     businessDate,filename:file.name,csv:content,
     ...(expected?{expectedSnapshotId:expected}:{}),
    }),
   });
   if(response.ok){
    const result=await response.json() as {snapshot?:{snapshotId?:string}};
    if(!result.snapshot?.snapshotId)throw Error("invalid-save-response");
    onSaved(result.snapshot.snapshotId);
    return;
   }
   const result=await response.json() as {error?:string};
   if(response.status===409&&
    (result.error==="confirmation-required"||result.error==="stale-confirmation")){
    const current=await listCurrent(controller.signal);
    const next=current.find(item=>item.businessDate===businessDate)??null;
    if(next){
     setExisting(next);setStage("confirm");
     setMessage(expected?t("tickets.importConflictChanged"):"");
     return;
    }
   }
   if(result.error==="invalid-csv"){
    setPreview(null);setMessage(t("tickets.importInvalid"));setStage("form");
   }else{
    setMessage(t("tickets.importServerError"));setStage("form");
   }
  }catch(error){
   if((error as Error).name!=="AbortError"){
    setMessage(t("tickets.importServerError"));setStage("form");
   }
  }finally{
   if(abort.current===controller)abort.current=null;
   busyRef.current=false;setBusy(false);
  }
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busyRef.current)return;
  setMessage("");setPreview(null);
  if(!file){setMessage(t("tickets.importFileRequired"));return;}
  if(!/\.csv$/i.test(file.name)){setMessage(t("tickets.importWrongExtension"));return;}
  if(file.size>MAX_FILE_BYTES){setMessage(t("tickets.importTooLarge"));return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)||
    !Number.isFinite(Date.parse(businessDate+"T00:00:00Z"))||
    new Date(businessDate+"T00:00:00Z").toISOString().slice(0,10)!==businessDate){
   setMessage(t("tickets.importDateRequired"));return;
  }
  busyRef.current=true;setBusy(true);
  const controller=new AbortController();abort.current=controller;
  let content:string;
  try{
   content=await file.text();
   if(controller.signal.aborted)return;
   const response=await fetch("/api/admin/tickets/validate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({csv:content}),signal:controller.signal,
   });
   if(response.status!==200&&response.status!==422)
    throw Error("validation-unavailable");
   const data=await response.json() as Preview;
   if(!Array.isArray(data.errors)||!Array.isArray(data.warnings))
    throw Error("validation-response");
   setPreview(data);
   if(!data.valid){setMessage(t("tickets.importInvalid"));return;}
   setCsv(content);
  }catch(error){
   if((error as Error).name!=="AbortError")setMessage(t("tickets.importServerError"));
   return;
  }finally{
   if(abort.current===controller)abort.current=null;
   busyRef.current=false;setBusy(false);
  }
  // A fresh list catches imports made in other tabs since the dialog opened.
  busyRef.current=true;setBusy(true);
  const check=new AbortController();abort.current=check;
  try{
   const all=await listCurrent(check.signal);
   const candidate=all.find(item=>item.businessDate===businessDate)??null;
   if(candidate){setExisting(candidate);setStage("confirm");return;}
  }catch(error){
   if((error as Error).name!=="AbortError")
    setMessage(t("tickets.importServerError"));
   return;
  }finally{
   if(abort.current===check)abort.current=null;
   busyRef.current=false;setBusy(false);
  }
  await performSave(content);
 }
 function diagnosticText(diagnostic:CsvDiagnostic):string{
  const key=Object.prototype.hasOwnProperty.call(errorKeys,diagnostic.code)?
   errorKeys[diagnostic.code as ErrorCode]:null;
  const message=key?t(`tickets.importErrorCodes.${key}`):t("tickets.importValidationFailed");
  return t("tickets.importIssue",{
   line:diagnostic.line,column:diagnostic.column,message,
  });
 }
 return <dialog ref={dialog} className="smn-cockpit-modal smn-tickets-dialog smn-tickets-import-dialog"
  aria-labelledby="smn-tickets-import-title"
  onCancel={event=>{if(busyRef.current)event.preventDefault();else onClose();}}>
  <div className="smn-cockpit-modal-header">
   <h2 id="smn-tickets-import-title">
    <BootstrapIcon name={stage==="confirm"?"exclamation-triangle-fill":"plus-lg"}/>{" "}
    {t(stage==="confirm"?"tickets.importReplaceTitle":"tickets.importDialogTitle")}
   </h2>
   <button type="button" className="btn-close" onClick={close}
    disabled={busy} aria-label={t("tickets.importClose")}/>
  </div>
  {stage==="form"?<form className="smn-tickets-import-form" onSubmit={event=>void submit(event)}>
   <div className="smn-cockpit-modal-body">
    <p className="smn-tickets-import-intro">{t("tickets.importIntro")}</p>
    <div className="smn-tickets-import-field">
     <label className="form-label" htmlFor="smn-tickets-import-cycle">{t("tickets.importCycle")}</label>
     <input className="form-control" id="smn-tickets-import-cycle" value={cycleName}
      readOnly/>
    </div>
    <div className="smn-tickets-import-field">
     <label className="form-label" htmlFor="smn-tickets-import-file">{t("tickets.importFile")}</label>
     <input className="form-control" id="smn-tickets-import-file" type="file"
      accept=".csv,text/csv" required disabled={busy}
      onChange={event=>{setFile(event.target.files?.[0]??null);clearValidation();}}/>
     <small>{t("tickets.importFileHelp")}</small>
    </div>
    <div className="smn-tickets-import-field">
     <label className="form-label" htmlFor="smn-tickets-import-date">{t("tickets.importDate")}</label>
     <input className="form-control" id="smn-tickets-import-date" type="date"
      value={businessDate} required disabled={busy}
      onChange={event=>{setBusinessDate(event.target.value);clearValidation();}}/>
     <small>{t("tickets.importDateHelp")}</small>
    </div>
    {preview?.valid&&<p className="alert alert-success" role="status">
     {t("tickets.importRowCount",{count:preview.rowCount})}
    </p>}
    {preview&&preview.errors.length>0&&<section className="smn-tickets-import-diagnostics"
      aria-label={t("tickets.importDiagnostics")}>
     <strong>{t("tickets.importDiagnostics")}</strong>
     <ul>{preview.errors.map((issue,index)=><li key={index}>{diagnosticText(issue)}</li>)}</ul>
    </section>}
    {preview&&preview.warnings.length>0&&<section className="smn-tickets-import-diagnostics"
      aria-label={t("tickets.importWarnings")}>
     <strong>{t("tickets.importWarnings")}</strong>
     <ul>{preview.warnings.map((issue,index)=><li key={index}>{diagnosticText(issue)}</li>)}</ul>
    </section>}
    {message&&<p className="alert alert-danger" role="alert">{message}</p>}
   </div>
   <div className="smn-cockpit-modal-footer">
    <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={close}>
     {t("tickets.importCancel")}
    </button>
    <button className="btn btn-primary" type="submit" disabled={busy||!file||!businessDate}>
     <BootstrapIcon name="plus-lg"/>{" "}
     {busy?t("tickets.importChecking"):t("tickets.importSubmit")}
    </button>
   </div>
  </form>:<div className="smn-tickets-import-form">
   <div className="smn-cockpit-modal-body">
    <p role="alert" className="alert alert-warning">
     {t("tickets.importReplaceDescription",{
      date:displayDate(businessDate),
      filename:existing?.originalFilename??"",
     })}
    </p>
    {file&&<p className="smn-tickets-import-intro">{t("tickets.importFile")}: <strong>{file.name}</strong></p>}
    {preview?.valid&&<p>{t("tickets.importRowCount",{count:preview.rowCount})}</p>}
    {message&&<p role="alert" className="alert alert-danger">{message}</p>}
   </div>
   <div className="smn-cockpit-modal-footer">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={()=>{setStage("form");setMessage("");}}>
     {t("tickets.importReplaceCancel")}
    </button>
    <button type="button" className="btn btn-danger" disabled={busy||!existing||csv===null}
     onClick={()=>{if(existing&&csv!==null)void performSave(csv,existing.snapshotId);}}>
     <BootstrapIcon name="floppy"/>{" "}
     {busy?t("tickets.importSaving"):t("tickets.importReplaceConfirm")}
    </button>
   </div>
  </div>}
 </dialog>;
}
