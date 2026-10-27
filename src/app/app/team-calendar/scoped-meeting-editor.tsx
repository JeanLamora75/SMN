"use client";
import {useState} from "react";
import type {CalendarMeeting} from "./calendar-option-b";

/** Modification des réunions manuelles uniquement ; aucun accès au détail historique. */
export default function ScopedMeetingEditor({meeting,teamId,mode,onClose,onSaved}:{
 meeting:CalendarMeeting;teamId:string;mode:"scrum"|"kanban";
 onClose:()=>void;onSaved:()=>void;
}){
 const local=(s:string)=>{const d=new Date(s);return Number.isFinite(d.getTime())?
  new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):"";};
 const [start,setStart]=useState(local(meeting.startAt));
 const [end,setEnd]=useState(local(meeting.endAt));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const save=async(action:"reschedule"|"cancel")=>{
  if(busy||meeting.status!=="scheduled")return;
  setBusy(true);setError("");
  const previousStart=new Date(meeting.startAt).toISOString();
  const previousEnd=new Date(meeting.endAt).toISOString();
  const payload={teamId,kind:mode,meetingId:meeting.id,action,
   expectedStartAt:previousStart,expectedEndAt:previousEnd,
   ...(action==="reschedule"?{startAt:new Date(start).toISOString(),
    endAt:new Date(end).toISOString()}: {})};
  try{
   const response=await fetch("/api/admin/team-meetings/change",{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   if(!response.ok)throw Error("meeting-change-failed");
   onSaved();onClose();
  }catch{setError("La modification est indisponible ou la réunion a changé.");}
  finally{setBusy(false);}
 };
 const editable=meeting.status==="scheduled";
 return <div className="smn-member-modal-backdrop" role="presentation">
  <div className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-label="Modifier la réunion">
   <h2 className="h5">{meeting.name}</h2>
   <label className="form-label" htmlFor="scoped-meeting-start">Début</label>
   <input id="scoped-meeting-start" type="datetime-local" className="form-control mb-2"
    value={start} onChange={e=>setStart(e.target.value)} disabled={!editable||busy}/>
   <label className="form-label" htmlFor="scoped-meeting-end">Fin</label>
   <input id="scoped-meeting-end" type="datetime-local" className="form-control mb-3"
    value={end} onChange={e=>setEnd(e.target.value)} disabled={!editable||busy}/>
   {error&&<p role="alert" className="alert alert-warning">{error}</p>}
   <div className="d-flex gap-2 justify-content-end">
    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Fermer</button>
    <button type="button" className="btn btn-outline-danger" onClick={()=>void save("cancel")} disabled={!editable||busy}>Annuler la réunion</button>
    <button type="button" className="btn btn-primary" onClick={()=>void save("reschedule")}
     disabled={!editable||busy||!start||!end||Date.parse(start)>=Date.parse(end)}>Enregistrer</button>
   </div>
  </div>
 </div>;
}
