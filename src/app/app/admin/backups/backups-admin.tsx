"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Outcome={status:"success"|"failed";id?:string;createdAt:string};
type Component={path:string;kind:"database"|"document";size:number;
 encryptedSize:number;encryptedSha256:string};
type InventoryEntry={
 id:string;createdAt:string|null;status:"verified"|"invalid"|"incomplete"|"unverifiable";
 reason:string|null;checkedAt:string;installationSource:string|null;applicationVersion:string|null;
 schemaVersion:number|null;postgresVersion:string|null;components:Component[];
 documentCount:number;integrityVerified:boolean;restoreTested:false;
};
type State={needsRecoveryPhrase:boolean;last:Outcome|null;inventory:InventoryEntry[]};

export default function BackupsAdmin(){
 const t=useTranslation();
 const [state,setState]=useState<State|null>(null);
 const [phrase,setPhrase]=useState("");
 const [busy,setBusy]=useState(false);
 const [checking,setChecking]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/backups",{cache:"no-store"});
  if(!r.ok)throw new Error("unavailable");
  const result=await r.json() as State;
  if(!Array.isArray(result.inventory))throw new Error("inventory-unavailable");
  setState(result);
 },[]);
 useEffect(()=>{
  let active=true;
  fetch("/api/admin/backups",{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw new Error("unavailable");
   return r.json() as Promise<State>;
  }).then(v=>{
   if(active&&Array.isArray(v.inventory))setState(v);
   else if(active)setError(t("backups.unavailable"));
  }).catch(()=>{if(active)setError(t("backups.unavailable"));});
  return ()=>{active=false;};
 },[t]);
 async function recheck(){
  if(busy||checking)return;
  setChecking(true);setError("");
  try{await refresh();}
  catch{setError(t("backups.unavailable"));}
  finally{setChecking(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||checking)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/backups",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(state?.needsRecoveryPhrase?{recoveryPhrase:phrase}:{})});
   const payload=await response.json() as {status?:string;id?:string;createdAt?:string};
   if(!response.ok||payload.status!=="success"||!payload.id||!payload.createdAt)
    throw new Error("not-confirmed");
   setSuccess(t("backups.success"));
   setState(v=>v?{...v,needsRecoveryPhrase:false,
    last:{status:"success",id:payload.id!,createdAt:payload.createdAt!}}:v);
   try{await refresh();}
   catch{setError(t("backups.unavailable"));}
  }catch{
   setError(t("backups.failed"));
   setState(v=>v?{...v,last:{status:"failed",createdAt:new Date().toISOString()}}:v);
  }finally{setPhrase("");setBusy(false);}
 }
 return <div className="d-grid gap-4">
  <section className="smn-panel p-4 d-grid gap-3" aria-label={t("backups.title")}>
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
    <button className="btn btn-primary" disabled={busy||checking||!state} type="submit">
     {busy?t("backups.running"):t("backups.start")}
    </button>
   </form>
   {error&&<p role="alert" id="backups-error" className="alert alert-warning">{error}</p>}
   {success&&<p role="status" className="alert alert-success">{success}</p>}
   <p className="small text-secondary mb-0">{t("backups.notRestored")}</p>
  </section>
  <section className="smn-panel p-4" aria-labelledby="backup-inventory-title">
   <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
    <div>
     <h2 id="backup-inventory-title" className="h5">{t("backups.inventoryTitle")}</h2>
     <p className="small text-secondary mb-0">{t("backups.inventoryIntro")}</p>
    </div>
    <button type="button" className="btn btn-outline-primary" onClick={recheck}
     disabled={checking||busy||!state}>{checking?t("backups.verifyRunning"):t("backups.verifyNow")}</button>
   </div>
   {state&&state.inventory.length===0&&<p role="status">{t("backups.noBackups")}</p>}
   <div className="d-grid gap-3">
    {state?.inventory.map(item=><article key={item.id} className="border rounded p-3">
     <div className="d-flex justify-content-between flex-wrap gap-2">
      <div>
       <h3 className="h6 mb-1">{t("backups.identifier")}: <code>{item.id}</code></h3>
       <p className="small text-secondary mb-1">{t("backups.created")}: {item.createdAt?
        <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>:"—"}</p>
      </div>
      <span className={"badge align-self-start "+(item.status==="verified"?
       "text-bg-success":item.status==="unverifiable"?"text-bg-secondary":"text-bg-warning")}>
       {t(item.status==="verified"?"backups.verified":
          item.status==="invalid"?"backups.invalid":
          item.status==="incomplete"?"backups.incomplete":"backups.unverifiable")}
      </span>
     </div>
     {item.status==="verified"?<>
      <dl className="row small my-2">
       <dt className="col-sm-5">{t("backups.origin")}</dt>
       <dd className="col-sm-7 text-break">{item.installationSource}</dd>
       <dt className="col-sm-5">{t("backups.applicationVersion")}</dt>
       <dd className="col-sm-7">{item.applicationVersion??t("backups.legacyVersion")}</dd>
       <dt className="col-sm-5">{t("backups.schemaVersion")}</dt>
       <dd className="col-sm-7">{item.schemaVersion}</dd>
       <dt className="col-sm-5">{t("backups.postgresVersion")}</dt>
       <dd className="col-sm-7">{item.postgresVersion}</dd>
       <dt className="col-sm-5">{t("backups.scope")}</dt>
       <dd className="col-sm-7">{t("backups.scopeText",{count:item.documentCount})}</dd>
      </dl>
      <details>
       <summary>{t("backups.componentDetails")}</summary>
       <div className="table-responsive mt-2">
        <table className="table table-sm small">
         <thead><tr>
          <th scope="col">{t("backups.component")}</th>
          <th scope="col">{t("backups.bytes")}</th>
          <th scope="col">{t("backups.encryptedHash")}</th>
         </tr></thead>
         <tbody>{item.components.map(component=><tr key={component.path}>
          <td className="text-break">{component.path}</td>
          <td>{component.size.toLocaleString()} / {component.encryptedSize.toLocaleString()}</td>
          <td className="text-break"><code>{component.encryptedSha256}</code></td>
         </tr>)}</tbody>
        </table>
       </div>
      </details>
     </>:<p role="alert" className="small my-2">
      {t("backups.notVerified")}{item.reason&&<> ({t("backups.reason")}: <code>{item.reason}</code>)</>}
     </p>}
     <p className="small text-secondary mt-2 mb-0">
      {t("backups.checkedAt")}: <time dateTime={item.checkedAt}>{new Date(item.checkedAt).toLocaleString()}</time>
      {" · "}{t("backups.integrityOnly")}
     </p>
    </article>)}
   </div>
  </section>
 </div>;
}
