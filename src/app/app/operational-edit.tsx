"use client";
import {useEffect,useId,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {createPortal} from "react-dom";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import {dashboardLocalValue,dashboardLocalToIso} from "@/lib/dashboard-local-datetime";
import type {DashboardAttention,DashboardEvent} from "@/lib/dashboard-data-contract";
import RegistryCreate from "./admin/registries/registry-create";
import BootstrapIcon from "./bootstrap-icon";
type Kind="registry"|"event"|"note"|"configuration";
type Props={kind:Kind;id:string;title:string;teamId:string;cycleId:string;canManage:boolean;
 status?:string;eventKind?:DashboardEvent["kind"];configurationKey?:DashboardAttention["configurationKey"];
 timeZone?:string;href?:string;className?:string;actionIcon?:boolean};
type Note={id:string;body:string;status:string};
type Event={id:string;kind:DashboardEvent["kind"];title:string;startsAt:string;endsAt:string;
 duration:number;actualMinutes:number|null;status:string;editable:boolean};

function NoteForm({id,teamId,cycleId,canManage,saved}:{
 id:string;teamId:string;cycleId:string;canManage:boolean;saved:()=>void;
}){
 const t=useTranslation();
 const [initial,setInitial]=useState<Note|null>(null);
 const [body,setBody]=useState(""),[status,setStatus]=useState("open");
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  const query=new URLSearchParams({teamId,sprintId:cycleId});
  void fetch("/api/admin/dashboard/notes/"+encodeURIComponent(id)+"?"+query,{
   cache:"no-store",signal:ctrl.signal
  }).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{note:Note}>;})
   .then(({note})=>{if(!ctrl.signal.aborted){setInitial(note);setBody(note.body);setStatus(note.status);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError(t("dashboard.operational.edit.loadError"));})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
  return()=>ctrl.abort();
 },[id,teamId,cycleId,t]);
 const save=async(e:FormEvent)=>{
  e.preventDefault();if(!initial||!canManage||busy)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/dashboard/notes/"+encodeURIComponent(id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,sprintId:cycleId,text:body.trim(),status,
     expectedBody:initial.body,expectedStatus:initial.status})
   });
   if(!response.ok){setError(t(response.status===409?
    "dashboard.operational.edit.conflict":"dashboard.operational.edit.saveError"));return;}
   saved();
  }catch{setError(t("dashboard.operational.edit.saveError"));}
  finally{setBusy(false);}
 };
 if(loading)return <p role="status">{t("dashboard.operational.quickAdd.loading")}</p>;
 if(!initial)return <p role="alert" className="alert alert-warning">{error}</p>;
 return <form className="d-grid gap-3" onSubmit={e=>void save(e)}>
  <label className="form-label">{t("dashboard.operational.edit.content")}
   <textarea className="form-control" rows={5} maxLength={2000} required
    value={body} onChange={e=>setBody(e.target.value)} disabled={!canManage||busy}/>
  </label>
  <label className="form-label">{t("dashboard.operational.edit.status")}
   <select className="form-select" value={status} disabled={!canManage||busy}
    onChange={e=>setStatus(e.target.value)}>
    <option value="open">{t("registryCreate.open")}</option>
    <option value="done">{t("configuration.status.done")}</option>
   </select>
  </label>
  {error&&<p role="alert" className="alert alert-danger">{error}</p>}
  {canManage&&<button type="submit" className="btn btn-primary" disabled={busy||!body.trim()}>
   {t("common.save")}</button>}
 </form>;
}

