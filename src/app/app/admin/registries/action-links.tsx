"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Item={id:string;title:string;type:string};
export default function ActionLinks({id,canManage}:{id:string;canManage:boolean}){
 const t=useTranslation(),tr=(x:string)=>t(("actionLinks."+x) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Item[]|null>(null),[related,setRelated]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const reload=async()=>{const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/action-links",{cache:"no-store"});if(!r.ok)throw Error("unavailable");const x=await r.json() as {links:Item[]};setItems(x.links);};
 useEffect(()=>{let active=true;void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/action-links",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{links:Item[]}>;}).then(x=>{if(active)setItems(x.links);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[id]);
 const change=async(relatedId:string,action:"linked"|"unlinked")=>{setBusy(true);setError(false);try{
  const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/action-links",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({relatedId,action})});
  if(!r.ok)throw Error("failed");await reload();setRelated("");
 }catch{setError(true);}finally{setBusy(false);}};
 return <section className="card p-3 mt-3"><h2 className="h5">{tr("heading")}</h2><p>{tr("intro")}</p>
  {items?.length===0&&<p>{tr("empty")}</p>}
  <ul className="list-group">{items?.map(x=><li key={x.id} className="list-group-item d-flex justify-content-between gap-2">
   <Link href={"/app/admin/registries/"+encodeURIComponent(x.id)}>{x.title} ({x.type})</Link>
   {canManage&&<button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={()=>void change(x.id,"unlinked")}>{tr("remove")}</button>}
  </li>)}</ul>
  {canManage&&<div className="mt-3 d-flex gap-2 flex-wrap"><label className="visually-hidden" htmlFor="action-related">{tr("related")}</label>
   <input id="action-related" className="form-control flex-grow-1" style={{maxWidth:370}} placeholder={tr("related")} maxLength={36} value={related} onChange={e=>setRelated(e.target.value)}/>
   <button type="button" className="btn btn-primary" disabled={busy||!related.trim()} onClick={()=>void change(related.trim(),"linked")}>{tr("add")}</button></div>}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
