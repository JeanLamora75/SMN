"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import type {ReportLanguage} from "@/lib/report-language";
export default function ReportLanguageChoice({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const [language,setLanguage]=useState<ReportLanguage>("fr"),[savedLanguage,setSavedLanguage]=useState<ReportLanguage>("fr");
 const [revision,setRevision]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const dirty=revision!==null&&language!==savedLanguage;
 useUnsavedChanges(dirty||busy,t("reportLanguage.leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/language",{cache:"no-store",signal:ctrl.signal})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{language:ReportLanguage;revision:number}>;})
 .then(r=>{if(!ctrl.signal.aborted){setLanguage(r.language);setSavedLanguage(r.language);setRevision(r.revision);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();},[sprintId]);
 async function save(){if(revision===null||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/language",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({language,revision})});
 if(!r.ok)throw Error();const data=await r.json() as {revision:number};
 setRevision(data.revision);setSavedLanguage(language);
 }catch{setError(true);}finally{setBusy(false);}}
 return <section className="border-top pt-3 d-grid gap-2">
 <h2 className="h5">{t("reportLanguage.heading")}</h2>
 <p className="text-secondary">{t("reportLanguage.explanation")}</p>
 <label htmlFor="report-language">{t("reportLanguage.label")}</label>
 <select id="report-language" className="form-select w-auto" value={language} disabled={busy||revision===null} onChange={e=>setLanguage(e.target.value as ReportLanguage)}>
 <option value="fr">Français</option><option value="en">English</option></select>
 <div className="d-flex gap-2 align-items-center">
 <button type="button" className="btn btn-primary" disabled={!dirty||busy} onClick={()=>void save()}>{t("reportLanguage.save")}</button>
 {!dirty&&revision!==null&&<Link href={"/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report/preview"} className="btn btn-outline-secondary">{t("reportPreview.open")}</Link>}
 </div>{error&&<p role="alert" className="text-danger">{t("reportLanguage.error")}</p>}
 </section>;
}
