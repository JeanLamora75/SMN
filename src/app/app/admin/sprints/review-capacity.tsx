"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string};
type Datum={retainedJh:number|null;source:string;referenceJh:number|null};
type Report={sprint:{name:string;start:string;end:string};initial:Datum;actual:Datum&{manualJh:number|null;missingSources:string[]};differenceJh:number|null;reliable:boolean};
export default function ReviewCapacity(){
 const t=useTranslation();const [sprints,setSprints]=useState<Sprint[]>([]),[selected,setSelected]=useState(""),[report,setReport]=useState<Report|null>(null),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/admin/sprints/states",{cache:"no-store"}).then(r=>r.json()).then(j=>setSprints(j.sprints??[])).catch(()=>setError(t("reviewCapacity.error")));},[t]);
 async function select(id:string){setSelected(id);setReport(null);setError("");if(!id)return;
 try{const r=await fetch("/api/admin/sprints/review-capacity?sprintId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();setReport(await r.json());}
 catch{setError(t("reviewCapacity.error"));}}
 const display=(v:number|null)=>v===null?t("reviewCapacity.unavailable"):v.toLocaleString(undefined,{maximumFractionDigits:4})+" JH";
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("reviewCapacity.title")}</h2>
 <label htmlFor="review-sprint" className="form-label">{t("reviewCapacity.choose")}</label>
 <select id="review-sprint" value={selected} className="form-select" onChange={e=>select(e.target.value)}><option value="">—</option>{sprints.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select>
 {report&&<><p className="mt-3">{report.sprint.name} — {report.sprint.start} / {report.sprint.end}</p>
 <table className="table"><thead><tr><th>{t("reviewCapacity.metric")}</th><th>{t("reviewCapacity.initial")}</th><th>{t("reviewCapacity.actual")}</th></tr></thead>
 <tbody><tr><th>{t("reviewCapacity.retained")}</th><td>{display(report.initial.retainedJh)}</td><td>{display(report.actual.retainedJh)}</td></tr>
 <tr><th>{t("reviewCapacity.reference")}</th><td>{display(report.initial.referenceJh)}</td><td>{display(report.actual.referenceJh)}</td></tr>
 <tr><th>{t("reviewCapacity.source")}</th><td>{report.initial.source}</td><td>{report.actual.source}</td></tr></tbody></table>
 <p><strong>{t("reviewCapacity.difference")}:</strong> {display(report.differenceJh)}</p>
 {!report.reliable&&<p role="status">{t("reviewCapacity.unreliable")}</p>}
 <p className="text-secondary small">{t("reviewCapacity.readonly")}</p></>}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 </section>;
}
