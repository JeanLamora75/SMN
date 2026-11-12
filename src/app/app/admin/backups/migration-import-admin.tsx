"use client";
import {useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
type UploadResponse={token:string;archiveId:string;state:string};
type ReadinessResponse={archiveId:string;restorationAuthorized:false;blockers:string[];destination:{initialized:boolean;schemaVersion:number;containsExistingTables:boolean}};
type VerifiedResponse={state:string;archiveId:string;createdAt:string|null;
 schemaVersion:number;postgresVersion:string;documents:number;components:number};
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
 const request=useRef<XMLHttpRequest|null>(null);
 useEffect(()=>()=>{request.current?.abort();},[]);
 const acceptFile=(next:File|null)=>{
  setResult(null);setVerified(null);setReadiness(null);setPhrase("");setProgress(0);setMessage("");
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
  </div>}
  {message&&<p role="alert" className="alert alert-warning">{message}</p>}
  <p className="small text-secondary mb-0">{t("backups.transfer.safety")}</p>
 </section>;
}
