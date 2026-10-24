"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Cadence={frequency:"monthly"|"weekly"|"biweekly";startDay:number;timeZone:string;revision:number;updatedAt:string};
export default function KanbanCadenceForm(){
 const t=useTranslation();
 const [current,setCurrent]=useState<Cadence|null>(null);
 const [draft,setDraft]=useState<Cadence|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);
 useEffect(()=>{
  let live=true;
  fetch("/api/admin/kanban-cadence",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();})
   .then(d=>{if(live){setCurrent(d.cadence);setDraft(d.cadence);}})
   .catch(()=>{if(live)setError(t("kanbanCadence.loadError"));});
  return()=>{live=false;};
 },[t]);
 const dirty=!!draft&&!!current&&(draft.frequency!==current.frequency||draft.startDay!==current.startDay||draft.timeZone!==current.timeZone);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 const change=(key:keyof Cadence,value:string|number)=>setDraft(d=>d?{...d,[key]:value}:d);
 async function submit(e:FormEvent){
  e.preventDefault();if(!draft)return;
  setBusy(true);setError("");setSaved(false);
  try{
   const response=await fetch("/api/admin/kanban-cadence",{method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({frequency:draft.frequency,startDay:draft.startDay,timeZone:draft.timeZone,revision:current?.revision})});
   const data=await response.json();
   if(!response.ok){setError(t(response.status===409?"kanbanCadence.conflict":"kanbanCadence.saveError"));return;}
   setCurrent(data.cadence);setDraft(data.cadence);setSaved(true);
  }catch{setError(t("kanbanCadence.saveError"));}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4">
  <h1 className="h3">{t("kanbanCadence.title")}</h1>
  <p className="text-secondary">{t("kanbanCadence.intro")}</p>
  {draft&&<form onSubmit={submit} className="d-grid gap-3">
   <div><label htmlFor="kanban-frequency" className="form-label">{t("kanbanCadence.frequency")}</label>
    <select id="kanban-frequency" className="form-select" disabled={busy} value={draft.frequency}
     onChange={e=>change("frequency",e.target.value)}>
     {(["monthly","weekly","biweekly"] as const).map(x=><option value={x} key={x}>{t(("kanbanCadence."+x) as "kanbanCadence.monthly")}</option>)}
    </select>
   </div>
   {draft.frequency!=="monthly"&&<div><label htmlFor="kanban-start-day" className="form-label">{t("kanbanCadence.startDay")}</label>
    <select id="kanban-start-day" className="form-select" disabled={busy} value={draft.startDay}
     onChange={e=>change("startDay",Number(e.target.value))}>
     {[1,2,3,4,5,6,7].map(day=><option value={day} key={day}>{t(("kanbanCadence.days."+day) as "kanbanCadence.days.1")}</option>)}
    </select>
   </div>}
   <div><label htmlFor="kanban-zone" className="form-label">{t("kanbanCadence.timeZone")}</label>
    <input id="kanban-zone" className="form-control" disabled={busy} required maxLength={100}
     value={draft.timeZone} onChange={e=>change("timeZone",e.target.value)}/></div>
   <button type="submit" className="btn btn-primary" disabled={!dirty||busy}>{t("kanbanCadence.save")}</button>
   <p className="text-secondary small">{t("kanbanCadence.revision",{revision:current?.revision??1})}</p>
  </form>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {saved&&<p role="status" className="alert alert-success">{t("kanbanCadence.saved")}</p>}
 </section>;
}