const tasks={
 "reference-country":{title:"configuration.tasks.referenceCountry.title",
  description:"configuration.tasks.referenceCountry.description"},
 "recovery-phrase":{title:"configuration.tasks.recoveryPhrase.title",
  description:"configuration.tasks.recoveryPhrase.description"},
 "display-preferences":{title:"configuration.tasks.displayPreferences.title",
  description:"configuration.tasks.displayPreferences.description"}
} as const;
function ConfigurationForm({configurationKey,status:original,canManage,saved}:{
 configurationKey:NonNullable<Props["configurationKey"]>;status:string;canManage:boolean;saved:()=>void;
}){
 const t=useTranslation();
 const [status,setStatus]=useState(original),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const task=tasks[configurationKey];
 const save=async(e:FormEvent)=>{
  e.preventDefault();if(!canManage||busy)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/configuration-tasks",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({key:configurationKey,status})
   });
   if(!r.ok)throw Error();saved();
  }catch{setError(t("dashboard.operational.edit.saveError"));}
  finally{setBusy(false);}
 };
 return <form className="d-grid gap-3" onSubmit={e=>void save(e)}>
  <p className="mb-0">{t(task.description)}</p>
  <label className="form-label">{t("dashboard.operational.edit.status")}
   <select className="form-select" value={status} disabled={!canManage||busy}
    onChange={e=>setStatus(e.target.value)}>
    <option value="todo">{t("configuration.status.todo")}</option>
    <option value="done">{t("configuration.status.done")}</option>
    <option value="ignored">{t("configuration.status.ignored")}</option>
   </select>
  </label>
  {error&&<p role="alert" className="alert alert-danger">{error}</p>}
  {canManage&&<button type="submit" disabled={busy} className="btn btn-primary">
   {t("common.save")}</button>}
 </form>;
}
function EventForm({id,kind,teamId,cycleId,timeZone,canManage,saved}:{
 id:string;kind:DashboardEvent["kind"];teamId:string;cycleId:string;timeZone:string;
 canManage:boolean;saved:()=>void;
}){
 const t=useTranslation();
 const [initial,setInitial]=useState<Event|null>(null);
 const [title,setTitle]=useState(""),[when,setWhen]=useState("");
 const [duration,setDuration]=useState(15),[status,setStatus]=useState("");
 const [actualMinutes,setActualMinutes]=useState<number|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  const params=new URLSearchParams({teamId,sprintId:cycleId});
  void fetch("/api/admin/dashboard/events/"+kind+"/"+encodeURIComponent(id)+"?"+params,{
   cache:"no-store",signal:ctrl.signal
  }).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{event:Event}>;})
   .then(({event})=>{if(!ctrl.signal.aborted){
    setInitial(event);setTitle(event.title);setWhen(dashboardLocalValue(event.startsAt,timeZone));
    setDuration(event.duration);setActualMinutes(event.actualMinutes);setStatus(["scheduled","held","not_held","cancelled"].includes(event.status)?
     event.status:"");
   }}).catch(()=>{if(!ctrl.signal.aborted)setError(t("dashboard.operational.edit.loadError"));})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
  return()=>ctrl.abort();
 },[id,kind,teamId,cycleId,timeZone,t]);
 const save=async(e:FormEvent)=>{
  e.preventDefault();if(!initial||!canManage||!initial.editable||busy)return;
  const startAt=dashboardLocalToIso(when,timeZone,initial.startsAt);
  if(!startAt){setError(t("dashboard.operational.edit.invalidDate"));return;}
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/admin/dashboard/events/"+kind+"/"+encodeURIComponent(id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,sprintId:cycleId,title:title.trim(),startAt,duration,status,
     actualMinutes,expectedActualMinutes:initial.actualMinutes,
     expectedTitle:initial.title,expectedStartAt:initial.startsAt,
     expectedEndAt:initial.endsAt,expectedStatus:initial.status})
   });
   if(!res.ok){setError(t(res.status===409?
    "dashboard.operational.edit.conflict":"dashboard.operational.edit.saveError"));return;}
   saved();
  }catch{setError(t("dashboard.operational.edit.saveError"));}
  finally{setBusy(false);}
 };
 if(loading)return <p role="status">{t("dashboard.operational.quickAdd.loading")}</p>;
 if(!initial)return <p role="alert" className="alert alert-warning">{error}</p>;
 const readonly=!canManage||!initial.editable;
 return <form className="d-grid gap-3" onSubmit={e=>void save(e)}>
  {!initial.editable&&<p className="alert alert-info">{t("dashboard.operational.edit.closed")}</p>}
  <label className="form-label">{t("dashboard.operational.edit.title")}
   <input className="form-control" required maxLength={160} value={title}
    disabled={readonly||kind==="ceremony"||busy} onChange={e=>setTitle(e.target.value)}/>
  </label>
  <label className="form-label">{t("dashboard.operational.edit.start")} ({timeZone})
   <input className="form-control" type="datetime-local" required value={when}
    disabled={readonly||busy} onChange={e=>setWhen(e.target.value)}/>
  </label>
  <label className="form-label">{t("dashboard.operational.edit.duration")}
   <input className="form-control" type="number" min={1} max={kind==="ceremony"?600:480} required value={duration}
    disabled={readonly||busy} onChange={e=>setDuration(Number(e.target.value))}/>
  </label>
  <label className="form-label">{t("sprintDetail.ceremonyActualDuration")}
   <input className="form-control" type="number" min={0} max={1440} step={1}
    value={actualMinutes??""} disabled={readonly||busy}
    placeholder={t("sprintDetail.ceremonyNotRecorded")}
    onChange={e=>setActualMinutes(e.target.value===""?null:Number(e.target.value))}/>
  </label>
  <label className="form-label">{t("dashboard.operational.edit.status")}
   <select className="form-select" value={status} disabled={readonly||busy}
    onChange={e=>setStatus(e.target.value)}>
    {status===""&&<option value="">{t("dashboard.operational.eventUnknown")}</option>}
    <option value="scheduled">{t("dashboard.operational.eventScheduled")}</option>
    <option value="held">{t("dashboard.operational.eventHeld")}</option>
    <option value="not_held">{t("dashboard.operational.edit.notHeld")}</option>
    <option value="cancelled">{t("dashboard.operational.eventCancelled")}</option>
   </select>
  </label>
  {error&&<p role="alert" className="alert alert-danger">{error}</p>}
  {!readonly&&<button type="submit" className="btn btn-primary"
    disabled={busy||!title.trim()||!status}>{t("common.save")}</button>}
 </form>;
}

