"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Preview={
 id:string;nonce:string;fromVersion:string;toVersion:string;mode:"delta"|"full";
 files:number;changes:number;deletions:number;bytes:number;sourceCommit:string;checkedAt:string;
 affected:{path:string;action:"put"|"delete"}[];
};
type Overview={version:string;ready:boolean;launcher:boolean;
 status?:{state:string;version?:string;at?:string}|null};
export default function UpdatesAdmin(){
 const t=useTranslation();
 const [overview,setOverview]=useState<Overview|null>(null);
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const [queued,setQueued]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  const res=await fetch("/api/admin/updates",{cache:"no-store"});
  if(!res.ok)throw Error("update-status-unavailable");
  setOverview(await res.json() as Overview);
 },[]);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/updates",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("update-status-unavailable");
    return response.json() as Promise<Overview>;
   })
   .then(data=>{if(active)setOverview(data);})
   .catch(()=>{if(active)setError(t("offlineUpdates.loadError"));});
  return ()=>{active=false;};
 },[t]);
 async function check(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!file||busy||queued||!overview?.ready)return;
  setBusy(true);setError("");setPreview(null);
  try{
   if(file.size>120*1024*1024||file.size<100)throw Error("update-archive-size");
   const form=new FormData();form.set("file",file);
   const res=await fetch("/api/admin/updates",{method:"POST",body:form,cache:"no-store"});
   if(!res.ok)throw Error("update-not-verified");
   const json=await res.json() as {preview:Preview};
   if(!json.preview?.id||!json.preview.nonce)throw Error("update-invalid-preview");
   setPreview(json.preview);
  }catch{setError(t("offlineUpdates.error"));}
  finally{setBusy(false);}
 }
 async function approve(){
  if(!preview||!overview?.launcher||!overview.ready||busy||queued)return;
  if(!window.confirm(t("offlineUpdates.confirmPrompt")))return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/admin/updates/confirm",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:preview.id,nonce:preview.nonce,confirm:true})
   });
   if(!res.ok){
    const failure=await res.json().catch(()=>({})) as {error?:string};
    if(failure.error==="update-schema-incompatible"){
     setError(t("offlineUpdates.schemaIncompatible"));return;
    }
    if(failure.error==="update-verified-backup-required"){
     setError(t("offlineUpdates.backupRequired"));return;
    }
    throw Error("update-confirm-failed");
   }
   setQueued(true);
  }catch{setError(t("offlineUpdates.error"));}
  finally{setBusy(false);}
 }
 const status=overview?.status;
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="offline-updates-title">
  <div>
   <h2 className="h5" id="offline-updates-title">{t("offlineUpdates.title")}</h2>
   <p className="text-secondary mb-0">{t("offlineUpdates.intro")}</p>
  </div>
  <div className="d-flex flex-wrap align-items-center gap-3">
   <p className="mb-0"><strong>{t("offlineUpdates.current")} :</strong> {overview?.version??"—"}</p>
   <button className="btn btn-sm btn-outline-secondary" type="button"
    onClick={()=>void refresh().catch(()=>setError(t("offlineUpdates.loadError")))}
    disabled={busy}>{t("offlineUpdates.refresh")}</button>
  </div>
  {status&&<p role="status" className="small text-secondary mb-0">
   {t("offlineUpdates.status")} : {status.state==="succeeded"?t("offlineUpdates.succeeded"):
    status.state==="failed"?t("offlineUpdates.failed"):
    status.state==="applying"?t("offlineUpdates.applying"):t("offlineUpdates.awaiting")}
   {status.version?" · "+status.version:""}
  </p>}
  {!overview?.ready&&<p className="alert alert-warning mb-0">{t("offlineUpdates.notReady")}</p>}
  {overview?.ready&&!overview.launcher&&<p className="alert alert-warning mb-0">{t("offlineUpdates.noLauncher")}</p>}
  {overview?.ready&&overview.launcher&&<p className="small text-secondary mb-0">{t("offlineUpdates.ready")}</p>}
  <form className="d-grid gap-2" onSubmit={check}>
   <label htmlFor="smn-update-zip" className="form-label fw-semibold mb-0">{t("offlineUpdates.select")}</label>
   <input type="file" id="smn-update-zip" name="file" accept=".zip,application/zip"
    disabled={!overview?.ready||busy||queued}
    className="form-control" onChange={event=>{setFile(event.currentTarget.files?.[0]??null);
     setPreview(null);setError("");}}/>
   <div className="d-flex flex-wrap gap-2">
    <button className="btn btn-primary" type="submit" disabled={!file||busy||queued||!overview?.ready}>
     {busy?t("offlineUpdates.checking"):t("offlineUpdates.preview")}
    </button>
    <button className="btn btn-outline-secondary" type="button" disabled={busy||queued}
     onClick={()=>{setFile(null);setPreview(null);setError("");}}>
     {t("offlineUpdates.cancel")}
    </button>
   </div>
  </form>
  {preview&&<div className="border rounded-3 p-3 d-grid gap-2">
   <p className="mb-0 fw-semibold">{t("offlineUpdates.signed")}</p>
   <dl className="row small mb-0">
    <dt className="col-sm-5">{t("offlineUpdates.source")}</dt><dd className="col-sm-7">{preview.fromVersion}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.target")}</dt><dd className="col-sm-7">{preview.toVersion}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.mode")}</dt>
    <dd className="col-sm-7">{t(preview.mode==="delta"?"offlineUpdates.delta":"offlineUpdates.full")}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.files")}</dt><dd className="col-sm-7">{preview.files}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.changes")}</dt><dd className="col-sm-7">{preview.changes}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.deletions")}</dt><dd className="col-sm-7">{preview.deletions}</dd>
    <dt className="col-sm-5">{t("offlineUpdates.bytes")}</dt>
    <dd className="col-sm-7">{(preview.bytes/1024/1024).toLocaleString(undefined,{maximumFractionDigits:2})} Mo</dd>
   </dl>
   {Array.isArray(preview.affected)&&preview.affected.length>0&&<details className="small">
    <summary>{t("offlineUpdates.files")} — {preview.affected.length} / {preview.files}</summary>
    <ul className="mt-2">
     {preview.affected.map((item,i)=><li key={item.path+i}>
      <code>{item.path}</code> ({item.action==="delete"?t("offlineUpdates.deletions"):t("offlineUpdates.changes")})
     </li>)}
    </ul>
   </details>}
   <p className="small text-secondary mb-0">{t("offlineUpdates.backupRequired")}</p>
   <button className="btn btn-primary" type="button"
    disabled={busy||queued||!overview?.ready||!overview?.launcher}
    onClick={()=>void approve()}>{t("offlineUpdates.confirm")}</button>
  </div>}
  {queued&&<p role="status" className="alert alert-info mb-0">{t("offlineUpdates.queued")}</p>}
  {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
  <p className="small text-secondary mb-0">{t("offlineUpdates.privacy")}</p>
 </section>;
}
