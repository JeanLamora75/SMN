"use client";
import {useEffect,useState,type FormEvent} from "react";
type Mode="scrum"|"kanban";
type Props={teamId:string;mode:Mode;cadenceRevision:number;enabled:boolean;defaultStartOn?:string};
export default function TeamCycleCreateForm({teamId,mode,cadenceRevision,enabled,defaultStartOn=""}:Props){
 const [context,setContext]=useState<{mode:Mode;cadenceRevision:number|null;canCreate:boolean}|null>(null);
 const [contextError,setContextError]=useState(false);
 const [startOn,setStartOn]=useState(defaultStartOn);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/team-cycles?teamId="+encodeURIComponent(teamId),
   {cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("context-unavailable");return r.json();})
   .then((value:unknown)=>{
    if(controller.signal.aborted)return;
    const v=value as {teamId?:string;mode?:Mode;cadenceRevision?:number|null;canCreate?:boolean};
    if(v.teamId!==teamId||v.mode!==mode)throw Error("context-mismatch");
    setContext({mode:v.mode,cadenceRevision:v.cadenceRevision??null,canCreate:v.canCreate===true});
    setContextError(false);
   }).catch(()=>{if(!controller.signal.aborted){setContext(null);setContextError(true);}});
  return()=>controller.abort();
 },[teamId,mode]);
 const ready=enabled&&context?.canCreate===true&&context.cadenceRevision===cadenceRevision;
 const [name,setName]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [created,setCreated]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!ready||saving||!teamId||!Number.isSafeInteger(cadenceRevision)||cadenceRevision<1)return;
  setSaving(true);setError("");setCreated("");
  try{
   const response=await fetch("/api/admin/team-cycles",{
    method:"POST",headers:{"Content-Type":"application/json"},
    cache:"no-store",body:JSON.stringify({mode,teamId,cadenceRevision,startOn,
     ...(name.trim()?{name:name.trim()}:{})})
   });
   const result=await response.json() as {ok?:boolean;error?:string;
    sprint?:{name:string};period?:{name:string}};
   if(!response.ok||!result.ok){
    setError(result.error==="context-not-ready"?"Création multiéquipes non activée.":
     result.error==="stale-cadence"?"La cadence a changé : actualisez la page.":
     result.error==="overlap"?"La période chevauche un cycle existant.":
     "Création impossible : vérifiez la période et les autorisations.");
    return;
   }
   setCreated(result.sprint?.name??result.period?.name??"Cycle créé");
   setName("");setStartOn("");
  }catch{setError("Service indisponible.");}
  finally{setSaving(false);}
 }
 return <form className="d-grid gap-3" onSubmit={submit}>
  <p className="text-secondary mb-0">{mode==="scrum"?"Créer un Sprint Scrum":"Créer une période Kanban"} pour l'équipe sélectionnée.</p>
  {contextError&&<p role="alert" className="alert alert-warning">Contexte d’équipe indisponible : actualisez cette page.</p>}
  {!ready&&!contextError&&<p role="status" className="alert alert-warning mb-0">Création multiéquipes non activée : validation technique en cours.</p>}
  <label className="form-label" htmlFor="team-cycle-start">Date de début</label>
  <input id="team-cycle-start" className="form-control" type="date" required value={startOn}
   disabled={!ready||saving} onChange={e=>setStartOn(e.target.value)}/>
  <label className="form-label" htmlFor="team-cycle-name">Nom (facultatif)</label>
  <input id="team-cycle-name" className="form-control" maxLength={160} value={name}
   disabled={!enabled||saving} onChange={e=>setName(e.target.value)}/>
  <button type="submit" className="btn btn-primary"
   disabled={!ready||saving||!startOn||cadenceRevision<1}>Créer le cycle</button>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {created&&<p role="status" className="alert alert-success">{created}</p>}
 </form>;
}
