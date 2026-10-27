"use client";
import {useEffect,useState} from "react";
import type {CalendarMeeting} from "./calendar-option-b";
type Detail={id:string;name:string;startAt:string;endAt:string;status:string};
export default function ScopedCeremonyDetail({meeting,teamId,onClose}:{
 meeting:CalendarMeeting;teamId:string;onClose:()=>void;
}){
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const url="/api/admin/team-calendar/meetings/"+encodeURIComponent(meeting.kind)+"/"+
   encodeURIComponent(meeting.id)+"?"+new URLSearchParams({teamId});
  void fetch(url,{cache:"no-store",signal:controller.signal})
   .then(async res=>{if(!res.ok)throw Error("unavailable");return res.json() as Promise<{meeting:Detail}>;})
   .then(data=>{if(!controller.signal.aborted&&data.meeting?.id===meeting.id)setDetail(data.meeting);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return ()=>controller.abort();
 },[meeting.id,meeting.kind,teamId]);
 return <div className="smn-member-modal-backdrop" role="presentation">
  <section className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-label="Détail de cérémonie">
   {error&&<p role="alert">Détail indisponible.</p>}
   {!error&&!detail&&<p role="status">Chargement…</p>}
   {detail&&<><h2 className="h5">{detail.name}</h2>
    <p>{detail.startAt} — {detail.endAt}</p><p>Statut : {detail.status}</p>
    <p>Consultation uniquement : les modifications multiéquipes de cérémonies ne sont pas encore disponibles.</p></>}
   <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Fermer</button>
  </section>
 </div>;
}
