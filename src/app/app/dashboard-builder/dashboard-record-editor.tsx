"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import RegistryEditModal from "../admin/registries/registry-edit-modal";
import RegistrySectionDialog from "../admin/registries/registry-section-dialog";
import CalendarMeetingModal from "../team-calendar/calendar-meeting-modal";
import "../team-calendar/calendar-cockpit.css";
import "../admin/registries/registry-cockpit.css";
import type {CalendarMeeting} from "../team-calendar/calendar-option-b";

type Entry={id:string;kind:string;label:string;cycleId:string};
type Note={id:string;body:string;status:string};

/** Registry forms reuse their full, audited editor; notes use their own audited API. */
export default function DashboardRecordEditor({entry,teamId,onDismiss,onSaved}:{
 entry:Entry;teamId:string;onDismiss:()=>void;onSaved:()=>void;
}){
 const t=useTranslation();
 const [note,setNote]=useState<Note|null>(null);
 const [body,setBody]=useState("");
 const [status,setStatus]=useState("open");
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const isNote=entry.kind==="note";
 useEffect(()=>{
  if(!isNote)return;
  const ctrl=new AbortController();
  const params=new URLSearchParams({teamId,sprintId:entry.cycleId});
  void fetch("/api/admin/dashboard/notes/"+encodeURIComponent(entry.id)+"?"+params,
   {cache:"no-store",signal:ctrl.signal})
   .then(async response=>{if(!response.ok)throw Error("unavailable");
    return response.json() as Promise<{note:Note}>;})
   .then(result=>{if(ctrl.signal.aborted)return;
    if(!result.note||result.note.id!==entry.id||!["open","done"].includes(result.note.status))
     throw Error("invalid");
    setNote(result.note);setBody(result.note.body);setStatus(result.note.status);
   }).catch(()=>{if(!ctrl.signal.aborted)setError(t("dashboard.operational.quickAdd.unavailable"));})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
  return()=>ctrl.abort();
 },[isNote,entry.id,entry.cycleId,teamId,t]);
 if(["ceremony","template","exceptional"].includes(entry.kind)){
  const meeting:CalendarMeeting={id:entry.id,kind:entry.kind,name:entry.label,
   startAt:"",endAt:"",href:"/app/team-calendar"};
  return <CalendarMeetingModal meeting={meeting} isAdmin teamId={teamId} onClose={onDismiss} onSaved={onSaved}/>;
 }
 if(!isNote)return <RegistryEditModal id={entry.id} teamId={teamId}
  onDismiss={onDismiss} onSaved={onSaved}/>;
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!note||busy||!body.trim())return;
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/dashboard/notes/"+encodeURIComponent(entry.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,sprintId:entry.cycleId,text:body.trim(),status,
     expectedBody:note.body,expectedStatus:note.status})
   });
   if(!response.ok)throw Error(response.status===409?"conflict":"unavailable");
   onSaved();
  }catch(error){
   setError(error instanceof Error&&error.message==="conflict"?
    t("dashboard.operational.quickAdd.saveFailed"):t("dashboard.operational.quickAdd.unavailable"));
  }finally{setBusy(false);}
 };
 return <RegistrySectionDialog wide title={entry.label} onDismiss={onDismiss} submitFormId="dashboard-note-edit">
  {loading?<p role="status">{t("dashboard.operational.quickAdd.loading")}</p>:
   error&&!note?<p role="alert" className="alert alert-warning">{error}</p>:
   <form id="dashboard-note-edit" onSubmit={save} className="d-grid gap-3">
    <label className="form-label">{t("dashboard.operational.quickAdd.noteContent")}
     <textarea className="form-control" rows={7} maxLength={2000} required
      value={body} onChange={e=>setBody(e.target.value)} disabled={busy}/>
    </label>
    <label className="form-label">{t("registryCreate.status")}
     <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}
      disabled={busy}>
      <option value="open">{t("registryCreate.open")}</option>
      <option value="done">{t("registryCreate.completed")}</option>
     </select>
    </label>
    {error&&<p role="alert" className="alert alert-danger">{error}</p>}
   </form>}
 </RegistrySectionDialog>;
}
