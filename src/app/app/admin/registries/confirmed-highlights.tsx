"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Event={id:string;category:string;sourceKind:string;sourceId:string;title:string;recordedAt:string};
export default function ConfirmedHighlights(){
 const t=useTranslation();const tr=(k:string)=>t(("automaticHighlights."+k) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Event[]|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/registries/confirmed-highlights",{signal:ctrl.signal,cache:"no-store"})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{items:Event[]}>;})
 .then(d=>{if(!ctrl.signal.aborted)setItems(d.items);})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
 return()=>ctrl.abort();},[]);
 return <section className="card p-3 mb-3"><h2 className="h5">{tr("journalHeading")}</h2>
 {error&&<p role="alert">{tr("journalError")}</p>}
 {items?.length===0&&<p>{tr("journalEmpty")}</p>}
 <ul className="list-group">{items?.map(e=><li className="list-group-item" key={e.id}>
 <strong>{tr(e.category)}</strong> — {e.sourceKind==="registry"?
 <Link href={"/app/admin/registries/"+encodeURIComponent(e.sourceId)}>{e.title}</Link>:
 <span>{e.title} ({tr("goalSource")}: {e.sourceId})</span>}
 <span className="small text-body-secondary ms-2">{new Date(e.recordedAt).toLocaleString()}</span></li>)}</ul>
 </section>;
}
