"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import type {ReportTemplate} from "@/lib/report-templates";
import {useTranslation} from "@/i18n/client";

export default function NewReportForm({cycles,templates,preferredCycle}:{cycles:Array<[string,string]>;templates:ReportTemplate[];preferredCycle:string}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsCenter."+k) as Parameters<typeof t>[0]);
 const router=useRouter();
 const triggerRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const titleRef=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false);
 const [sprint,setSprint]=useState(cycles.some(x=>x[0]===preferredCycle)?preferredCycle:cycles[0]?.[0]??"");
 const [template,setTemplate]=useState(templates[0]?.id??"standard");
 const [title,setTitle]=useState("");
 const [language,setLanguage]=useState<"fr"|"en">("fr");
 const [requestId,setRequestId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(open&&!dialog.open){dialog.showModal();titleRef.current?.focus();}
  if(!open&&dialog.open){dialog.close();triggerRef.current?.focus();}
 },[open]);
 const dismiss=()=>{
  if(busy)return;
  setOpen(false);setTitle("");setError("");setRequestId(null);
 };
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy||!sprint||!template||!title.trim())return;
  const id=requestId??crypto.randomUUID();
  setRequestId(id);setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprint)+"/documents",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:title.trim(),templateId:template,language,requestId:id})});
   if(!r.ok)throw Error("create-failed");
   const result=await r.json() as {id:string};
   setOpen(false);
   router.push("/app/reports/"+encodeURIComponent(result.id)+"?cycleId="+encodeURIComponent(sprint));
   router.refresh();
  }catch{setError(tr("createError"));}
  finally{setBusy(false);}
 };
 return <>
  <button ref={triggerRef} className="smn-report-create" type="button" onClick={()=>setOpen(true)} disabled={cycles.length===0||templates.length===0} aria-haspopup="dialog" aria-label={tr("newReport")}> 
   <span aria-hidden="true" className="smn-report-create-plus">+</span><span className="smn-report-create-label">{tr("newReport")}</span>
  </button>
  <dialog ref={dialogRef} className="smn-report-dialog" aria-labelledby="smn-report-create-title"
   onCancel={e=>{if(busy)e.preventDefault();else dismiss();}}
   onClose={()=>{setOpen(false);triggerRef.current?.focus();}}>
   <div className="smn-report-dialog-heading">
    <h2 id="smn-report-create-title">{tr("newReport")}</h2>
    <button type="button" className="smn-report-dialog-close" onClick={dismiss} disabled={busy} aria-label={tr("closeDialog")}>×</button>
   </div>
   <form onSubmit={e=>void submit(e)}>
    <div className="smn-report-dialog-body">
     <label>{tr("sprint")}<select className="form-select" required value={sprint} onChange={e=>{setSprint(e.target.value);setRequestId(null);}}>
      {cycles.map(([id,name])=><option key={id} value={id}>{name}</option>)}
     </select></label>
     <label>{tr("model")}<select className="form-select" required value={template} onChange={e=>{setTemplate(e.target.value);setRequestId(null);}}>
      {templates.map(m=><option key={m.id} value={m.id}>{m.name} · V{m.revision}</option>)}
     </select></label>
     <label>{tr("title")}<input ref={titleRef} className="form-control" required maxLength={120} value={title} placeholder={tr("titlePlaceholder")} onChange={e=>{setTitle(e.target.value);setRequestId(null);}}/></label>
     <label>{tr("language")}<select className="form-select" value={language} onChange={e=>{setLanguage(e.target.value as "fr"|"en");setRequestId(null);}}>
      <option value="fr">Français</option><option value="en">English</option>
     </select></label>
     {error&&<p role="alert" className="text-danger mb-0">{error}</p>}
    </div>
    <div className="smn-report-dialog-footer">
     <button type="button" className="btn btn-outline-secondary" onClick={dismiss} disabled={busy}>{tr("cancel")}</button>
     <button className="btn btn-primary" type="submit" disabled={busy||!sprint||!template||!title.trim()}>{busy?tr("creating"):tr("create")}</button>
    </div>
   </form>
  </dialog>
 </>;
}
