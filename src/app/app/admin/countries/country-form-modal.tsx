"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import CountryFlag from "./country-flag";

type CountryName={code:string;name:string;revision:number};
type Props={
 mode:"create"|"rename";
 country?:CountryName;
 onClose:()=>void;
 onSaved:(value:{mode:"create"|"rename";code:string})=>Promise<void>;
};

export default function CountryFormModal({mode,country,onClose,onSaved}:Props){
 const t=useTranslation();
 const [code,setCode]=useState(country?.code??"");
 const [name,setName]=useState(country?.name??"");
 const [busy,setBusy]=useState(false);
 const [fieldError,setFieldError]=useState<"code"|"name"|null>(null);
 const [error,setError]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 const firstField=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  if(element&&!element.open)element.showModal();
  firstField.current?.focus();
  return ()=>{if(element?.open)element.close();};
 },[]);

 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy)return;
  const normalizedCode=code.trim().toUpperCase();
  const normalizedName=name.trim().replace(/\s+/gu," ");
  setFieldError(null);setError("");
  if(mode==="create"&&!/^[A-Z]{2}$/.test(normalizedCode)){
   setFieldError("code");setError(t("countries.invalidIso"));return;
  }
  if(!normalizedName||normalizedName.length>120||/[\u0000-\u001f\u007f]/u.test(name)){
   setFieldError("name");setError(t("countries.invalidName"));return;
  }
  setBusy(true);
  try{
   const response=await fetch(mode==="create"?"/api/admin/countries":
    "/api/admin/countries/"+encodeURIComponent(country!.code),{
    method:mode==="create"?"POST":"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(mode==="create"?{code:normalizedCode,name:normalizedName}:
     {name:normalizedName,revision:country!.revision})
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({error:"failed"})) as {error?:string};
    const problem=data.error??"failed";
    if(problem==="duplicate-code"){
     setFieldError("code");setError(t("countries.duplicate"));
    }else if(problem==="conflict"){
     setFieldError("name");setError(t("countries.renameConflict"));
    }else if(problem==="not-found"){
     setFieldError("name");setError(t("countries.countryMissing"));
    }else if(problem==="invalid-input"){
     setFieldError(mode==="create"?"code":"name");
     setError(t(mode==="create"?"countries.invalidIso":"countries.invalidName"));
    }else if(response.status===403){
     setError(t("countries.forbidden"));
    }else{
     setError(t("countries.failed"));
    }
    return;
   }
   await onSaved({mode,code:normalizedCode});
  }catch{
   setError(t("countries.failed"));
  }finally{setBusy(false);}
 };
 return <dialog ref={dialog} onCancel={event=>{if(busy)event.preventDefault();}}
  onClose={onClose}
  className="bg-body text-body border-0 shadow-lg rounded-3 p-0 w-100"
  aria-labelledby="country-edit-title" style={{maxWidth:"520px"}}>
  <form onSubmit={event=>{void submit(event);}} className="p-4">
   <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
    <h2 id="country-edit-title" className="h5 mb-0">
     {mode==="create"?t("countries.addTitle"):t("countries.renameTitle")}
    </h2>
    <button type="button" className="btn-close" aria-label={t("countries.close")}
     disabled={busy} onClick={onClose}/>
   </div>
   <div className="mb-3">
    <label htmlFor="country-edit-code" className="form-label">{t("countries.code")}</label>
    {mode==="rename"?
     <input id="country-edit-code" className="form-control" value={country!.code}
      readOnly aria-readonly="true" tabIndex={-1}/>:
     <input ref={firstField} id="country-edit-code" className="form-control"
      maxLength={2} autoComplete="off" required value={code}
      aria-invalid={fieldError==="code"} aria-describedby={fieldError==="code"?"country-edit-error":undefined}
      disabled={busy} onChange={event=>{
       setCode(event.target.value.toUpperCase().replace(/\s/gu,""));
       setFieldError(null);setError("");
      }}/>}
   </div>
   <div className="mb-3">
    <label htmlFor="country-edit-name" className="form-label">{t("countries.name")}</label>
    <input ref={mode==="rename"?firstField:undefined}
     id="country-edit-name" className="form-control" maxLength={120} required
     value={name} disabled={busy} autoComplete="off"
     aria-invalid={fieldError==="name"}
     aria-describedby={fieldError==="name"?"country-edit-error":undefined}
     onChange={event=>{setName(event.target.value);setFieldError(null);setError("");}}/>
   </div>
   <div className="d-flex align-items-center gap-2 p-2 bg-body-tertiary rounded-2 mb-3">
    <CountryFlag key={code.trim().toUpperCase()} code={code.trim().toUpperCase()}
     name={name||code}/>
    <span className="small">{t("countries.flagPreview")}</span>
   </div>
   {mode==="rename"&&<p className="small text-muted">{t("countries.isoImmutable")}</p>}
   {error&&<p id="country-edit-error" className="text-danger small" role="alert">{error}</p>}
   <div className="d-flex justify-content-end gap-2 mt-4">
    <button type="button" className="btn btn-outline-secondary"
     disabled={busy} onClick={onClose}>{t("countries.cancel")}</button>
    <button type="submit" className="btn btn-primary" disabled={busy}>
     {busy?t("countries.loading"):t("common.save")}
    </button>
   </div>
  </form>
 </dialog>;
}
