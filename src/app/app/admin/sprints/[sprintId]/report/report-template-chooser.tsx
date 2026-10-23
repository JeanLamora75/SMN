"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Template={id:string;name:string;protected:boolean;sections:Array<{key:string;visible:boolean}>};
export default function ReportTemplateChooser(){
 const t=useTranslation(),tr=(key:string)=>t(("reportTemplates."+key) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Template[]>([]),[name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const load=async()=>{const r=await fetch("/api/admin/reports/templates",{cache:"no-store"});if(!r.ok)throw Error();setItems((await r.json() as {templates:Template[]}).templates);};
 useEffect(()=>{void load().catch(()=>setError(true));},[]);
 const copy=async()=>{if(!name.trim()||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"copy",id:"standard",name})});if(!r.ok)throw Error();await load();setName("");}
 catch{setError(true);}finally{setBusy(false);}};
 return <section className="border-top pt-3"><h2 className="h5">{tr("heading")}</h2>
 <p className="text-secondary">{tr("intro")}</p>
 <ul className="list-group mb-3">{items.map(x=><li className="list-group-item" key={x.id}>
 <strong>{x.name}</strong> {x.protected&&<span className="badge text-bg-secondary">{tr("protected")}</span>}
 <span className="ms-2 text-secondary">{x.sections.length} {tr("sections")}</span>
 </li>)}</ul>
 <label className="form-label" htmlFor="copy-name">{tr("copyName")}</label>
 <div className="d-flex gap-2 flex-wrap"><input id="copy-name" className="form-control" style={{maxWidth:320}} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/>
 <button type="button" className="btn btn-outline-primary" disabled={busy||!name.trim()} onClick={()=>void copy()}>{tr("copy")}</button></div>
 {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
