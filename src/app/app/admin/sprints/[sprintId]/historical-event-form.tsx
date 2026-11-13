"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";

type HistoricalRow={id:string;name:string;kind:string;status:string;startAt:string;createdAt:string};
const kinds=["planning","daily","review","retrospective","other"] as const;
const statuses=["unknown","held","not_held","cancelled"] as const;

export default function HistoricalEventForm({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const router=useRouter();
 const dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false),[name,setName]=useState(""),[kind,setKind]=useState("review");
 const [at,setAt]=useState(""),[duration,setDuration]=useState(60),[status,setStatus]=useState("unknown");
 const [error,setError]=useState(""),[success,setSuccess]=useState(""),[busy,setBusy]=useState(false);
 const [events,setEvents]=useState<HistoricalRow[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [editName,setEditName]=useState(""),[editStatus,setEditStatus]=useState("unknown");
 const tr=(key:keyof typeof labels)=>t(("historicalMeeting."+key) as Parameters<typeof t>[0]);
 const labels={add:1,title:1,close:1,intro:1,name:1,kind:1,date:1,duration:1,status:1,save:1,saving:1,cancel:1,eventList:1,correct:1,correctName:1,correctStatus:1,actualDate:1,recordDate:1,provenance:1,invalidDate:1,outsideSprint:1,createFailed:1,created:1,corrected:1,correctFailed:1,unavailable:1,planning:1,daily:1,review:1,retrospective:1,other:1,unknown:1,held:1,not_held:1,cancelled:1} as const;
 const statusText=(value:string)=>statuses.includes(value as typeof statuses[number])?tr(value as typeof statuses[number]):value;
 const kindText=(value:string)=>kinds.includes(value as typeof kinds[number])?tr(value as typeof kinds[number]):value;
 const reload=useCallback(async ()=>{
  const response=await fetch("/api/admin/sprints/"+encodeURIComponent(sprintId)+"/historical-events",{cache:"no-store"});
  if(response.ok)setEvents((await response.json() as {events:HistoricalRow[]}).events);
 },[sprintId]);
 useEffect(()=>{void Promise.resolve().then(reload);},[reload]);
 useEffect(()=>{
  const current=dialog.current;
  if(open&&current&&!current.open)current.showModal();
  return()=>{if(current?.open)current.close();};
 },[open]);
 const dismiss=()=>{if(!busy){setOpen(false);setEditing(null);setError("");}};
 async function saveCorrection(){
  if(!editing||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/sprints/historical-events/"+encodeURIComponent(editing),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:editName,status:editStatus})});
   if(!response.ok)throw Error();
   setEditing(null);await reload();router.refresh();setSuccess(tr("corrected"));
  }catch{setError(tr("correctFailed"));}
  finally{setBusy(false);}
 }
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError("");setSuccess("");
  const instant=new Date(at);
  if(!Number.isFinite(instant.valueOf())){setError(tr("invalidDate"));return;}
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/historical-events",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,name,kind,startAt:instant.toISOString(),duration,status})});
   if(!response.ok){
    const result=await response.json() as {error?:string};
    setError(result.error==="outside-sprint"?tr("outsideSprint"):tr("createFailed"));return;
   }
   setSuccess(tr("created"));setOpen(false);await reload();router.refresh();
  }catch{setError(tr("unavailable"));}
  finally{setBusy(false);}
 }
 return <>
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>{setError("");setSuccess("");setOpen(true);}} aria-haspopup="dialog" aria-expanded={open}>{tr("add")}</button>
  {error&&!open&&<p className="alert alert-warning mb-0" role="alert">{error}</p>}
  {success&&!open&&<p className="alert alert-success mb-0" role="status">{success}</p>}
  {open&&<dialog ref={dialog} className="smn-sprint-edit-dialog smn-historical-meeting-dialog" aria-labelledby="smn-historical-meeting-title" onCancel={e=>{if(busy)e.preventDefault();else dismiss();}} onClose={dismiss}>
   <div className="modal-content smn-cockpit-modal">
    <div className="smn-cockpit-modal-header">
     <h2 id="smn-historical-meeting-title" className="h5 mb-0">{tr("title")}</h2>
     <button type="button" className="btn-close" disabled={busy} aria-label={tr("close")} onClick={dismiss}/>
    </div>
    <div className="smn-cockpit-modal-body">
     <form className="row g-3" onSubmit={submit}>
      <p className="small text-secondary mb-0">{tr("intro")}</p>
      <div className="col-md-6"><label className="form-label" htmlFor="historical-meeting-name">{tr("name")}</label>
       <input id="historical-meeting-name" autoFocus className="form-control" required maxLength={160} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></div>
      <div className="col-md-6"><label className="form-label" htmlFor="historical-meeting-kind">{tr("kind")}</label>
       <select id="historical-meeting-kind" className="form-select" value={kind} disabled={busy} onChange={e=>setKind(e.target.value)}>
        {kinds.map(item=><option key={item} value={item}>{tr(item)}</option>)}
       </select></div>
      <div className="col-md-6"><label className="form-label" htmlFor="historical-meeting-at">{tr("date")}</label>
       <input id="historical-meeting-at" type="datetime-local" className="form-control" required value={at} disabled={busy} onChange={e=>setAt(e.target.value)}/></div>
      <div className="col-md-3"><label className="form-label" htmlFor="historical-meeting-duration">{tr("duration")}</label>
       <input id="historical-meeting-duration" type="number" className="form-control" min={1} max={480} required value={duration} disabled={busy} onChange={e=>setDuration(Number(e.target.value))}/></div>
      <div className="col-md-3"><label className="form-label" htmlFor="historical-meeting-status">{tr("status")}</label>
       <select id="historical-meeting-status" className="form-select" value={status} disabled={busy} onChange={e=>setStatus(e.target.value)}>
        {statuses.map(item=><option key={item} value={item}>{tr(item)}</option>)}
       </select></div>
      {error&&<p className="col-12 alert alert-warning mb-0" role="alert">{error}</p>}
      {success&&<p className="col-12 alert alert-success mb-0" role="status">{success}</p>}
      <div className="col-12 d-flex justify-content-end gap-2">
       <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={dismiss}>{tr("cancel")}</button>
       <button type="submit" className="btn btn-primary" disabled={busy||!name.trim()}>{busy?tr("saving"):tr("save")}</button>
      </div>
     </form>
     {events.length>0&&<section className="mt-4 border-top pt-3">
      <h3 className="h6">{tr("eventList")}</h3>
      {events.map(event=><div className="border rounded p-2 mb-2" key={event.id}>
       {editing===event.id?<div className="d-flex gap-2 flex-wrap">
        <input className="form-control flex-grow-1" aria-label={tr("correctName")} maxLength={160} value={editName} disabled={busy} onChange={e=>setEditName(e.target.value)}/>
        <select className="form-select w-auto" aria-label={tr("correctStatus")} value={editStatus} disabled={busy} onChange={e=>setEditStatus(e.target.value)}>
         {statuses.map(item=><option key={item} value={item}>{tr(item)}</option>)}
        </select>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy||!editName.trim()} onClick={()=>void saveCorrection()}>{tr("save")}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={()=>setEditing(null)}>{tr("cancel")}</button>
       </div>:<div className="d-flex justify-content-between gap-2 align-items-center">
        <div><strong>{event.name}</strong> <span className="small text-secondary">({kindText(event.kind)})</span>
         <div className="small">{tr("actualDate")}: {event.startAt} · {tr("recordDate")}: {event.createdAt}</div>
         <div className="small">{tr("status")}: {statusText(event.status)} · {tr("provenance")}</div>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{setEditing(event.id);setEditName(event.name);setEditStatus(event.status);}}>{tr("correct")}</button>
       </div>}
      </div>)}
     </section>}
    </div>
   </div>
  </dialog>}
 </>;
}
