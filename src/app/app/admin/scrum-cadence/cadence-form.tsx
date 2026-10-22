"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Cadence={durationWeeks:number;startDay:number;startTime:string;endDay:number;endTime:string;timeZone:string;revision:number;updatedAt:string};
export default function CadenceForm(){
 const t=useTranslation();
 const [current,setCurrent]=useState<Cadence|null>(null);
 const [draft,setDraft]=useState<Cadence|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [success,setSuccess]=useState(false);
 useEffect(()=>{let live=true;fetch("/api/admin/scrum-cadence",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live){setCurrent(d.cadence);setDraft(d.cadence);}}).catch(()=>{if(live)setError(t("scrumCadence.loadError"));});return()=>{live=false;};},[t]);
 const dirty=!!draft&&!!current&&["durationWeeks","startDay","startTime","endDay","endTime","timeZone"].some(k=>draft[k as keyof Cadence]!==current[k as keyof Cadence]);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 const change=(key:keyof Cadence,value:string|number)=>setDraft(d=>d?{...d,[key]:value}:d);
 async function submit(e:FormEvent){e.preventDefault();if(!draft)return;setBusy(true);setError("");setSuccess(false);
 try{const r=await fetch("/api/admin/scrum-cadence",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({durationWeeks:draft.durationWeeks,startDay:draft.startDay,startTime:draft.startTime,endDay:draft.endDay,endTime:draft.endTime,timeZone:draft.timeZone,revision:current?.revision})});
 const data=await r.json();if(!r.ok){setError(t(r.status===409?"scrumCadence.conflict":"scrumCadence.saveError"));return;}
 setCurrent(data.cadence);setDraft(data.cadence);setSuccess(true);
 }catch{setError(t("scrumCadence.saveError"));}finally{setBusy(false);}
 }
 const days=[1,2,3,4,5,6,7];
 return <section className="smn-panel p-4">
  <h1 className="h3">{t("scrumCadence.title")}</h1>
  <p className="text-secondary">{t("scrumCadence.intro")}</p>
  {draft&&<form onSubmit={submit} className="d-grid gap-3">
   <div><label htmlFor="cadence-weeks" className="form-label">{t("scrumCadence.weeks")}</label>
   <select id="cadence-weeks" className="form-select" disabled={busy} value={draft.durationWeeks} onChange={e=>change("durationWeeks",Number(e.target.value))}>{[1,2,3,4].map(x=><option key={x} value={x}>{x}</option>)}</select></div>
   <div className="row g-3">
    <div className="col-md-6"><label htmlFor="cadence-start-day" className="form-label">{t("scrumCadence.startDay")}</label>
    <select id="cadence-start-day" className="form-select" disabled={busy} value={draft.startDay} onChange={e=>change("startDay",Number(e.target.value))}>{days.map(x=><option key={x} value={x}>{t(`scrumCadence.days.${x}` as "scrumCadence.days.1")}</option>)}</select></div>
    <div className="col-md-6"><label htmlFor="cadence-start-time" className="form-label">{t("scrumCadence.startTime")}</label><input id="cadence-start-time" className="form-control" type="time" required disabled={busy} value={draft.startTime} onChange={e=>change("startTime",e.target.value)}/></div>
    <div className="col-md-6"><label htmlFor="cadence-end-day" className="form-label">{t("scrumCadence.endDay")}</label>
    <select id="cadence-end-day" className="form-select" disabled={busy} value={draft.endDay} onChange={e=>change("endDay",Number(e.target.value))}>{days.map(x=><option key={x} value={x}>{t(`scrumCadence.days.${x}` as "scrumCadence.days.1")}</option>)}</select></div>
    <div className="col-md-6"><label htmlFor="cadence-end-time" className="form-label">{t("scrumCadence.endTime")}</label><input id="cadence-end-time" className="form-control" type="time" required disabled={busy} value={draft.endTime} onChange={e=>change("endTime",e.target.value)}/></div>
   </div>
   <div><label htmlFor="cadence-zone" className="form-label">{t("scrumCadence.timeZone")}</label><input id="cadence-zone" className="form-control" required disabled={busy} value={draft.timeZone} onChange={e=>change("timeZone",e.target.value)}/></div>
   <p className="small text-secondary">{t("scrumCadence.futureOnly")}</p>
   <button type="submit" className="btn btn-primary" disabled={!dirty||busy}>{t("scrumCadence.save")}</button>
   <p className="text-secondary small">{t("scrumCadence.revision",{revision:current?.revision??1})}</p>
  </form>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {success&&<p role="status" className="alert alert-success">{t("scrumCadence.saved")}</p>}
 </section>;
}
