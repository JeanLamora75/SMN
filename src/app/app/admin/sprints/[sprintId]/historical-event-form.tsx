"use client";
import {useEffect,useState} from "react";
type HistoricalRow={id:string;name:string;kind:string;status:string;startAt:string;createdAt:string};
export default function HistoricalEventForm({sprintId}:{sprintId:string}){
 const [open,setOpen]=useState(false),[name,setName]=useState(""),[kind,setKind]=useState("review");
 const [at,setAt]=useState(""),[duration,setDuration]=useState(60),[status,setStatus]=useState("unknown");
 const [error,setError]=useState(""),[success,setSuccess]=useState(""),[busy,setBusy]=useState(false);
 const [events,setEvents]=useState<HistoricalRow[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [editName,setEditName]=useState(""),[editStatus,setEditStatus]=useState("unknown");
 async function reload(){
  const response=await fetch("/api/admin/sprints/"+encodeURIComponent(sprintId)+"/historical-events",{cache:"no-store"});
  if(response.ok)setEvents((await response.json() as {events:HistoricalRow[]}).events);
 }
 useEffect(()=>{void reload();},[sprintId]);
 async function saveCorrection(){
  if(!editing||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/sprints/historical-events/"+encodeURIComponent(editing),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:editName,status:editStatus})});
   if(!response.ok)throw Error();
   setEditing(null);await reload();setSuccess("Correction enregistrée dans l'historique.");
  }catch{setError("Correction refusée ou service indisponible.");}
  finally{setBusy(false);}
 }

 async function submit(e:React.FormEvent){
  e.preventDefault();setError("");setSuccess("");
  const instant=new Date(at);
  if(!Number.isFinite(instant.valueOf())){setError("Date invalide.");return;}
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/historical-events",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,name,kind,startAt:instant.toISOString(),duration,status})});
   if(!response.ok){const result=await response.json();setError(result.error==="outside-sprint"?"L'événement doit avoir eu lieu pendant le Sprint passé.":"Impossible d'enregistrer l'événement.");return;}
   setSuccess("Événement historique enregistré, provenance documentée. Actualisez la fiche pour le consulter.");setOpen(false);await reload();
  }catch{setError("Service indisponible.");}finally{setBusy(false);}
 }
 return <section className="my-3">
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>Ajouter un événement historique documenté</button>
  {error&&<p className="alert alert-warning mt-2" role="alert">{error}</p>}
  {success&&<p className="alert alert-success mt-2" role="status">{success}</p>}
  {events.length>0&&<div className="mt-3"><h3 className="h6">Événements documentés</h3>
   {events.map(event=><div className="border rounded p-2 mb-2" key={event.id}>
    {editing===event.id?<div className="d-flex gap-2 flex-wrap">
     <input className="form-control flex-grow-1" aria-label="Nom corrigé" maxLength={160} value={editName} onChange={e=>setEditName(e.target.value)}/>
     <select className="form-select w-auto" aria-label="Statut corrigé" value={editStatus} onChange={e=>setEditStatus(e.target.value)}>
      <option value="unknown">Inconnu / non attesté</option><option value="held">Tenue</option><option value="not_held">Non tenue</option><option value="cancelled">Annulée</option>
     </select>
     <button type="button" className="btn btn-primary btn-sm" disabled={busy||!editName.trim()} onClick={saveCorrection}>Enregistrer</button>
     <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setEditing(null)}>Annuler</button>
    </div>:<div className="d-flex justify-content-between gap-2 align-items-center"><div>
     <strong>{event.name}</strong> <span className="small text-secondary">({event.kind})</span>
     <div className="small">Date réelle : {event.startAt} · Saisie : {event.createdAt}</div>
     <div className="small">Statut : {event.status==="unknown"?"Inconnu / non attesté":event.status} · Provenance : historique documenté</div>
    </div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{setEditing(event.id);setEditName(event.name);setEditStatus(event.status);}}>Corriger</button></div>}
   </div>)}
  </div>}
  {open&&<form className="border rounded p-3 mt-2 row g-2" onSubmit={submit}>
   <p className="small text-secondary">Saisir uniquement les informations réellement connues. La date de saisie est enregistrée séparément et aucune autre cérémonie n&apos;est créée.</p>
   <label className="col-md-6">Nom<input className="form-control" required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label className="col-md-6">Nature<select className="form-select" value={kind} onChange={e=>setKind(e.target.value)}><option value="planning">Planning</option><option value="daily">Daily</option><option value="review">Review</option><option value="retrospective">Rétrospective</option><option value="other">Autre réunion</option></select></label>
   <label className="col-md-6">Date et heure réelles<input type="datetime-local" className="form-control" required value={at} onChange={e=>setAt(e.target.value)}/></label>
   <label className="col-md-3">Durée (minutes)<input type="number" className="form-control" min={1} max={480} required value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>
   <label className="col-md-3">Statut attesté<select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="unknown">Inconnu / non attesté</option><option value="held">Tenue</option><option value="not_held">Non tenue</option><option value="cancelled">Annulée</option></select></label>
   <div className="col-12"><button className="btn btn-primary btn-sm" disabled={busy}>{busy?"Enregistrement…":"Enregistrer"}</button></div>
  </form>}
 </section>;
}
