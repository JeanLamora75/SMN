"use client";

import {useEffect,useId,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import RegistryCreate from "./admin/registries/registry-create";

type Kind="obstacles"|"risks"|"events"|"notes";
type Note={text:string;included:boolean;language:"fr"|"en"};
type ReportNotes=Record<string,Note>;
type Draft={notes:ReportNotes;revision:number};
type Sprint={id:string;status:string;startAt:string;endAt:string};

function MeetingQuickForm({sprintId,onSaved}:{sprintId:string;onSaved:()=>void}){
 const t=useTranslation();
 const [sprint,setSprint]=useState<Sprint|null>(null);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState("");
 const [when,setWhen]=useState("");
 const [duration,setDuration]=useState(60);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/team-calendar/periods",{cache:"no-store",signal:ctrl.signal})
   .then(async res=>{if(!res.ok)throw Error();return res.json() as Promise<{sprints:Sprint[]}>;})
   .then(data=>{if(!ctrl.signal.aborted)setSprint(data.sprints.find(s=>s.id===sprintId&&s.status!=="closed")??null);})
   .catch(()=>{if(!ctrl.signal.aborted)setError(t("dashboard.operational.quickAdd.unavailable"));})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
  return()=>ctrl.abort();
 },[sprintId,t]);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();
  if(!sprint||busy)return;
  setBusy(true);setError("");
  try{
   const instant=new Date(when);
   if(!when||!Number.isFinite(instant.getTime())||
      instant.getTime()<Date.parse(sprint.startAt)||
      instant.getTime()+duration*60000>Date.parse(sprint.endAt)){
    setError(t("dashboard.operational.quickAdd.invalidDate"));return;
   }
   const response=await fetch("/api/admin/sprints/exceptional-meetings",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,name:name.trim(),startAt:instant.toISOString(),duration})
   });
   if(!response.ok)throw Error();
   onSaved();
  }catch{setError(t("calendarUX.saveFailed"));}
  finally{setBusy(false);}
 };
 return <form className="d-grid gap-3" onSubmit={e=>void submit(e)}>
  {loading&&<p role="status">{t("dashboard.operational.quickAdd.loading")}</p>}
  {!loading&&!sprint&&<p role="alert" className="alert alert-warning">{t("calendarUX.requiresSprint")}</p>}
  <label className="form-label">{t("calendarUX.meetingName")}
   <input className="form-control" value={name} onChange={e=>setName(e.target.value)}
    maxLength={160} required disabled={!sprint||busy}/>
  </label>
  <label className="form-label">{t("calendarUX.startTime")}
   <input className="form-control" type="datetime-local" value={when}
    onChange={e=>setWhen(e.target.value)} required disabled={!sprint||busy}/>
  </label>
  <label className="form-label">{t("calendarUX.duration")}
   <input className="form-control" type="number" min={1} max={480} value={duration}
    onChange={e=>setDuration(Number(e.target.value))} required disabled={!sprint||busy}/>
  </label>
  {error&&<p role="alert" className="alert alert-danger">{error}</p>}
  <button type="submit" className="btn btn-primary justify-self-end"
   disabled={!sprint||busy||!name.trim()}>{t("calendarUX.create")}</button>
 </form>;
}

