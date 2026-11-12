"use client";
import {useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
type UploadResponse={token:string;archiveId:string;state:string};
type ReadinessResponse={archiveId:string;restorationAuthorized:false;
 mayStartOfflineRestore:boolean;sourceEvidenceVerified:boolean;blockers:string[];
 destination:{initialized:boolean;schemaVersion:number;containsExistingTables:boolean}};
type VerifiedResponse={state:string;archiveId:string;createdAt:string|null;
 schemaVersion:number;postgresVersion:string;documents:number;components:number;
 sourceEvidenceVerified:boolean};
export default function MigrationImportAdmin(){
 const t=useTranslation();
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState(0);
 const [result,setResult]=useState<UploadResponse|null>(null);
 const [verified,setVerified]=useState<VerifiedResponse|null>(null);
 const [readiness,setReadiness]=useState<ReadinessResponse|null>(null);
 const [phrase,setPhrase]=useState("");
 const [message,setMessage]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [scheduled,setScheduled]=useState(false);
 const [restoreStage,setRestoreStage]=useState<string|null>(null);
 const request=useRef<XMLHttpRequest|null>(null);
 useEffect(()=>()=>{request.current?.abort();},[]);
 useEffect(()=>{
  if(!scheduled)return;
  const poll=async()=>{
   try{
    const response=await fetch("/api/admin/backups/migration/restore/status",{
     cache:"no-store"
    });
    if(response.status===403){window.location.assign("/login");return;}
    if(response.ok){
     const payload=await response.json() as {stage?:string};
     setRestoreStage(payload.stage??null);
    }
   }catch{/* Expected while the launcher stops and restarts the web server. */}
  };
  void poll();
  const timer=window.setInterval(()=>void poll(),2500);
  return()=>window.clearInterval(timer);
 },[scheduled]);
 const acceptFile=(next:File|null)=>{
  setResult(null);setVerified(null);setReadiness(null);setPhrase("");
  setConfirmed(false);setScheduled(false);setRestoreStage(null);
  setProgress(0);setMessage("");
  if(next&&(!next.name.toLowerCase().endsWith(".zip")||
   next.size<150||next.size>2*1024*1024*1024)){
   setFile(null);setMessage(t("backups.transfer.invalidFile"));return;
  }
  setFile(next);
 };
 const upload=()=>{
  if(!file||busy)return;
  setBusy(true);setMessage("");setProgress(0);
  const xhr=new XMLHttpRequest();request.current=xhr;
  xhr.open("POST","/api/admin/backups/migration/upload");
  xhr.setRequestHeader("Content-Type","application/zip");
  xhr.upload.onprogress=e=>{if(e.lengthComputable)setProgress(Math.round(100*e.loaded/e.total));};
  xhr.onload=()=>{
   setBusy(false);request.current=null;
   if(xhr.status!==201){setMessage(t("backups.transfer.uploadFailed"));return;}
   try{
    const response=JSON.parse(xhr.responseText) as UploadResponse;
    if(!response.token||!response.archiveId||response.state!=="received")
     throw Error("invalid");
    setResult(response);
    setProgress(100);
   }catch{setMessage(t("backups.transfer.uploadFailed"));}
  };
  xhr.onerror=()=>{setBusy(false);request.current=null;setMessage(t("backups.transfer.uploadFailed"));};
  xhr.onabort=()=>{setBusy(false);request.current=null;};
  xhr.send(file);
 };
 const beginRestore=async()=>{
  if(!result||!verified?.sourceEvidenceVerified||
   !readiness?.mayStartOfflineRestore||!confirmed||busy||scheduled)return;
  if(!window.confirm(t("backups.transfer.confirmDialog")))return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/backups/migration/restore",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token:result.token,
     confirm:"REPLACE_CURRENT_SMN_WITH_VERIFIED_BACKUP"})
   });
   if(response.status!==202)throw Error("migration-restore-not-queued");
   setScheduled(true);setRestoreStage("queued");
  }catch{setMessage(t("backups.transfer.restoreRejected"));}
  finally{setBusy(false);}
 };
 const verify=async()=>{
  if(!result||phrase.length<20||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/backups/migration/upload/verify",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token:result.token,phrase})
   });
   const payload=await response.json() as VerifiedResponse;
   if(!response.ok||payload.state!=="verified-no-activation")throw Error("invalid");
   setVerified(payload);
   const ready=await fetch("/api/admin/backups/migration/upload/readiness",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token:result.token})
   });
   if(ready.ok)setReadiness(await ready.json() as ReadinessResponse);
  }catch{setMessage(t("backups.transfer.verificationFailed"));}
  finally{setPhrase("");setBusy(false);}
 };
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="migration-import-title">
  <div>
   <h2 className="h5" id="migration-import-title">{t("backups.transfer.title")}</h2>
   <p className="small text-secondary mb-0">{t("backups.transfer.intro")}</p>
  </div>
  <div>
   <label className="form-label" htmlFor="smn-migration-zip">{t("backups.transfer.file")}</label>
   <input id="smn-migration-zip" className="form-control" type="file"
    accept=".zip,application/zip" disabled={busy}
    onChange={e=>acceptFile(e.target.files?.[0]??null)}/>
  </div>
  {file&&<p className="small text-secondary">{file.name} — {Math.round(file.size/1024)} Ko</p>}
  <button type="button" className="btn btn-primary align-self-start"
   disabled={!file||busy||!!result} onClick={upload}>
   {busy&&!result?t("backups.transfer.sending"):t("backups.transfer.upload")}
  </button>
  {busy&&!result&&<div className="progress" role="progressbar" aria-valuemin={0}
    aria-valuemax={100} aria-valuenow={progress}>
   <div className="progress-bar" style={{width:progress+"%"}}>{progress}%</div>
  </div>}
  {result&&!verified&&<>
   <p role="status" className="small">{t("backups.transfer.uploaded")} <code>{result.archiveId}</code></p>
   <label htmlFor="smn-migration-phrase" className="form-label">{t("backups.phraseLabel")}</label>
   <input id="smn-migration-phrase" className="form-control" type="password"
    minLength={20} maxLength={256} autoComplete="off" value={phrase}
    disabled={busy} onChange={e=>setPhrase(e.target.value)}/>
   <button className="btn btn-outline-primary align-self-start" type="button"
    disabled={busy||phrase.length<20} onClick={()=>void verify()}>
    {busy?t("backups.transfer.verifying"):t("backups.transfer.verify")}
   </button>
  </>}
  {verified&&<div role="status" className="alert alert-info">
   <p className="fw-semibold mb-2">{t("backups.transfer.verified")}</p>
   <p className="small mb-1">{t("backups.transfer.archive")}: {verified.archiveId}</p>
   <p className="small mb-1">{t("backups.schemaVersion")}: {verified.schemaVersion} — {t("backups.postgresVersion")}: {verified.postgresVersion}</p>
   <p className="small mb-0">{t("backups.transfer.notActivated")}</p>
   {readiness&&<div className="mt-2">
    <p className="fw-semibold mb-1">{t("backups.transfer.destinationTitle")}</p>
    <p className="small mb-1">{readiness.destination.containsExistingTables?
     t("backups.transfer.destinationExisting"):t("backups.transfer.destinationEmpty")}</p>
    <ul className="small mb-0">{readiness.blockers.map(code=><li key={code}>{t(("backups.transfer.blockers."+code) as import("@/i18n/catalog").TranslationKey)}</li>)}</ul>
   </div>}
   {readiness?.mayStartOfflineRestore&&verified.sourceEvidenceVerified&&!scheduled&&
    <div className="mt-3 border-top pt-3">
     <p className="fw-semibold">{t("backups.transfer.restoreTitle")}</p>
     <p>{t("backups.transfer.restoreImpact")}</p>
     <div className="form-check">
      <input className="form-check-input" type="checkbox"
       id="smn-migration-confirm" checked={confirmed}
       onChange={e=>setConfirmed(e.target.checked)}/>
      <label className="form-check-label" htmlFor="smn-migration-confirm">
       {t("backups.transfer.restoreConsent")}
      </label>
     </div>
     <button type="button" className="btn btn-danger mt-3"
      disabled={!confirmed||busy} onClick={()=>void beginRestore()}>
      {t("backups.transfer.restoreStart")}
     </button>
    </div>}
   {scheduled&&<div role="status" className="alert alert-warning mt-3">
    <p className="fw-semibold mb-1">{t("backups.transfer.restoreQueued")}</p>
    <p className="small mb-0">{t("backups.transfer.restoreProgress")}</p>
    {restoreStage&&<p className="small mb-0">{t("backups.transfer.stageLabel")}: {t(("backups.transfer.stages."+restoreStage) as import("@/i18n/catalog").TranslationKey)}</p>}
   </div>}
  </div>}
  {message&&<p role="alert" className="alert alert-warning">{message}</p>}
  <p className="small text-secondary mb-0">{t("backups.transfer.safety")}</p>
 </section>;
}
