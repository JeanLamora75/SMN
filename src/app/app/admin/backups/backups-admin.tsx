import type {TranslationKey} from "@/i18n/catalog";
"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Outcome={status:"running"|"success"|"failed"|"cancelled"|"interrupted"|"unverifiable";id?:string;createdAt:string};
type Component={path:string;kind:"database"|"document";size:number;
 encryptedSize:number;encryptedSha256:string};
type InventoryEntry={
 id:string;createdAt:string|null;status:"verified"|"invalid"|"incomplete"|"unverifiable";
 reason:string|null;checkedAt:string;installationSource:string|null;applicationVersion:string|null;
 schemaVersion:number|null;postgresVersion:string|null;components:Component[];
 documentCount:number;integrityVerified:boolean;restoreTested:false;
};
type RestorePreview={
 id:string;checkedAt:string;archive:InventoryEntry;
 current:{installationSource:string;schemaVersion:number;postgresVersion:string;
  applicationVersion:string;documentCount:number|null};
 issues:string[];blocked:boolean;canRestore:false;
};
type RestoreGate={decision:"blocked";archiveId:string;checkedAt:string;
 blockers:string[];warnings:string[];approval:string;canExecute:false};
type Retention={days:number;revision:number;updatedAt:string;eligibleIds:string[]};
type State={needsRecoveryPhrase:boolean;last:Outcome|null;inventory:InventoryEntry[];retention:Retention};

