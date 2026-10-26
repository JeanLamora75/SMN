"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {isCivilDate,parseYearSnapshot,type YearSnapshot} from "@/lib/countries/holiday-editor";

export type HolidayEdit={
 action:"create"|"update"|"delete";
 original?:{date:string;name:string};
};
type TargetState={kind:"none"|"loading"|"error"}|
 {kind:"ready";snapshot:YearSnapshot};
type Props={
 country:string;year:number;snapshot:YearSnapshot;edit:HolidayEdit;
 onCancel:()=>void;onSaved:()=>void;
};

const control=/[\u0000-\u001f\u007f]/u;
async function fetchSnapshot(code:string,year:number,signal?:AbortSignal){
 const response=await fetch("/api/admin/countries/calendar?country="+encodeURIComponent(code)+
  "&year="+year,{cache:"no-store",signal});
 if(!response.ok)throw Error("calendar-read-failed");
 const parsed=parseYearSnapshot(await response.json(),code,year);
 if(!parsed)throw Error("calendar-response-mismatch");
 return parsed;
}

export default function CountryHolidayEditorPanel({
 country,year,snapshot,edit,onCancel,onSaved
}:Props){
 const t=useTranslation();
 const [date,setDate]=useState(edit.original?.date??String(year)+"-01-01");
 const [name,setName]=useState(edit.original?.name??"");
 const [reason,setReason]=useState("");
 const [target,setTarget]=useState<TargetState>({kind:"none"});
 const [busy,setBusy]=useState(false);
 const [failure,setFailure]=useState("");
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [targetAttempt,setTargetAttempt]=useState(0);
 const dateRef=useRef<HTMLInputElement>(null);
 const reasonRef=useRef<HTMLInputElement>(null);
 const submitting=useRef(false);

 useEffect(()=>{
  (edit.action==="delete"?reasonRef:dateRef).current?.focus();
 },[edit.action]);

 const targetYear=edit.action==="delete"||!isCivilDate(date)?null:Number(date.slice(0,4));
 const crossYear=targetYear!==null&&targetYear!==year;
 useEffect(()=>{
  if(!crossYear||targetYear===null){
   return;
  }
  const controller=new AbortController();
  void fetchSnapshot(country,targetYear,controller.signal)
   .then(result=>{if(!controller.signal.aborted)setTarget({kind:"ready",snapshot:result});})
   .catch(()=>{if(!controller.signal.aborted)setTarget({kind:"error"});});
  return ()=>controller.abort();
 },[country,crossYear,targetYear,targetAttempt]);

 const remoteTarget=crossYear&&target.kind==="ready"&&target.snapshot.year===targetYear?
  target.snapshot:null;
 const pendingTarget=crossYear&&!remoteTarget;
 const original=edit.original;
 const isDuplicate=edit.action!=="delete"&&isCivilDate(date)&&
  (targetYear===year?snapshot.holidays:remoteTarget?.holidays??[])
   .some(h=>h.date===date&&h.date!==original?.date);
 const sourceValidated=snapshot.administrativeValidated;
 const targetValidated=remoteTarget?.administrativeValidated===true;
 const emptied=edit.action==="delete"&&snapshot.holidays.length===1;
 const movingLast=edit.action==="update"&&crossYear&&snapshot.holidays.length===1;
 const changeName=(v:string)=>{setName(v);setFailure("");};
 const changeDate=(v:string)=>{setDate(v);setFailure("");
  setTarget({kind:"none"});};

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(submitting.current)return;
  setFailure("");
  if(edit.action!=="delete"&&(!isCivilDate(date)||!name.trim()||
    name.trim().length>120||control.test(name))){
   setFailure(t("countries.editInvalid"));return;
  }
  if(!reason.trim()||reason.trim().length>500||control.test(reason)){
   setFailure(t("countries.editReasonRequired"));return;
  }
  if(isDuplicate){setFailure(t("countries.editDateConflict"));return;}
  if(pendingTarget){setFailure(t("countries.editTargetUnavailable"));return;}
  if(edit.action==="delete"&&!confirmDelete){
   setFailure(t("countries.editConfirmRequired"));return;
  }
  const years:Record<string,string>={[String(year)]:snapshot.fingerprint};
  if(remoteTarget&&targetYear!==null)years[String(targetYear)]=remoteTarget.fingerprint;
  const body=edit.action==="create"?
   {action:"create",date,name:name.trim(),reason:reason.trim(),expectedYears:years}:
   edit.action==="update"?
   {action:"update",originalDate:original!.date,date,name:name.trim(),
    reason:reason.trim(),expectedYears:years}:
   {action:"delete",originalDate:original!.date,reason:reason.trim(),expectedYears:years};
  submitting.current=true;setBusy(true);
  try{
   const response=await fetch("/api/admin/countries/"+encodeURIComponent(country)+"/holidays",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
   });
   if(!response.ok){
    const result=await response.json().catch(()=>({error:"unknown"})) as {error?:string};
    const err=result.error;
    setFailure(t(err==="date-conflict"?"countries.editDateConflict":
     err==="conflict"?"countries.editConcurrent":
     err==="not-found"||err==="country-not-found"?"countries.editMissing":
     err==="country-archived"?"countries.editArchived":
     err==="invalid-input"?"countries.editInvalid":
     err==="forbidden"?"countries.forbidden":"countries.editNetworkError"));
    return;
   }
   onSaved();
  }catch{
   setFailure(t("countries.editNetworkError"));
  }finally{setBusy(false);submitting.current=false;}
 }

 const title=edit.action==="create"?t("countries.editAddTitle"):
  edit.action==="update"?t("countries.editUpdateTitle"):t("countries.editDeleteTitle");

 return <section className="smn-country-holiday-editor border rounded-3 p-3 p-md-4 mt-3"
  aria-labelledby="smn-country-holiday-editor-heading">
  <h3 id="smn-country-holiday-editor-heading" className="h5">{title}</h3>
  <form onSubmit={event=>{void submit(event);}} noValidate>
   {edit.action==="delete"?
    <div className="mb-3">
     <p>{t("countries.editDeleteQuestion")}</p>
     <p><strong>{original?.date}</strong> — {original?.name}</p>
     {emptied&&<p className="alert alert-warning">{t("countries.editYearEmptyWarning")}</p>}
    </div>:
    <div className="row g-3 mb-3">
     <div className="col-12 col-md-5">
      <label className="form-label" htmlFor="smn-holiday-edit-date">{t("countries.csvDate")}</label>
      <input ref={dateRef} id="smn-holiday-edit-date" type="date" className="form-control"
       min="1900-01-01" max="2200-12-31" required disabled={busy}
       value={date} onChange={event=>changeDate(event.target.value)}/>
     </div>
     <div className="col-12 col-md-7">
      <label className="form-label" htmlFor="smn-holiday-edit-name">{t("countries.csvName")}</label>
      <input id="smn-holiday-edit-name" className="form-control" required maxLength={120}
       disabled={busy} value={name} onChange={event=>changeName(event.target.value)}/>
     </div>
    </div>}
   {crossYear&&<p className="small text-muted" role="status">
    {t("countries.editOtherYear",{year:targetYear??year})}
    {pendingTarget&&" — "+t(target.kind==="error"?"countries.editTargetUnavailable":
     "countries.loading")}
   </p>}
   {crossYear&&target.kind==="error"&&<button type="button"
    className="btn btn-sm btn-outline-primary align-self-start mb-2"
    onClick={()=>{setTarget({kind:"loading"});setTargetAttempt(n=>n+1);}}>
    {t("countries.editRetryTarget")}
   </button>}
   {movingLast&&<p className="alert alert-warning" role="status">
    {t("countries.editYearEmptyWarning")}
   </p>}
   {(sourceValidated||targetValidated)&&<div className="alert alert-warning" role="status">
    {t("countries.editValidatedWarning")}
   </div>}
   {edit.action!=="delete"&&isDuplicate&&<div className="alert alert-warning" role="alert">
    {t("countries.editDateConflict")}
   </div>}
   <div className="mb-3">
    <label className="form-label" htmlFor="smn-holiday-edit-reason">{t("countries.editReason")}</label>
    <input ref={reasonRef} id="smn-holiday-edit-reason" className="form-control"
     value={reason} maxLength={500} disabled={busy} required
     onChange={event=>{setReason(event.target.value);setFailure("");}}/>
   </div>
   {edit.action==="delete"&&<label className="d-flex gap-2 align-items-start mb-3">
    <input type="checkbox" className="form-check-input mt-1"
     disabled={busy} checked={confirmDelete}
     onChange={event=>setConfirmDelete(event.target.checked)}/>
    <span>{t("countries.editDeleteConfirm")}</span>
   </label>}
   {failure&&<div role="alert" className="alert alert-danger">{failure}</div>}
   <div className="d-flex flex-wrap justify-content-end gap-2">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={onCancel}>{t("countries.cancel")}</button>
    <button type="submit" className={edit.action==="delete"?"btn btn-danger":"btn btn-primary"}
     disabled={busy||isDuplicate||pendingTarget||
      (edit.action==="delete"&&!confirmDelete)}>
     {busy?t("countries.loading"):
      edit.action==="delete"?t("countries.editConfirmRemove"):t("common.save")}
    </button>
   </div>
  </form>
 </section>;
}
