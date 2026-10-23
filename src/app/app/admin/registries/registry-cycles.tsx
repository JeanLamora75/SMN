"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Cycle={id:string;name:string;status:string};
type Data={cycles:Cycle[];linkedIds:string[]};
export default function RegistryCycles({id,canManage}:{id:string;canManage:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("registryCycles."+k) as Parameters<typeof t>[0]);
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState<string|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/cycles",{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Data>;})
   .then(v=>{if(!controller.signal.aborted)setData(v);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>controller.abort();
 },[id]);
 const toggle=async(cycle:Cycle,linked:boolean)=>{
  if(busy||!canManage)return;setBusy(cycle.id);setError(false);
  try{
   const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/cycles",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({cycleId:cycle.id,action:linked?"unlinked":"linked"})});
   if(!r.ok)throw Error("failed");
   setData(d=>d?{...d,linkedIds:linked?d.linkedIds.filter(x=>x!==cycle.id):[...d.linkedIds,cycle.id]}:d);
  }catch{setError(true);}finally{setBusy(null);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  {!data&&!error?<p role="status">{tr("loading")}</p>:null}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
  {data?.cycles.length===0&&<p>{tr("empty")}</p>}
  <ul className="list-group">{data?.cycles.map(cycle=>{
   const linked=data.linkedIds.includes(cycle.id),closed=cycle.status==="closed";
   return <li className="list-group-item d-flex align-items-center justify-content-between gap-3" key={cycle.id}>
    <span>{cycle.name} {closed&&<small className="text-body-secondary">({tr("closed")})</small>}</span>
    {canManage?<button type="button" className={"btn btn-sm "+(linked?"btn-outline-danger":"btn-outline-primary")}
     disabled={closed||busy!==null} onClick={()=>void toggle(cycle,linked)}>
     {tr(linked?"linked":"unlinked")}</button>:<strong>{tr(linked?"linked":"unlinked")}</strong>}
   </li>;
  })}</ul>
 </section>;
}
