"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Alert={id:string;type:string;title:string;status:string;reason:string;dueOn:string|null};
export default function AttentionCockpit(){
 const t=useTranslation(),tr=(key:string)=>t(("registryAttention."+key) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Alert[]|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();
  void fetch("/api/admin/registries/attention",{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{alerts:Alert[]}>;})
   .then(data=>{if(!controller.signal.aborted)setItems(data.alerts);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>controller.abort();
 },[]);
 return <section className="card p-3 mb-3">
  <h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  {error&&<p role="alert" className="text-danger">{tr("unavailable")}</p>}
  {items?.length===0&&<p>{tr("empty")}</p>}
  <ul className="list-group">{items?.map((item,index)=><li className="list-group-item" key={item.id+":"+item.reason+":"+index}>
   <span aria-hidden="true">{item.reason==="highRisk"||item.reason==="overdue"?"▲":"◆"} </span>
   <strong>{tr(item.reason)}</strong>{" — "}
   <Link href={"/app/admin/registries/"+encodeURIComponent(item.id)}>{item.title}</Link>
   {" · "}{tr("status")}: {item.status}
   {item.dueOn&&<>{" · "}{tr("due")}: {item.dueOn}</>}
  </li>)}</ul>
 </section>;
}
