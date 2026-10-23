"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
export default function ReportLogoEditor({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const [busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
 async function update(logo:{mime:string;base64:string}|null){
 setBusy(true);setError(false);setSaved(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/logo",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({logo})});
 if(!r.ok)throw Error();setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}
 }
 async function choose(file:File|undefined){
 if(!file)return;
 if(!["image/png","image/jpeg"].includes(file.type)||file.size>256*1024){setError(true);return;}
 const bytes=new Uint8Array(await file.arrayBuffer());
 let binary="";for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
 await update({mime:file.type,base64:btoa(binary)});
 }
 return <section className="border-top pt-3"><h2 className="h5">{t("reportLogo.heading")}</h2>
 <p className="text-secondary">{t("reportLogo.description")}</p>
 <label className="form-label" htmlFor="report-logo-file">{t("reportLogo.choose")}</label>
 <input type="file" className="form-control mb-2" id="report-logo-file" accept="image/png,image/jpeg" disabled={busy}
 onChange={e=>void choose(e.target.files?.[0])}/>
 <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>void update(null)}>{t("reportLogo.remove")}</button>
 {saved&&<p role="status" className="text-success">{t("reportLogo.saved")}</p>}
 {error&&<p role="alert" className="text-danger">{t("reportLogo.error")}</p>}
 </section>;
}
