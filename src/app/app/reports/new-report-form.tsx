"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {ReportTemplate} from "@/lib/report-templates";
import {useTranslation} from "@/i18n/client";

export default function NewReportForm({cycles,templates,preferredCycle}:{cycles:Array<[string,string]>;templates:ReportTemplate[];preferredCycle:string}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsCenter."+k) as Parameters<typeof t>[0]);
 const router=useRouter();
 const [sprint,setSprint]=useState(cycles.some(x=>x[0]===preferredCycle)?preferredCycle:cycles[0]?.[0]??"");
 const [template,setTemplate]=useState(templates[0]?.id??"standard");
 const [title,setTitle]=useState("");
 const [language,setLanguage]=useState<"fr"|"en">("fr");
 const [requestId,setRequestId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy||!sprint||!title.trim())return;
  const id=requestId??crypto.randomUUID();
  setRequestId(id);setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprint)+"/documents",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:title.trim(),templateId:template,language,requestId:id})});
   if(!r.ok)throw Error("create-failed");
   const result=await r.json() as {id:string};
   router.push("/app/reports/"+encodeURIComponent(result.id)+"?cycleId="+encodeURIComponent(sprint));
   router.refresh();
  }catch{setError(tr("createError"));}
  finally{setBusy(false);}
 };
 return <form className="border rounded p-3 mb-3 d-grid gap-3" onSubmit={e=>void submit(e)}>
  <h2 className="h5 mb-0">{tr("newReport")}</h2>
  <label>{tr("sprint")}<select className="form-select" required value={sprint} onChange={e=>{setSprint(e.target.value);setRequestId(null);}}>
   {cycles.map(([id,name])=><option key={id} value={id}>{name}</option>)}
  </select></label>
  <label>{tr("model")}<select className="form-select" value={template} onChange={e=>{setTemplate(e.target.value);setRequestId(null);}}>
   {templates.map(m=><option key={m.id} value={m.id}>{m.name} · V{m.revision}</option>)}
  </select></label>
  <label>{tr("title")}<input className="form-control" required maxLength={120} value={title} onChange={e=>{setTitle(e.target.value);setRequestId(null);}}/></label>
  <label>{tr("language")}<select className="form-select" value={language} onChange={e=>{setLanguage(e.target.value as "fr"|"en");setRequestId(null);}}>
   <option value="fr">Français</option><option value="en">English</option>
  </select></label>
  <div><button className="btn btn-primary" type="submit" disabled={busy||!sprint||!title.trim()}>{busy?tr("creating"):tr("create")}</button></div>
  {error&&<p role="alert" className="text-danger mb-0">{error}</p>}
 </form>;
}
