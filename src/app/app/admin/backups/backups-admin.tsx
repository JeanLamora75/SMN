"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Outcome={status:"success"|"failed";id?:string;createdAt:string};
type State={needsRecoveryPhrase:boolean;last:Outcome|null};
export default function BackupsAdmin(){
 const t=useTranslation();
 const [state,setState]=useState<State|null>(null);
 const [phrase,setPhrase]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;
  fetch("/api/admin/backups",{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw new Error("unavailable");
   return r.json() as Promise<State>;
  }).then(v=>{if(active)setState(v);}).catch(()=>{
   if(active)setError(t("backups.unavailable"));
  });
  return ()=>{active=false;};
 },[t]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/backups",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(state?.needsRecoveryPhrase?{recoveryPhrase:phrase}:{})});
   const payload=await response.json() as {status?:string;id?:string;createdAt?:string};
   if(!response.ok||payload.status!=="success"||!payload.id||!payload.createdAt)
    throw new Error("not-confirmed");
   setSuccess(t("backups.success"));
   setState({needsRecoveryPhrase:false,last:{status:"success",id:payload.id,createdAt:payload.createdAt}});
  }catch{
   setError(t("backups.failed"));
   setState(v=>v?{...v,last:{status:"failed",createdAt:new Date().toISOString()}}:v);
  }finally{setPhrase("");setBusy(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3" aria-label={t("backups.title")}>
  <p className="small text-secondary">{t("backups.encryptionInfo")}</p>
  {state?.needsRecoveryPhrase&&<p className="alert alert-warning">{t("backups.phraseWarning")}</p>}
  {state?.last&&<p role="status" className="small">
   {t("backups.lastResult")}: {t(state.last.status==="success"?"backups.successStatus":"backups.failedStatus")}
   {" · "}{new Date(state.last.createdAt).toLocaleString()}
   {state.last.id&&<> · {t("backups.identifier")}: <code>{state.last.id}</code></>}
  </p>}
  <form className="d-grid gap-3" onSubmit={submit} aria-describedby={error?"backups-error":undefined}>
   {state?.needsRecoveryPhrase&&<div>
    <label className="form-label" htmlFor="backup-recovery-phrase">{t("backups.phraseLabel")}</label>
    <input id="backup-recovery-phrase" className="form-control" type="password" autoComplete="new-password"
     required minLength={20} maxLength={256} disabled={busy} value={phrase}
     onChange={e=>setPhrase(e.target.value)} aria-describedby="backup-phrase-help"/>
    <p id="backup-phrase-help" className="small text-secondary mt-1">{t("backups.phraseHelp")}</p>
   </div>}
   <button className="btn btn-primary" disabled={busy||!state} type="submit">
    {busy?t("backups.running"):t("backups.start")}
   </button>
  </form>
  {error&&<p role="alert" id="backups-error" className="alert alert-warning">{error}</p>}
  {success&&<p role="status" className="alert alert-success">{success}</p>}
  <p className="small text-secondary mb-0">{t("backups.notRestored")}</p>
 </section>;
}
