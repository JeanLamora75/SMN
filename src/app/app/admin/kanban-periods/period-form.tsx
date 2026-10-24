"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {periodFromStart,normalizePeriodName} from "@/server/kanban/dates";
type Cadence={frequency:"monthly"|"weekly"|"biweekly";timeZone:string;startDay:number;revision:number};
export default function KanbanPeriodForm({canManage}:{canManage:boolean}){
 const t=useTranslation();
 const [cadence,setCadence]=useState<Cadence|null>(null);
 const [startOn,setStartOn]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [created,setCreated]=useState("");
 const [customName,setCustomName]=useState<string|null>(null);
 const [duplicate,setDuplicate]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch("/api/admin/kanban-periods",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();})
   .then(d=>{if(active){setCadence(d.cadence);setStartOn(d.startOn??"");}})
   .catch(()=>{if(active)setError(t("kanbanPeriod.loadError"));});
  return()=>{active=false;};
 },[t]);
 useUnsavedChanges(busy,t("draft.leaveWarning"));
 let computed:ReturnType<typeof periodFromStart>|null=null;
 try{if(startOn&&cadence)computed=periodFromStart(startOn,cadence.frequency);}catch{/* show validation feedback */}
 async function generate(event:FormEvent){
  event.preventDefault();if(!computed||!canManage||!normalizePeriodName(customName??computed.name))return;
  setBusy(true);setError("");setCreated("");setDuplicate(false);
  try{
   const response=await fetch("/api/admin/kanban-periods",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({startOn,name:customName??computed.name})});
   const data=await response.json();
   if(!response.ok){setError(t(data.error==="overlap"?"kanbanPeriod.overlap":"kanbanPeriod.saveError"));return;}
   setCreated(data.period.name);setDuplicate(!!data.duplicateName);setCustomName(null);
   setStartOn("");
  }catch{setError(t("kanbanPeriod.saveError"));}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4">
  <h1 className="h3">{t("kanbanPeriod.title")}</h1>
  <p className="text-secondary">{t("kanbanPeriod.intro")}</p>
  {cadence&&<form onSubmit={generate} className="d-grid gap-3">
   <div><label className="form-label" htmlFor="kanban-period-quantity">{t("kanbanPeriod.quantity")}</label>
    <input className="form-control" id="kanban-period-quantity" value="1" readOnly/></div>
   <div><label htmlFor="kanban-period-start" className="form-label">{t("kanbanPeriod.startOn")}</label>
    <input id="kanban-period-start" className="form-control" type="date" required disabled={!canManage||busy}
     value={startOn} onChange={e=>{setStartOn(e.target.value);setCustomName("");}}/></div>
   {computed?<div className="border rounded p-3">
    <div className="fw-semibold">{computed.name}</div>
    <div className="small text-secondary">{computed.startOn} → {computed.endOn} · {cadence.timeZone}</div>
   </div>:startOn&&<p role="alert" className="text-danger">{t("kanbanPeriod.invalidStart")}</p>}
   {computed&&<div><label htmlFor="kanban-period-name" className="form-label">Nom de la période</label><input id="kanban-period-name" className="form-control" maxLength={200} disabled={!canManage||busy} value={customName??computed.name} onChange={e=>setCustomName(e.target.value)}/></div>}
   {canManage&&<button className="btn btn-primary" type="submit" disabled={!computed||busy||(customName!==null&&!normalizePeriodName(customName))}>{t("kanbanPeriod.generate")}</button>}
  </form>}
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {duplicate&&<p role="status" className="alert alert-warning">Une autre période porte déjà ce nom. La création a été autorisée.</p>}
  {created&&<p className="alert alert-success" role="status">{t("kanbanPeriod.created")} : {created}</p>}
 </section>;
}
