"use client";
import {useEffect,useState} from "react";
type Period={id:string;name:string;startOn:string;endOn:string;status:string};
type RemovalSummary={period:{id:string;name:string;start_on:string;end_on:string;status:string;created_by:string|null};eligible:boolean;wasStarted:boolean;relations:{type:string;count:number;action:string}[];action:"soft-delete"};
export default function PeriodNameList({canManage}:{canManage:boolean}){
 const [periods,setPeriods]=useState<Period[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
 const [removal,setRemoval]=useState<RemovalSummary|null>(null);
 async function load(){
  const response=await fetch("/api/admin/kanban-periods/list",{cache:"no-store"});
  if(!response.ok)throw Error("load-failed");
  const data=await response.json() as {periods:Period[]};
  setPeriods(data.periods);
  setDrafts(Object.fromEntries(data.periods.map(p=>[p.id,p.name])));
 }
 useEffect(()=>{let active=true;fetch("/api/admin/kanban-periods/list",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error();return r.json();})
  .then((d:{periods:Period[]})=>{if(active){setPeriods(d.periods);setDrafts(Object.fromEntries(d.periods.map(p=>[p.id,p.name])));}})
  .catch(()=>{if(active)setError("Impossible de charger les périodes.");});
  return()=>{active=false;};},[]);
 async function requestRemoval(period:Period){
  setError("");setNotice("");setBusy(period.id);
  try{
   const r=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(period.id),{cache:"no-store"});
   if(!r.ok)throw Error();
   setRemoval(await r.json() as RemovalSummary);
  }catch{setError("Impossible de vérifier les conditions de suppression.");}
  finally{setBusy(null);}
 }
 async function confirmRemoval(){
  if(!removal?.eligible)return;
  const summary=removal;setBusy(summary.period.id);setError("");
  try{
   const r=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(summary.period.id),{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:summary.period.name,startOn:summary.period.start_on,endOn:summary.period.end_on})
   });
   if(!r.ok){setRemoval(null);setError("Suppression refusée : la période a changé ou est protégée. Actualisez le récapitulatif.");return;}
   setRemoval(null);await load();setNotice("Période retirée de la planification ; audit conservé.");
  }catch{setError("La suppression a échoué.");}finally{setBusy(null);}
 }
 async function rename(period:Period){
  const name=(drafts[period.id]??"").trim();
  if(!name){setError("Un nom non vide est obligatoire.");return;}
  setError("");setNotice("");setBusy(period.id);
  try{
   const response=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(period.id)+"/name",
    {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
   const data=await response.json();
   if(!response.ok)throw Error();
   await load();
   setNotice(data.duplicateName?"Nom enregistré. Attention : une autre période porte ce nom.":"Nom enregistré et modification auditée.");
  }catch{setError("Le renommage a échoué.");}finally{setBusy(null);}
 }
 return <section className="smn-panel p-4 mt-3">
  <h2 className="h5">Nommer et renommer les périodes</h2>
  <p className="text-secondary small">Le renommage est possible même après clôture. Les dates, statuts et indicateurs restent inchangés.</p>
  {error&&<div className="alert alert-warning" role="alert">{error}</div>}
  {notice&&<div className="alert alert-info" role="status">{notice}</div>}
  <div className="table-responsive"><table className="table align-middle">
   <thead><tr><th>Nom</th><th>Dates</th><th>Statut</th>{canManage&&<th>Action</th>}</tr></thead>
   <tbody>{periods.map(p=><tr key={p.id}><td>
    {canManage?<input className="form-control" aria-label={"Nom de "+p.startOn} maxLength={200}
     value={drafts[p.id]??p.name} disabled={busy!==null}
     onChange={e=>setDrafts(old=>({...old,[p.id]:e.target.value}))}/>:p.name}
    </td><td>{p.startOn} → {p.endOn}</td><td>{p.status}</td>
    {canManage&&<td><button type="button" className="btn btn-outline-primary btn-sm" disabled={busy!==null||!(drafts[p.id]??"").trim()||(drafts[p.id]??"").trim()===p.name} onClick={()=>rename(p)}>Enregistrer</button><button type="button" className="btn btn-outline-danger btn-sm ms-2" disabled={busy!==null} onClick={()=>requestRemoval(p)}>Supprimer</button></td>}</tr>)}</tbody>
  </table></div>
  {removal&&<div className="border rounded p-3 mt-3" role="region" aria-label="Confirmation suppression Kanban">
   <h3 className="h6">Récapitulatif avant suppression</h3>
   <p><strong>{removal.period.name}</strong> — {removal.period.start_on} → {removal.period.end_on} (statut : {removal.period.status})</p>
   <p className="small">Référence : {removal.period.id}. Auteur initial : {removal.period.created_by??"non renseigné"}. La suppression est logique : les journaux et références historiques restent conservés.</p>
   <ul>{removal.relations.map(x=><li key={x.type}>{x.type} : {x.count} entrée(s), {x.action==="preserved"?"conservées":"traitées"}</li>)}</ul>
   {!removal.eligible&&<p className="alert alert-warning">Suppression ordinaire interdite : période déjà commencée, terminée, clôturée ou datée du passé. Conservez son historique ou utilisez une procédure exceptionnelle distincte.</p>}
   <button type="button" className="btn btn-secondary me-2" disabled={busy!==null} onClick={()=>setRemoval(null)}>Annuler</button>
   {removal.eligible&&<button type="button" className="btn btn-danger" disabled={busy!==null} onClick={confirmRemoval}>Confirmer la suppression</button>}
  </div>}
  {!periods.length&&!error&&<p className="text-secondary">Aucune période Kanban enregistrée.</p>}
 </section>;
}
