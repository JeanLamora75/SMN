"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Frequency="daily"|"weekly"|"sprint";
type Input={name:string;frequency:Frequency;weekday:number|null;position:"start"|"end"|null;time:string;duration:number};
type Row=Input&{id:string;active:boolean;revision:number};
const empty:Input={name:"",frequency:"daily",weekday:null,position:null,time:"09:00",duration:30};
export default function TemplateForm(){
 const t=useTranslation();
 const [rows,setRows]=useState<Row[]>([]);
 const [teamId,setTeamId]=useState<string|null>(null);
 const [id,setId]=useState("");
 const [form,setForm]=useState<Input>(empty);
 const [active,setActive]=useState(true);
 const [revision,setRevision]=useState(1);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 async function load(){const r=await fetch("/api/admin/sprints/templates",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setRows(j.templates);setTeamId(j.teamId??null);}
 useEffect(()=>{void Promise.resolve().then(load).catch(()=>setError(t("ceremonyTemplates.error")));},[t]);
 function choose(key:string){const x=rows.find(v=>v.id===key);setId(key);setForm(x?{name:x.name,frequency:x.frequency,weekday:x.weekday,position:x.position,time:x.time.slice(0,5),duration:x.duration}:empty);setActive(x?.active??true);setRevision(x?.revision??1);setError("");setMessage("");}
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");
 try{const r=await fetch("/api/admin/sprints/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...(id?{id,revision}:{}),...(teamId?{teamId}:{}),active,template:form})});
 const d=await r.json();if(!r.ok)throw Error();await load();choose("");setMessage(t("ceremonyTemplates.saved"));}
 catch{setError(t("ceremonyTemplates.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("ceremonyTemplates.title")}</h2><p>{t("ceremonyTemplates.intro")}</p>
 <label className="form-label" htmlFor="template-existing">{t("ceremonyTemplates.existing")}</label><select id="template-existing" className="form-select" value={id} onChange={e=>choose(e.target.value)}><option value="">{t("ceremonyTemplates.new")}</option>{rows.map(x=><option key={x.id} value={x.id}>{x.name} — {x.active?t("ceremonyTemplates.enabled"):t("ceremonyTemplates.disabled")}</option>)}</select>
 <form className="row g-3 mt-2" onSubmit={save}>
 <div className="col-md-6"><label className="form-label" htmlFor="template-name">{t("ceremonyTemplates.name")}</label><input id="template-name" className="form-control" value={form.name} required maxLength={120} onChange={e=>setForm({...form,name:e.target.value})}/></div>
 <div className="col-md-6"><label className="form-label" htmlFor="template-frequency">{t("ceremonyTemplates.frequency")}</label><select id="template-frequency" className="form-select" value={form.frequency} onChange={e=>{const frequency=e.target.value as Frequency;setForm({...form,frequency,weekday:frequency==="weekly"?1:null,position:frequency==="sprint"?"start":null});}}><option value="daily">{t("ceremonyTemplates.daily")}</option><option value="weekly">{t("ceremonyTemplates.weekly")}</option><option value="sprint">{t("ceremonyTemplates.sprint")}</option></select></div>
 {form.frequency==="weekly"&&<div className="col-md-6"><label htmlFor="template-day" className="form-label">{t("ceremonyTemplates.weekday")}</label><select id="template-day" className="form-select" value={form.weekday??1} onChange={e=>setForm({...form,weekday:Number(e.target.value)})}>{Array.from({length:7},(_,i)=><option key={i+1} value={i+1}>{t("ceremonyTemplates.day",{number:i+1})}</option>)}</select></div>}
 {form.frequency==="sprint"&&<div className="col-md-6"><label htmlFor="template-position" className="form-label">{t("ceremonyTemplates.position")}</label><select id="template-position" className="form-select" value={form.position??"start"} onChange={e=>setForm({...form,position:e.target.value as "start"|"end"})}><option value="start">{t("ceremonyTemplates.start")}</option><option value="end">{t("ceremonyTemplates.end")}</option></select></div>}
 <div className="col-md-4"><label htmlFor="template-time" className="form-label">{t("ceremonyTemplates.time")}</label><input id="template-time" type="time" className="form-control" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
 <div className="col-md-4"><label htmlFor="template-duration" className="form-label">{t("ceremonyTemplates.duration")}</label><input id="template-duration" type="number" min={1} max={480} required className="form-control" value={form.duration} onChange={e=>setForm({...form,duration:Number(e.target.value)})}/></div>
 <div className="col-md-4"><label htmlFor="template-active" className="form-check-label">{t("ceremonyTemplates.enabled")}</label><input id="template-active" type="checkbox" className="form-check-input ms-2" checked={active} onChange={e=>setActive(e.target.checked)}/></div>
 <div className="col-12"><button className="btn btn-primary" type="submit" disabled={busy}>{t("ceremonyTemplates.save")}</button></div></form>
 <p className="small text-secondary mt-3">{t("ceremonyTemplates.capacity")}</p>
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}{message&&<p role="status" className="alert alert-success">{message}</p>}
 </section>;
}
