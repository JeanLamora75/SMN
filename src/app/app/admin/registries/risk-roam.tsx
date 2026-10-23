"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {roamValues,type Roam} from "@/lib/roam-values";
type RoamState={classification:Roam|null;revision:number;updatedAt:string|null};
export default function RiskRoam({id,canManage}:{id:string;canManage:boolean}){
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
   setState({...state,...data,updatedAt:new Date().toISOString()});
  }catch{setError("error");}
  finally{setSaving(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {!state?<p role="status">{tr(error??"unavailable")}</p>:<>
   {canManage?<div className="d-flex flex-wrap gap-2 align-items-center">
    <label htmlFor="risk-roam" className="visually-hidden">{tr("heading")}</label>
    <select className="form-select w-auto" id="risk-roam" value={value??""} onChange={e=>setValue(e.target.value as Roam)}>
     <option value="">{tr("none")}</option>
     {roamValues.map(x=><option key={x} value={x}>{tr(x)}</option>)}
    </select>
    <button className="btn btn-primary" type="button" onClick={save} disabled={saving||!value||value===state.classification}>
     {tr(saving?"saving":"save")}
    </button>
   </div>:<p>{value?tr(value):tr("none")}</p>}
   {state.updatedAt&&<small className="text-body-secondary">{tr("updatedAt")}: {state.updatedAt}</small>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