function EditBody({props,close}:{props:Props;close:()=>void}){
 const router=useRouter();
 const saved=()=>{close();router.refresh();};
 return <>
    {props.kind==="registry"?
      <RegistryCreate teamId={props.teamId} canManage={props.canManage} itemId={props.id}
        modalMode onSaved={saved}/>:
     props.kind==="note"?
      <NoteForm id={props.id} teamId={props.teamId} cycleId={props.cycleId}
       canManage={props.canManage} saved={saved}/>:
     props.kind==="event"&&props.eventKind?
      <EventForm id={props.id} kind={props.eventKind} teamId={props.teamId}
       cycleId={props.cycleId} timeZone={props.timeZone??"Europe/Paris"}
       canManage={props.canManage} saved={saved}/>:
     props.configurationKey?
      <ConfigurationForm configurationKey={props.configurationKey} status={props.status??"todo"}
       canManage={props.canManage} saved={saved}/>:null}
 </>;
}

/** Le titre déclenche une modale native ; la navigation vers la fiche reste accessible séparément. */
export default function OperationalEdit(props:Props){
 const t=useTranslation(),dialogId=useId();
 const ref=useRef<HTMLDialogElement>(null),[opened,setOpened]=useState(false);
 useEffect(()=>{if(opened&&ref.current&&!ref.current.open)ref.current.showModal();},[opened]);
 const close=()=>ref.current?.close();
 return <>
  <span className="smn-operational-edit-wrap">
  <button type="button" className={props.actionIcon?
   props.className??"smn-sprint-ceremony-edit":(props.className??"")+" smn-operational-edit-trigger"}
   onClick={()=>setOpened(true)} aria-haspopup="dialog"
   aria-label={props.actionIcon?t("sprintDetail.ceremonyEdit")+" : "+props.title:undefined}
   title={props.actionIcon?t("sprintDetail.ceremonyEdit")+" : "+props.title:undefined}>
   {props.actionIcon?<BootstrapIcon name="pencil-square"/>:props.title}
  </button>
  {props.href&&<Link href={props.href} className="smn-operational-source-link"
    aria-label={t("dashboard.operational.edit.openPage")} title={t("dashboard.operational.edit.openPage")}>
    <BootstrapIcon name="arrow-right"/>
   </Link>}
  </span>
  {opened&&typeof document!=="undefined"&&createPortal(<dialog ref={ref} className="smn-operational-create-dialog"
    aria-labelledby={dialogId} onClose={()=>setOpened(false)}>
   <div className="smn-operational-create-dialog-inner">
    <header className="d-flex align-items-center justify-content-between gap-3 mb-3">
     <h2 className="h5 mb-0" id={dialogId}>{t("dashboard.operational.edit.heading")}: {props.title}</h2>
     <button type="button" className="btn-close" aria-label={t("dashboard.operational.quickAdd.close")}
      onClick={close}/>
    </header>
    <EditBody props={props} close={close}/>
    <div className="d-flex justify-content-end mt-3">
     <button type="button" className="btn btn-outline-secondary" onClick={close}>
      {t("dashboard.operational.quickAdd.cancel")}</button>
    </div>
   </div>
  </dialog>,document.body)}
 </>;
}
