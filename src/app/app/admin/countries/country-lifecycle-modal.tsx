"use client";
import {useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import CountryFlag from "./country-flag";
import {lifecycleActionForCountry,lifecycleBlocked} from "@/lib/countries/lifecycle-ux";

type Country={code:string;name:string;revision:number;archived:boolean};
type Impact={country:{code:string;name:string;revision:number;archived:boolean};
 referenceCountry:boolean;activeMemberCount:number;
 linkedMembers:{id:string;name:string}[];membersTruncated:boolean;
 canArchive:boolean;canReactivate:boolean};
export default function CountryLifecycleModal({country,onClose,onSaved}:{
 country:Country;onClose:()=>void;onSaved:(action:"archive"|"reactivate")=>Promise<void>;
}){
 const t=useTranslation();
 const [impact,setImpact]=useState<Impact|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const load=async(signal?:AbortSignal)=>{
  setLoading(true);setError("");setConfirmed(false);
  try{
   const response=await fetch("/api/admin/countries/"+
    encodeURIComponent(country.code)+"/lifecycle",{cache:"no-store",signal});
   if(!response.ok)throw Error("read-failed");
   const result=await response.json() as {impact:Impact};
   if(result.impact.country.code!==country.code)throw Error("wrong-country");
   if(!signal?.aborted)setImpact(result.impact);
  }catch{
   if(!signal?.aborted){setImpact(null);setError(t("countries.lifecycleLoadFailed"));}
  }finally{if(!signal?.aborted)setLoading(false);}
 };
 useEffect(()=>{
  const el=dialog.current;
  if(el&&!el.open)el.showModal();
  heading.current?.focus();
  const controller=new AbortController();
  void load(controller.signal);
  return ()=>{controller.abort();if(el?.open)el.close();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const action=lifecycleActionForCountry(country.archived);
 const possible=impact?!lifecycleBlocked(impact):false;
 const changed=!!impact&&(impact.country.revision!==country.revision||
  impact.country.archived!==country.archived);
 const submit=async()=>{
  if(busy||loading||!confirmed||!possible||changed||!impact)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/countries/"+encodeURIComponent(country.code)+"/lifecycle",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,revision:impact.country.revision,confirmed:true})
   });
   if(!response.ok){
    const result=await response.json().catch(()=>({error:"unknown"})) as {error?:string};
    const reason=result.error==="active-members"?"countries.lifecycleMembersBlock":
     result.error==="reference-country"?"countries.lifecycleReferenceBlock":
     result.error==="conflict"?"countries.lifecycleConflict":
     result.error==="forbidden"?"countries.forbidden":"countries.failed";
    await load();
    setError(t(reason));
    return;
   }
   await onSaved(action); // Never retry a successful POST when the catalog refresh fails.
  }catch{
   setError(t("countries.lifecycleSavedRefreshFailed"));
  }finally{setBusy(false);}
 };
 return <dialog ref={dialog} className="bg-body text-body border-0 shadow-lg rounded-3 p-0 w-100"
  style={{maxWidth:"640px"}} aria-labelledby="smn-country-lifecycle-heading"
  onCancel={e=>{if(busy)e.preventDefault();}} onClose={onClose}>
  <section className="p-4">
   <div className="d-flex justify-content-between gap-3">
    <h2 ref={heading} tabIndex={-1} id="smn-country-lifecycle-heading" className="h5">
     {t(country.archived?"countries.lifecycleReactivateTitle":"countries.lifecycleArchiveTitle")}
    </h2>
    <button className="btn-close" type="button" disabled={busy}
     aria-label={t("countries.close")} onClick={()=>dialog.current?.close()}/>
   </div>
   <p className="d-flex gap-2 align-items-center">
    <CountryFlag code={country.code} name={country.name}/>
    <strong>{country.name} ({country.code})</strong>
   </p>
   {loading&&<p role="status">{t("countries.loading")}</p>}
   {impact&&!loading&&<>
    <p className="small">{t("countries.lifecycleRetained")}</p>
    {changed&&<p className="alert alert-warning" role="alert">
     {t("countries.lifecycleConflict")}
    </p>}
    {!country.archived&&impact.referenceCountry&&<p className="alert alert-warning" role="alert">
     {t("countries.lifecycleReferenceBlock")}
     <span className="d-block small mt-2">{t("countries.lifecycleReferenceHelp")}</span>
    </p>}
    {!country.archived&&impact.activeMemberCount>0&&<div className="alert alert-warning" role="alert">
     <p>{t("countries.lifecycleMembersCount",{count:impact.activeMemberCount})}</p>
     <ul className="mb-1">{impact.linkedMembers.map(m=><li key={m.id}>
      <a href={"/app/admin/members/"+encodeURIComponent(m.id)}>{m.name}</a>
     </li>)}</ul>
     {impact.membersTruncated&&<p className="small mb-0">{t("countries.lifecycleMembersTruncated")}</p>}
     <p className="small mb-0 mt-2">{t("countries.lifecycleMemberHelp")}</p>
    </div>}
    {!country.archived&&!possible&&<div className="d-flex flex-wrap gap-2 mb-3">
     <button type="button" className="btn btn-outline-primary btn-sm"
      disabled={busy} onClick={()=>void load()}>
      {t("countries.lifecycleRecheck")}
     </button>
    </div>}
    {!possible&&<p id="smn-lifecycle-blocked-description" className="small text-muted">
     {t("countries.lifecycleResolveFirst")}
    </p>}
    <label className="d-flex align-items-start gap-2">
     <input type="checkbox" className="form-check-input mt-1" checked={confirmed}
      aria-describedby={!possible?"smn-lifecycle-blocked-description":undefined}
      disabled={busy||!possible||changed} onChange={e=>setConfirmed(e.target.checked)}/>
     <span>{t(country.archived?"countries.lifecycleReactivateConfirm":
      "countries.lifecycleArchiveConfirm")}</span>
    </label>
   </>}
   {error&&<div className="alert alert-danger mt-3" role="alert">
    {error}
    <button type="button" className="btn btn-link btn-sm" disabled={loading||busy}
     onClick={()=>void load()}>
     {t("common.retry")}
    </button>
   </div>}
   <div className="d-flex justify-content-end gap-2 mt-4">
    <button className="btn btn-outline-secondary" type="button" disabled={busy}
     onClick={()=>dialog.current?.close()}>{t("countries.cancel")}</button>
    <button type="button" className={country.archived?"btn btn-primary":"btn btn-warning"}
     disabled={busy||loading||!possible||!confirmed||changed} onClick={()=>void submit()}>
     {t(country.archived?"countries.lifecycleReactivateAction":"countries.lifecycleArchiveAction")}
    </button>
   </div>
  </section>
 </dialog>;
}
