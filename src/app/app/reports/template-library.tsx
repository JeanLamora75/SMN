"use client";
import {useState} from "react";
import type {ReportTemplate} from "@/lib/report-templates";
import {useTranslation} from "@/i18n/client";

export default function TemplateLibrary({templates,canManage}:{templates:ReportTemplate[];canManage:boolean}){
 const t=useTranslation(),tr=(key:string)=>t(("reportsCenter."+key) as Parameters<typeof t>[0]);
 const [items,setItems]=useState(templates),[preview,setPreview]=useState<string|null>(null);
 const [copyId,setCopyId]=useState<string|null>(null),[name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const selected=items.find(x=>x.id===preview);
 async function duplicate(){
  if(!copyId||!name.trim()||busy)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/reports/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"copy",id:copyId,name:name.trim()})});
   if(!r.ok)throw Error("copy-failed");
   const loaded=await fetch("/api/admin/reports/templates",{cache:"no-store"});
   if(!loaded.ok)throw Error("load-failed");
   const data=await loaded.json() as {templates:ReportTemplate[]};
   setItems(data.templates);setCopyId(null);setName("");
  }catch{setError(tr("copyError"));}
  finally{setBusy(false);}
 }
 return <div>
  <div className="row g-3">{items.map(m=><div className="col-12 col-md-6 col-xl-4" key={m.id}>
   <article className="card h-100"><div className="card-body d-grid gap-2">
    <h2 className="h6">{m.name}</h2>
    <p className="text-secondary mb-0">{m.protected?tr("system"):tr("custom")} · V{m.revision}</p>
    <div className="d-flex flex-wrap gap-2">
     <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setPreview(m.id)}>{tr("previewModel")}</button>
     {canManage&&<button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>{setCopyId(m.id);setName("");setError("");}}>{tr("duplicateModel")}</button>}
    </div>
   </div></article>
  </div>)}</div>
  {copyId&&canManage&&<section className="border rounded p-3 mt-3" aria-label={tr("duplicateModel")}>
   <label className="form-label">{tr("copyName")}<input className="form-control" maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
   <div className="d-flex gap-2"><button type="button" className="btn btn-primary" disabled={!name.trim()||busy} onClick={()=>void duplicate()}>{tr("duplicateModel")}</button>
   <button type="button" className="btn btn-outline-secondary" onClick={()=>setCopyId(null)}>{tr("cancel")}</button></div>
   {error&&<p role="alert" className="text-danger mt-2">{error}</p>}
  </section>}
  {selected&&<section className="border rounded p-3 mt-3" aria-label={tr("previewModel")}>
   <div className="d-flex justify-content-between"><h2 className="h5">{selected.name} · V{selected.revision}</h2>
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setPreview(null)}>{tr("closePreview")}</button></div>
   <p className="text-secondary">{tr("structuralPreview")}</p>
   <ol>{selected.sections.filter(s=>s.visible).map(s=><li key={s.key}>{s.key}</li>)}</ol>
   <p>{tr("modelMetrics")}: {selected.content.metrics.length}</p>
  </section>}
 </div>;
}
