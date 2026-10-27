"use client";
import {useEffect,useState} from "react";
import type {CalendarMeeting} from "./calendar-option-b";
import {formatCalendarLocalTime,resolveCalendarLocalTime} from "@/lib/calendar-local-time";
type Detail={id:string;name:string;startAt:string;endAt:string;status:string;revision:number|null;timeZone:string;sprintStatus:string;plannedMinutes:number;actualMinutes:number|null};
export default function ScopedCeremonyDetail({meeting,teamId,onClose,onSaved}:{
 meeting:CalendarMeeting;teamId:string;onClose:()=>void;onSaved?:()=>void;
}){
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState(false);
 const [saveError,setSaveError]=useState("");
 const [busy,setBusy]=useState(false);
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [attendance,setAttendance]=useState<"held"|"not_held"|"cancelled">("held");
 const [reason,setReason]=useState("");
 const [actualMinutes,setActualMinutes]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const url="/api/admin/team-calendar/meetings/"+encodeURIComponent(meeting.kind)+"/"+
   encodeURIComponent(meeting.id)+"?"+new URLSearchParams({teamId});
  void fetch(url,{cache:"no-store",signal:controller.signal})
   .then(async res=>{if(!res.ok)throw Error("unavailable");return res.json() as Promise<{meeting:Detail}>;})
   .then(data=>{if(!controller.signal.aborted&&data.meeting?.id===meeting.id){
    setDetail(data.meeting);
    setStart(formatCalendarLocalTime(data.meeting.startAt,data.meeting.timeZone));
    setEnd(formatCalendarLocalTime(data.meeting.endAt,data.meeting.timeZone));
    setActualMinutes(data.meeting.actualMinutes??data.meeting.plannedMinutes);
   }})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return ()=>controller.abort();
 },[meeting.id,meeting.kind,teamId]);
 const editable=!!detail&&meeting.kind==="ceremony"&&detail.revision!==null&&
  detail.sprintStatus!=="closed"&&detail.status!=="cancelled";
 const save=async()=>{
  if(!editable||!detail||busy)return;
  const startAt=resolveCalendarLocalTime(start,detail.timeZone);
  const endAt=resolveCalendarLocalTime(end,detail.timeZone);
  if(!startAt||!endAt||Date.parse(endAt)<=Date.parse(startAt)){
   setSaveError("Plage horaire invalide.");return;
  }
  setBusy(true);setSaveError("");
  try{
   const res=await fetch("/api/admin/team-calendar/ceremonies/reschedule",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,ceremonyId:detail.id,revision:detail.revision,startAt,endAt})});
   if(!res.ok)throw Error("save");
   onSaved?.();onClose();
  }catch{setSaveError("Modification indisponible ou en conflit.");}
  finally{setBusy(false);}
 };
 const saveAttendance=async()=>{
  if(!editable||!detail||busy||!Number.isSafeInteger(actualMinutes)||
    actualMinutes<0||actualMinutes>1440||reason.length>1000)return;
  setBusy(true);setSaveError("");
  try{
   const response=await fetch("/api/admin/team-calendar/ceremonies/attendance",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,ceremonyId:detail.id,revision:detail.revision,
     status:attendance,reason,actualMinutes})
   });
   if(!response.ok)throw Error("attendance");
   onSaved?.();onClose();
  }catch{setSaveError("Enregistrement de la présence indisponible ou en conflit.");}
  finally{setBusy(false);}
 };
 return <div className="smn-member-modal-backdrop" role="presentation">
  <section className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-label="Détail de cérémonie">
   {error&&<p role="alert">Détail indisponible.</p>}
   {!error&&!detail&&<p role="status">Chargement…</p>}
   {detail&&<><h2 className="h5">{detail.name}</h2>
    <p>{detail.startAt} — {detail.endAt}</p><p>Statut : {detail.status}</p>
    {editable&&<><label className="form-label" htmlFor="scoped-ceremony-start">Début</label>
     <input id="scoped-ceremony-start" className="form-control mb-2" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} disabled={busy}/>
     <label className="form-label" htmlFor="scoped-ceremony-end">Fin</label>
     <input id="scoped-ceremony-end" className="form-control mb-2" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} disabled={busy}/>
     <button type="button" className="btn btn-primary me-2" disabled={busy||!start||!end} onClick={()=>void save()}>Enregistrer</button></>}
    {editable&&<div className="mt-3"><h3 className="h6">Suivi de la cérémonie</h3>
     <label className="form-label" htmlFor="scoped-ceremony-attendance">Statut</label>
     <select id="scoped-ceremony-attendance" className="form-select mb-2" value={attendance} onChange={e=>setAttendance(e.target.value as "held"|"not_held"|"cancelled")} disabled={busy}>
      <option value="held">Tenue</option><option value="not_held">Non tenue</option><option value="cancelled">Annulée</option>
     </select>
     <label className="form-label" htmlFor="scoped-ceremony-actual">Durée réelle (minutes)</label>
     <input id="scoped-ceremony-actual" type="number" min={0} max={1440} step={1} className="form-control mb-2" value={actualMinutes} onChange={e=>setActualMinutes(Number(e.target.value))} disabled={busy}/>
     <label className="form-label" htmlFor="scoped-ceremony-reason">Motif</label>
     <textarea id="scoped-ceremony-reason" maxLength={1000} className="form-control mb-2" value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/>
     <button type="button" className="btn btn-primary" onClick={()=>void saveAttendance()} disabled={busy||!Number.isSafeInteger(actualMinutes)||actualMinutes<0||actualMinutes>1440}>Enregistrer le suivi</button>
    </div>}
    {!editable&&<p>Consultation uniquement : modification indisponible pour cette occurrence.</p>}</>}
   {saveError&&<p role="alert" className="alert alert-warning">{saveError}</p>}
   <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Fermer</button>
  </section>
 </div>;
}
