"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Event={id:string;category:string;sourceKind:string;sourceId:string;sourceRevision:number;title:string;recordedAt:string;invalidatedAt:string|null;invalidationReason:string|null};
export default function ConfirmedHighlights({canManage=false}:{canManage?:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("automaticHighlights."+k) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Event[]|null>(null),[error,setError]=useState(false);
 const [selected,setSelected]=useState<string|null>(null),[reason,setReason]=useState(""),[busy,setBusy]=useState(false);
 const reload=async()=>{const response=await fetch("/api/admin/registries/confirmed-highlights",{cache:"no-store"});if(!response.ok)throw Error("unavailable");const data=await response.json() as {items:Event[]};setItems(data.items);};
 useEffect(()=>{const ctrl=new AbortController();
  void fetch("/api/admin/registries/confirmed-highlights",{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<{items:Event[]}>;})
   .then(data=>{if(!ctrl.signal.aborted)setItems(data.items);})
   .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
  return()=>ctrl.abort();
 },[]);
 const invalidate=async(id:string)=>{if(!reason.trim()||busy||!canManage)return;setBusy(true);setError(false);
  try{const response=await fetch("/api/admin/registries/confirmed-highlights/"+encodeURIComponent(id),{
   method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
   if(!response.ok)throw Error("failed");
   await reload();setSelected(null);setReason("");
  }catch{setError(true);}finally{setBusy(false);}
 };
 return <section className="card p-3 mb-3"><h2 className="h5">{tr("journalHeading")}</h2>
 {error&&<p role="alert" className="text-danger">{tr("journalError")}</p>}
 {items?.length===0&&<p>{tr("journalEmpty")}</p>}
 <ul className="list-group">{items?.map(event=><li className="list-group-item" key={event.id}>
  <div className="d-flex flex-wrap gap-2 align-items-center">
   <strong>{tr(event.category)}</strong>
   <span>{event.invalidatedAt?tr("invalidated"):tr("activeFact")}</span>
   <span>{tr("automatic")}</span>
   {event.sourceKind==="registry"?
    <Link href={"/app/admin/registries/"+encodeURIComponent(event.sourceId)}>{event.title}</Link>:
    <span>{event.title} ({tr("goalSource")})</span>}
  </div>
  <div className="small text-body-secondary">{tr("sourceId")}: {event.sourceId} · {tr("sourceRevision")}: {event.sourceRevision} · {tr("recordedAt")}: {new Date(event.recordedAt).toLocaleString()}</div>
  {event.invalidatedAt&&<p className="small">{tr("invalidationReason")}: {event.invalidationReason} · {new Date(event.invalidatedAt).toLocaleString()}</p>}
  {canManage&&!event.invalidatedAt&&<div className="mt-2">
   {selected!==event.id?<button className="btn btn-outline-secondary btn-sm" type="button" onClick={()=>{setSelected(event.id);setReason("");}}>{tr("invalidate")}</button>:
    <div className="d-flex flex-wrap gap-2">
     <label className="visually-hidden" htmlFor={"reason-"+event.id}>{tr("invalidationReason")}</label>
     <input id={"reason-"+event.id} className="form-control" style={{maxWidth:360}} maxLength={2000} value={reason} placeholder={tr("invalidationReason")} onChange={e=>setReason(e.target.value)}/>
     <button type="button" className="btn btn-danger btn-sm" disabled={busy||!reason.trim()} onClick={()=>void invalidate(event.id)}>{tr("confirmInvalidation")}</button>
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={()=>{setSelected(null);setReason("");}}>{tr("cancelInvalidation")}</button>
    </div>}
  </div>}
 </li>)}</ul>
 </section>;
}