export default function BackupsAdmin(){
 const t=useTranslation();
 const [state,setState]=useState<State|null>(null);
 const [phrase,setPhrase]=useState("");
 const [preview,setPreview]=useState<RestorePreview|null>(null);
 const [previewBusy,setPreviewBusy]=useState<string|null>(null);
 const [previewError,setPreviewError]=useState("");
 const [restoreGate,setRestoreGate]=useState<RestoreGate|null>(null);
 const [gateBusy,setGateBusy]=useState(false);
 const [busy,setBusy]=useState(false);
 const [checking,setChecking]=useState(false);
 const [retentionDays,setRetentionDays]=useState("30");
 const [savingRetention,setSavingRetention]=useState(false);
 const [cleaning,setCleaning]=useState(false);
 const [retentionNotice,setRetentionNotice]=useState("");
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/backups",{cache:"no-store"});
  if(!r.ok)throw new Error("unavailable");
  const result=await r.json() as State;
  if(!Array.isArray(result.inventory))throw new Error("inventory-unavailable");
  setState(result);
  setRetentionDays(String(result.retention.days));
 },[]);
 useEffect(()=>{
  let active=true;
  fetch("/api/admin/backups",{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw new Error("unavailable");
   return r.json() as Promise<State>;
  }).then(v=>{
   if(active&&Array.isArray(v.inventory)&&v.retention){
    setState(v);
    setRetentionDays(String(v.retention.days));
   }
   else if(active)setError(t("backups.unavailable"));
  }).catch(()=>{if(active)setError(t("backups.unavailable"));});
  return ()=>{active=false;};
 },[t]);
 async function previewRestore(id:string){
  if(previewBusy||busy||checking||cleaning||savingRetention)return;
  setPreviewBusy(id);setPreview(null);setRestoreGate(null);setPreviewError("");
  try{
   const response=await fetch("/api/admin/backups/preview?id="+encodeURIComponent(id),{cache:"no-store"});
   if(!response.ok)throw new Error("preview-unavailable");
   const data=await response.json() as RestorePreview;
   if(data.id!==id||!Array.isArray(data.issues))throw new Error("preview-invalid");
   setPreview(data);
  }catch{setPreviewError(t("backups.previewFailed"));}
  finally{setPreviewBusy(null);}
 }
 async function runRestorePreflight(id:string){
  if(gateBusy||busy||checking||cleaning||savingRetention)return;
  setGateBusy(true);setRestoreGate(null);setPreviewError("");
  try{
   const response=await fetch("/api/admin/backups/restore/preflight",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id}),
    cache:"no-store"
   });
   if(response.status!==409)throw new Error("unexpected-preflight-state");
   const data=await response.json() as {gate:RestoreGate};
   if(data.gate?.archiveId!==id||data.gate.canExecute!==false||
    !Array.isArray(data.gate.blockers))throw new Error("invalid-preflight");
   setRestoreGate(data.gate);
  }catch{setPreviewError(t("backups.restorePreflightFailed"));}
  finally{setGateBusy(false);}
 }
 async function recheck(){
  if(busy||checking)return;
  setChecking(true);setError("");setPreview(null);setRestoreGate(null);
  try{await refresh();}
  catch{setError(t("backups.unavailable"));}
  finally{setChecking(false);}
 }
 async function saveRetention(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!state||savingRetention||cleaning||busy||checking)return;
  const days=Number(retentionDays);
  if(!/^[0-9]+$/.test(retentionDays)||!Number.isSafeInteger(days)||days<1||days>3650){
   setError(t("backups.retentionInvalid"));return;
  }
  setSavingRetention(true);setError("");setRetentionNotice("");
  try{
   const response=await fetch("/api/admin/backups/retention",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({days,revision:state.retention.revision})
   });
   if(!response.ok)throw new Error(response.status===409?"conflict":"save-failed");
   await refresh();
   setRetentionNotice(t("backups.retentionSaved"));
  }catch(e){
   setError(e instanceof Error&&e.message==="conflict"?
    t("backups.retentionConflict"):t("backups.retentionFailed"));
  }finally{setSavingRetention(false);}
 }
 async function cleanupRetention(){
  if(!state||savingRetention||cleaning||busy||checking||state.retention.eligibleIds.length===0)return;
  if(retentionDays!==String(state.retention.days)){
   setError(t("backups.retentionUnsaved"));return;
  }
  const eligible=state.retention.eligibleIds;
  if(!window.confirm(t("backups.cleanupConfirm",{count:eligible.length})))return;
  setCleaning(true);setError("");setRetentionNotice("");
  try{
   const response=await fetch("/api/admin/backups/retention",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirm:true,revision:state.retention.revision,ids:eligible})
   });
   if(!response.ok)throw new Error(response.status===409?"conflict":"cleanup-failed");
   const payload=await response.json() as {deleted:string[]};
   await refresh();
   setRetentionNotice(t("backups.cleanupSuccess",{count:payload.deleted.length}));
  }catch(e){
   setError(e instanceof Error&&e.message==="conflict"?
    t("backups.retentionConflict"):t("backups.cleanupFailed"));
  }finally{setCleaning(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||checking||savingRetention||cleaning)return;
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
    {t("backups.lastResult")}: {t(state.last.status==="success"?"backups.successStatus":
      state.last.status==="running"?"backups.running":
      state.last.status==="cancelled"?"protectionOperations.statuses.cancelled":
      state.last.status==="interrupted"?"protectionOperations.statuses.interrupted":
      state.last.status==="unverifiable"?"backups.unverifiable":"backups.failedStatus")}
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
    <button className="btn btn-primary" disabled={busy||checking||savingRetention||cleaning||!state} type="submit">
     {busy?t("backups.running"):t("backups.start")}
    </button>
   </form>
   {error&&<p role="alert" id="backups-error" className="alert alert-warning">{error}</p>}
   {success&&<p role="status" className="alert alert-success">{success}</p>}
   <p className="small text-secondary mb-0">{t("backups.notRestored")}</p>
  </section>
  <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="backup-retention-title">
   <div>
    <h2 className="h5" id="backup-retention-title">{t("backups.retentionTitle")}</h2>
    <p className="small text-secondary mb-0">{t("backups.retentionScope")}</p>
   </div>
   <form className="d-flex gap-2 flex-wrap align-items-end" onSubmit={saveRetention}>
    <div>
     <label htmlFor="backup-retention-days" className="form-label">{t("backups.retentionDays")}</label>
     <input id="backup-retention-days" type="number" min={1} max={3650} step={1}
      value={retentionDays} onChange={e=>setRetentionDays(e.target.value)}
      className="form-control" required disabled={!state||busy||cleaning||savingRetention||checking}/>
    </div>
    <button type="submit" className="btn btn-outline-primary"
     disabled={!state||busy||savingRetention||cleaning||checking}>
     {savingRetention?t("backups.retentionSaving"):t("backups.retentionSave")}
    </button>
   </form>
   {state&&<p className="small text-secondary mb-0">
    {t("backups.retentionRevision",{revision:state.retention.revision})}
   </p>}
   <div>
    <p>{t("backups.cleanupPreview",{count:state?.retention.eligibleIds.length??0})}</p>
    <button type="button" className="btn btn-outline-danger" onClick={cleanupRetention}
     disabled={!state||!state.retention.eligibleIds.length||cleaning||busy||checking||savingRetention||
      retentionDays!==String(state.retention.days)}>
     {cleaning?t("backups.cleanupRunning"):t("backups.cleanupStart")}
    </button>
   </div>
   <p className="small text-secondary mb-0">{t("backups.externalDisclaimer")}</p>
   {retentionNotice&&<p role="status" className="alert alert-success">{retentionNotice}</p>}
  </section>
  <section className="smn-panel p-4" aria-labelledby="backup-inventory-title">
   <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
    <div>
     <h2 id="backup-inventory-title" className="h5">{t("backups.inventoryTitle")}</h2>
     <p className="small text-secondary mb-0">{t("backups.inventoryIntro")}</p>
    </div>
    <button type="button" className="btn btn-outline-primary" onClick={recheck}
     disabled={checking||busy||savingRetention||cleaning||!state}>{checking?t("backups.verifyRunning"):t("backups.verifyNow")}</button>
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
     <div className="mt-3">
      <button type="button" className="btn btn-outline-primary btn-sm"
       disabled={!!previewBusy||busy||checking||cleaning||savingRetention}
       onClick={()=>previewRestore(item.id)}>
       {previewBusy===item.id?t("backups.previewRunning"):t("backups.previewStart")}
      </button>
     </div>
     {preview?.id===item.id&&<section className="border rounded p-3 mt-3" aria-label={t("backups.previewTitle")}>
      <h4 className="h6">{t("backups.previewTitle")}</h4>
      <p className="small">{t("backups.previewNoWrite")}</p>
      <dl className="row small">
       <dt className="col-sm-5">{t("backups.created")}</dt>
       <dd className="col-sm-7">{preview.archive.createdAt?new Date(preview.archive.createdAt).toLocaleString():"—"}</dd>
       <dt className="col-sm-5">{t("backups.origin")}</dt>
       <dd className="col-sm-7 text-break">{preview.archive.installationSource??"—"}</dd>
       <dt className="col-sm-5">{t("backups.applicationVersion")}</dt>
       <dd className="col-sm-7">{preview.archive.applicationVersion??"—"}</dd>
       <dt className="col-sm-5">{t("backups.schemaVersion")}</dt>
       <dd className="col-sm-7">{preview.archive.schemaVersion??"—"}</dd>
       <dt className="col-sm-5">{t("backups.previewCurrentSchema")}</dt>
       <dd className="col-sm-7">{preview.current.schemaVersion}</dd>
       <dt className="col-sm-5">{t("backups.previewCurrentOrigin")}</dt>
       <dd className="col-sm-7 text-break">{preview.current.installationSource}</dd>
       <dt className="col-sm-5">{t("backups.previewFiles")}</dt>
       <dd className="col-sm-7">{t("backups.previewFileImpact",{before:preview.current.documentCount===null?"?":preview.current.documentCount,
        after:preview.archive.documentCount})}</dd>
      </dl>
      <p className="small">{t("backups.previewOverwrite")}</p>
      <p className="small">{t("backups.previewComponents",{count:preview.archive.components.length})}</p>
      {preview.issues.length>0&&<div role="alert" className="alert alert-warning">
       <strong>{t("backups.previewRisks")}</strong>
       <ul className="mb-0">{preview.issues.map(issue=><li key={issue}>
        {t(("backups.previewIssues."+issue) as TranslationKey)}
       </li>)}</ul>
      </div>}
      <p className="small fw-semibold">{t("backups.previewNotRestorable")}</p>
      <button type="button" className="btn btn-outline-primary btn-sm mb-2" disabled={gateBusy}
       onClick={()=>runRestorePreflight(item.id)}>
       {gateBusy?t("backups.restorePreflightRunning"):t("backups.restorePreflightStart")}
      </button>
      {restoreGate?.archiveId===item.id&&<div role="status" className="alert alert-warning">
       <strong>{t("backups.restorePreflightBlocked")}</strong>
       <ul className="mt-2 mb-0">{restoreGate.blockers.map(blocker=><li key={blocker}>
        {t(("backups.restoreGate."+blocker) as TranslationKey)}
       </li>)}</ul>
      </div>}
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{setPreview(null);setRestoreGate(null);}}>
       {t("backups.previewClose")}
      </button>
     </section>}
     {previewError&&<p role="alert" className="alert alert-warning mt-2">{previewError}</p>}
     <p className="small text-secondary mt-2 mb-0">
      {t("backups.checkedAt")}: <time dateTime={item.checkedAt}>{new Date(item.checkedAt).toLocaleString()}</time>
      {" · "}{t("backups.integrityOnly")}
     </p>
    </article>)}
   </div>
  </section>
 </div>;
}
