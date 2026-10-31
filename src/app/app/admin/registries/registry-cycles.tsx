"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import {formatRegistryDate} from "@/lib/registry-date";
type Cycle={id:string;name:string;status:string;startOn:string;endOn:string};
type Data={cycles:Cycle[];linkedIds:string[]};
const validId=(id:unknown)=>typeof id==="string"&&/^[0-9a-f-]{36}$/i.test(id);
function parseData(value:unknown):Data|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const data=value as Partial<Data>;
 if(!Array.isArray(data.cycles)||!Array.isArray(data.linkedIds)||
  !data.cycles.every(c=>c&&validId(c.id)&&typeof c.name==="string"&&
   c.name.trim()&&typeof c.status==="string"&&
   /^\d{4}-\d{2}-\d{2}$/.test(c.startOn)&&/^\d{4}-\d{2}-\d{2}$/.test(c.endOn))||
  !data.linkedIds.every(validId)||
  !data.linkedIds.every(x=>data.cycles!.some(c=>c.id===x)))return null;
 return {cycles:data.cycles,linkedIds:data.linkedIds};
}
export default function RegistryCycles({id,teamId,canManage,onSaved}:{id:string;teamId?:string;canManage:boolean;onSaved?:()=>void}){
 const locale=useLocale();
 const t=useTranslation(),tr=(k:string)=>t(("registryCycles."+k) as Parameters<typeof t>[0]);
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState<string|null>(null);
 const [reload,setReload]=useState(0);
 const [expanded,setExpanded]=useState(false);
 const [loadedKey,setLoadedKey]=useState<string|null>(null);
 const requestKey=id+":"+reload;
 const currentData=loadedKey===requestKey?data:null;
 const currentError=loadedKey===requestKey?error:false;
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/cycles"+(teamId?"?teamId="+encodeURIComponent(teamId):""),{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");
    const parsed=parseData(await r.json());if(!parsed)throw Error("invalid");return parsed;})
   .then(v=>{if(!controller.signal.aborted){
    setData(v);setError(false);setLoadedKey(requestKey);
   }})
   .catch(()=>{if(!controller.signal.aborted){
    setData(null);setError(true);setLoadedKey(requestKey);
   }});
  return()=>controller.abort();
 },[id,teamId,requestKey]);
 const toggle=async(cycle:Cycle,linked:boolean)=>{
  if(busy||!canManage||cycle.status==="closed")return;
  setBusy(cycle.id);setError(false);
  try{
   const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/cycles",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({cycleId:cycle.id,action:linked?"unlinked":"linked",...(teamId?{teamId}:{})})});
   if(!r.ok)throw Error("failed");
   setData(d=>d?{...d,linkedIds:linked?d.linkedIds.filter(x=>x!==cycle.id):[...d.linkedIds,cycle.id]}:d);
   // Do not call onSaved here: the parent treats it as a request to dismiss the modal.
  }catch{setError(true);}finally{setBusy(null);}
 };
 return <section className="card p-3 mt-3">
  <div className="d-flex align-items-center justify-content-between gap-2">
   <h2 className="h5 mb-0">{tr("heading")}</h2>
   <button type="button" className="btn btn-sm btn-outline-secondary" aria-expanded={expanded}
    aria-controls="registry-cycles-list" aria-label={expanded?"Replier les cycles associés":"Déplier les cycles associés"}
    onClick={()=>setExpanded(value=>!value)}>{expanded?"▴":"▾"}</button>
  </div>
  {expanded&&<><p className="text-body-secondary mt-2">{tr("intro")}</p>
  {!currentData&&!currentError?<p role="status">{tr("loading")}</p>:null}
  {currentError&&<div role="alert" className="d-flex gap-2 align-items-center">
   <span className="text-danger">{tr("error")}</span>
   <button type="button" className="btn btn-outline-secondary btn-sm"
    onClick={()=>setReload(n=>n+1)}>{tr("retry")}</button>
  </div>}
  {currentData?.cycles.length===0&&<p>{tr("empty")}</p>}
  <ul id="registry-cycles-list" className="list-group">{currentData?.cycles.map(cycle=>{
   const linked=currentData.linkedIds.includes(cycle.id),closed=cycle.status==="closed";
   return <li className="list-group-item d-flex align-items-center justify-content-between gap-3" key={cycle.id}>
    <span>{cycle.name} <small className="text-body-secondary">({formatRegistryDate(cycle.startOn,locale)} – {formatRegistryDate(cycle.endOn,locale)})</small> {closed&&<small className="text-body-secondary">({tr("closed")})</small>}</span>
    {canManage?<button type="button" className={"btn btn-sm "+(linked?"btn-outline-danger":"btn-outline-primary")}
     disabled={closed||busy!==null} onClick={()=>void toggle(cycle,linked)}>
     {tr(linked?"linked":"unlinked")}</button>:<strong>{tr(linked?"linked":"unlinked")}</strong>}
   </li>;
  })}</ul></>}
 </section>;
}