function NoteQuickForm({sprintId,onSaved}:{sprintId:string;onSaved:()=>void}){
 const t=useTranslation();
 const [draft,setDraft]=useState<Draft|null>(null);
 const [content,setContent]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/notes",{
   cache:"no-store",signal:ctrl.signal
  }).then(async res=>{if(!res.ok)throw Error();return res.json() as Promise<Draft>;})
   .then(value=>{
    if(!ctrl.signal.aborted&&value.notes?.attention&&Number.isSafeInteger(value.revision))
     setDraft(value);
    else if(!ctrl.signal.aborted)throw Error();
   })
   .catch(()=>{if(!ctrl.signal.aborted)setError(t("dashboard.operational.quickAdd.unavailable"));});
  return()=>ctrl.abort();
 },[sprintId,t]);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();
  if(!draft||busy||!content.trim())return;
  setError("");setBusy(true);
  const existing=draft.notes.attention.text;
  // Le contrat existant sauvegarde les notes de rapport par section.
  // Ajouter sans effacer les notes précédentes ni les autres sections.
  const next=existing?existing+"\n\n"+content.trim():content.trim();
  if(next.length>5000){
   setError(t("dashboard.operational.quickAdd.noteTooLong"));setBusy(false);return;
  }
  try{
   const notes={...draft.notes,attention:{...draft.notes.attention,text:next,included:true}};
   const response=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/notes",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({notes,revision:draft.revision})
   });
   if(!response.ok)throw Error();
   onSaved();
  }catch{setError(t("dashboard.operational.quickAdd.saveFailed"));}
  finally{setBusy(false);}
 };
 return <form className="d-grid gap-3" onSubmit={e=>void submit(e)}>
  <p className="small text-body-secondary">{t("dashboard.operational.quickAdd.noteDestination")}</p>
  <label className="form-label">{t("dashboard.operational.quickAdd.noteContent")}
   <textarea className="form-control" rows={5} maxLength={5000} required
    value={content} onChange={e=>setContent(e.target.value)} disabled={!draft||busy}/>
  </label>
  {error&&<p role="alert" className="alert alert-danger">{error}</p>}
  {!draft&&!error&&<p role="status">{t("dashboard.operational.quickAdd.loading")}</p>}
  <button type="submit" className="btn btn-primary justify-self-end"
   disabled={!draft||busy||!content.trim()}>{t("dashboard.operational.quickAdd.save")}</button>
 </form>;
}


function QuickAddContent({kind,teamId,cycleId,close}:{
 kind:Kind;teamId:string;cycleId:string;close:()=>void;
}){
 const router=useRouter();
 const saved=()=>{close();router.refresh();};
 return kind==="obstacles"||kind==="risks"?
  <RegistryCreate teamId={teamId} canManage
   initialType={kind==="risks"?"risk":"obstacle"} modalMode onCreated={saved}/>:
  kind==="events"?<MeetingQuickForm sprintId={cycleId} onSaved={saved}/>:
   <NoteQuickForm sprintId={cycleId} onSaved={saved}/>;
}

/** Modale native : focus piégé dans la fenêtre, Escape et retour du focus gérés par showModal. */
export default function OperationalQuickAdd({kind,teamId,cycleId,label}:{kind:Kind;
 teamId:string;cycleId:string;label:string;
}){
 const t=useTranslation(),modalId=useId();
 const dialog=useRef<HTMLDialogElement>(null);
 const [opened,setOpened]=useState(false);
 useEffect(()=>{
  if(opened&&dialog.current&&!dialog.current.open)dialog.current.showModal();
 },[opened]);
 const close=()=>dialog.current?.close();
 return <>
  <button className="smn-operational-create-link" type="button" onClick={()=>setOpened(true)}>
   {label}
  </button>
  {opened&&<dialog ref={dialog} className="smn-operational-create-dialog" aria-labelledby={modalId}
    onClose={()=>setOpened(false)}>
   <div className="smn-operational-create-dialog-inner">
    <header className="d-flex justify-content-between align-items-center gap-3 mb-3">
     <h2 className="h5 m-0" id={modalId}>{label}</h2>
     <button type="button" className="btn-close" aria-label={t("dashboard.operational.quickAdd.close")}
      onClick={close}/>
    </header>
    <QuickAddContent kind={kind} teamId={teamId} cycleId={cycleId} close={close}/>
    <div className="d-flex justify-content-end mt-3">
     <button type="button" className="btn btn-outline-secondary" onClick={close}>
      {t("dashboard.operational.quickAdd.cancel")}
     </button>
    </div>
   </div>
  </dialog>}
 </>;
}
