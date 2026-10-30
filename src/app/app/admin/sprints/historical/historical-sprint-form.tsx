"use client";
import {useState} from "react";
import Link from "next/link";
const toUtc=(raw:string)=>{const date=new Date(raw);return Number.isFinite(date.getTime())?date.toISOString():null;};
type Conflict={id:string;name:string;start_at:string;end_at:string};
export default function HistoricalSprintForm({teamId}:{teamId:string|null}){
 const [name,setName]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState("");
 const [generateCeremonies,setGenerateCeremonies]=useState(false);
 const [createAnother,setCreateAnother]=useState(false);
 const [operationId,setOperationId]=useState(()=>crypto.randomUUID());
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[conflicts,setConflicts]=useState<Conflict[]>([]);
 const [created,setCreated]=useState<{id:string;name:string;recordedAt:string}|null>(null);
 const [continueEntry,setContinueEntry]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setError("");setConflicts([]);
  const startAt=toUtc(start),endAt=toUtc(end);
  if(!startAt||!endAt||Date.parse(endAt)<=Date.parse(startAt)||Date.parse(endAt)>=Date.now()){
   setError("La période doit être cohérente et entièrement passée.");return;
  }
  setBusy(true);
  try{
   const res=await fetch("/api/admin/sprints/historical"+(teamId?"?"+new URLSearchParams({teamId}).toString():""),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),startAt,endAt,generateCeremonies,operationId})});
   const json=await res.json() as {ok?:boolean;error?:string;conflicts?:Conflict[];sprint?:{id:string;name:string;recordedAt:string}};
   if(!res.ok||!json.ok){setConflicts(json.conflicts??[]);setError(json.error==="overlap"?"Chevauchement avec un Sprint existant.":json.error==="not-finished"?"Ce Sprint n'est pas réellement terminé.":json.error==="team-unavailable"?"Équipe Scrum indisponible : sélectionnez une équipe active dans l’en-tête.":"Création impossible : vérifiez les dates et votre accès.");return;}
   setCreated(json.sprint?{...json.sprint,name:name.trim(),recordedAt:json.sprint.recordedAt??new Date().toISOString()}:null);
   setContinueEntry(createAnother);
   if(createAnother){setName("");setStart("");setEnd("");setGenerateCeremonies(false);setCreateAnother(false);setOperationId(crypto.randomUUID());}
  }catch{setError("Service momentanément indisponible.");}
  finally{setBusy(false);}
 }
 return <section className="smn-panel rounded-4 p-4">
  <h1 className="h4">Reprise historique d&apos;un Sprint</h1>
  <p className="text-secondary">Enregistrez les bornes réelles d&apos;un Sprint déjà terminé. La date de création dans SMN restera distincte. Aucune cérémonie, mesure ou clôture n&apos;est inventée.</p>
  {created&&<div role="status" className="alert alert-success">Sprint historique créé : <strong>{created.name}</strong>. Enregistré le {created.recordedAt}. <Link href={"/app/admin/sprints/"+encodeURIComponent(created.id)}>Consulter sa fiche</Link></div>}
  {(!created||continueEntry)&&<form onSubmit={submit} className="row g-3">
   <label className="col-12">Nom du Sprint<input className="form-control mt-1" required maxLength={160} value={name} onChange={e=>{setName(e.target.value);setOperationId(crypto.randomUUID());}}/></label>
   <label className="col-md-6">Début réel<input type="datetime-local" className="form-control mt-1" required value={start} onChange={e=>{setStart(e.target.value);setOperationId(crypto.randomUUID());}}/></label>
   <label className="col-md-6">Fin réelle<input type="datetime-local" className="form-control mt-1" required value={end} onChange={e=>{setEnd(e.target.value);setOperationId(crypto.randomUUID());}}/></label>
   <label className="col-12 form-check"><input className="form-check-input" type="checkbox" checked={generateCeremonies} onChange={e=>{setGenerateCeremonies(e.target.checked);setOperationId(crypto.randomUUID());}}/><span className="form-check-label"> Générer les cérémonies de l’équipe</span><small className="d-block text-secondary">Désactivé par défaut. Reconstitution théorique depuis la configuration actuellement enregistrée, sans preuve que les réunions ont eu lieu. Aucun statut réel n’est déduit.</small></label>
   <label className="col-12 form-check"><input className="form-check-input" type="checkbox" checked={createAnother} onChange={e=>setCreateAnother(e.target.checked)}/><span className="form-check-label"> Enregistrer un autre Sprint après celui-ci</span></label>
   <p className="small text-secondary mb-0">Les heures saisies sont interprétées dans le fuseau de votre navigateur. Vérifiez les heures historiques avant confirmation.</p>
   {error&&<div className="col-12"><p className="alert alert-warning" role="alert">{error}</p>{conflicts.map(x=><p key={x.id}><Link href={"/app/admin/sprints/"+encodeURIComponent(x.id)}>{x.name}</Link> : {x.start_at} — {x.end_at}</p>)}</div>}
   <div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Enregistrement…":"Créer le Sprint historique"}</button><Link className="btn btn-outline-secondary" href="/app/admin/sprints">Annuler</Link></div>
  </form>}
 </section>;
}
