"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
export default function DependencyVigilance({id,canManage,onSaved}:{id:string;canManage:boolean;onSaved?:()=>void}){
 const t=useTranslation(),tr=(k:string)=>t(("dependencyVigilance."+k) as Parameters<typeof t>[0]);
 const [revision,setRevision]=useState<number|null>(null),[saved,setSaved]=useState(false);
 const [value,setValue]=useState(false),[initial,setInitial]=useState(false);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/vigilance",{cache:"no-store",signal:ctrl.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{atRisk:boolean;revision:number}>;})
   .then(x=>{if(!ctrl.signal.aborted){setValue(x.atRisk);setInitial(x.atRisk);setRevision(x.revision);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError("error");});
  return()=>ctrl.abort();
 },[id]);
 const save=async()=>{
  if(!canManage||revision===null||busy)return;
  setBusy(true);setError("");setSaved(false);
  try{
   const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/vigilance",{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({atRisk:value,revision})});
   if(r.status===409){setError("conflict");return;}
   if(!r.ok)throw Error("failed");
   const result=await r.json() as {ok:boolean;revision:number};
   if(!result.ok)throw Error("failed");
   setRevision(result.revision);setInitial(value);setSaved(true);onSaved?.();
  }catch{setError("error");}finally{setBusy(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {revision===null?<p role="status">{error?tr(error):"…"}</p>:<>
   <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" id="dependency-risk-flag"
    checked={value} disabled={!canManage||busy} onChange={e=>{setValue(e.target.checked);setSaved(false);}}/>
    <label htmlFor="dependency-risk-flag" className="form-check-label">{tr("flag")}</label></div>
   {canManage&&<button className="btn btn-primary align-self-start mt-2" type="button"
    disabled={busy||value===initial} onClick={save}>{tr("save")}</button>}
   {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
