"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {roamValues,type Roam} from "@/lib/roam-values";
type RoamState={classification:Roam|null;revision:number;updatedAt:string|null};
export default function RiskRoam({id,canManage,onSaved}:{id:string;canManage:boolean;onSaved?:()=>void}){
 const t=useTranslation();
 const [state,setState]=useState<RoamState|null>(null);
 const [value,setValue]=useState<Roam|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const tr=(name:string)=>t(("registryRoam."+name) as Parameters<typeof t>[0]);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/roam",{cache:"no-store",signal:ctrl.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<RoamState>;})
   .then(r=>{if(!ctrl.signal.aborted){setState(r);setValue(r.classification);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError("unavailable");});
  return()=>ctrl.abort();
 },[id]);
 const save=async()=>{
  if(!canManage||!state||!value||saving)return;
  setSaving(true);setError(null);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/roam",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({classification:value,revision:state.revision})
   });
   if(response.status===409){setError("conflict");return;}
   if(!response.ok)throw Error("unavailable");
   const data=await response.json() as RoamState&{ok:boolean};
   if(!data.ok)throw Error("unavailable");
   setState({...state,...data,updatedAt:new Date().toISOString()});onSaved?.();
  }catch{setError("error");}
  finally{setSaving(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {!state?<p role="status">{tr(error??"unavailable")}</p>:<>
   <div className="smn-risk-roam-grid" role="group" aria-label={tr("heading")}>
    {roamValues.map(option=>{
     const selected=value===option;
     return canManage?<button key={option} type="button"
      className={"smn-risk-roam-tile smn-risk-roam-"+option+(selected?" is-selected":"")}
      aria-pressed={selected} disabled={saving} onClick={()=>setValue(option)}>
      <span className="smn-risk-roam-glyph" aria-hidden="true">{option==="resolved"?"✓":option==="owned"?"●":option==="accepted"?"◆":"✦"}</span>
      <strong>{tr(option)}</strong>{selected&&<span className="smn-risk-roam-check" aria-hidden="true">✓</span>}
     </button>:<div key={option} className={"smn-risk-roam-tile smn-risk-roam-"+option+(selected?" is-selected":"")}
      role="img" aria-label={tr(option)+(selected?" — sélectionné":"")}>
      <span className="smn-risk-roam-glyph" aria-hidden="true">{option==="resolved"?"✓":option==="owned"?"●":option==="accepted"?"◆":"✦"}</span>
      <strong>{tr(option)}</strong>{selected&&<span className="smn-risk-roam-check" aria-hidden="true">✓</span>}
     </div>;
    })}
   </div>
   {canManage&&<button className="btn btn-primary" type="button" onClick={save}
    disabled={saving||!value||value===state.classification}>{tr(saving?"saving":"save")}</button>}
   {state.updatedAt&&<small className="text-body-secondary">{tr("updatedAt")}: {state.updatedAt}</small>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
