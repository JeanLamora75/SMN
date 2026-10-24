"use client";
import {useCallback,useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Occurrence={id:string;templateId:string;templateRevision:number;sprintName:string;name:string;startAt:string;endAt:string;timeZone:string;templateActive:boolean;generationSource:string};
export default function TemplateOccurrencesList(){
 const t=useTranslation();
 const [rows,setRows]=useState<Occurrence[]>([]);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{setBusy(true);setError("");
 try{const r=await fetch("/api/admin/sprints/template-occurrences",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setRows(j.occurrences);}
 catch{setError(t("templateOccurrences.error"));}finally{setBusy(false);}},[t]);
 useEffect(()=>{void Promise.resolve().then(load);},[load]);
 const local=(instant:string,zone:string)=>new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short",timeZone:zone}).format(new Date(instant));
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("templateOccurrences.title")}</h2>
 <p className="text-secondary">{t("templateOccurrences.info")}</p>
 <button type="button" className="btn btn-outline-primary mb-3" onClick={load} disabled={busy}>{t("templateOccurrences.refresh")}</button>
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 {!error&&rows.length===0&&<p>{t("templateOccurrences.empty")}</p>}
 {rows.length>0&&<div className="table-responsive"><table className="table">
 <thead><tr><th>{t("templateOccurrences.meeting")}</th><th>{t("templateOccurrences.sprint")}</th><th>{t("templateOccurrences.period")}</th><th>{t("templateOccurrences.version")}</th></tr></thead>
 <tbody>{rows.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.sprintName}</td><td>{local(x.startAt,x.timeZone)} – {local(x.endAt,x.timeZone)}</td><td>{x.templateRevision}{x.generationSource==="reconstructed"?" · "+t("sprintWizard.reconstructedLabel"):""}{!x.templateActive?" · "+t("templateOccurrences.inactive"):""}</td></tr>)}</tbody>
 </table></div>}
 </section>;
}
