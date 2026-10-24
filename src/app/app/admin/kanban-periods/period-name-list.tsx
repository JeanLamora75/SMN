"use client";
import {useEffect,useState} from "react";
type Period={id:string;name:string;startOn:string;endOn:string;status:string};
type Correction={period:Period;before:{startOn:string;endOn:string};after:{startOn:string;endOn:string};conflicts:string[];canConfirm:boolean;previewToken:string;warnings:string[]};
type RemovalSummary={period:{id:string;name:string;start_on:string;end_on:string;status:string;created_by:string|null};eligible:boolean;wasStarted:boolean;relations:{type:string;count:number;action:string}[];action:"soft-delete"};
export default function PeriodNameList({canManage}:{canManage:boolean}){
 const [periods,setPeriods]=useState<Period[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
 const [removal,setRemoval]=useState<RemovalSummary|null>(null);
 const [dateEdit,setDateEdit]=useState<{period:Period;startOn:string;endOn:string}|null>(null);
 const [correction,setCorrection]=useState<Correction|null>(null);
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
 async function previewCorrection(){
  if(!dateEdit)return;
  setBusy(dateEdit.period.id);setError("");setCorrection(null);
  try{
   const r=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(dateEdit.period.id)+"/dates",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({startOn:dateEdit.startOn,endOn:dateEdit.endOn})});
   if(!r.ok)throw Error();
   setCorrection(await r.json() as Correction);
  }catch{setError("Impossible de prévisualiser la correction.");}finally{setBusy(null);}
 }
 async function confirmCorrection(){
  if(!correction?.canConfirm)return;
  setBusy(correction.period.id);setError("");
  try{
   const r=await fetch("/api/admin/kanban-periods/"+encodeURIComponent(correction.period.id)+"/dates",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...correction.after,previewToken:correction.previewToken})});
   if(!r.ok){setCorrection(null);setError("La période a changé ou présente un conflit. Relancez l'aperçu.");return;}
   setDateEdit(null);setCorrection(null);await load();setNotice("Dates corrigées et modification auditée.");
  }catch{setError("Échec de la correction.");}finally{setBusy(null);}
 }
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
    {canManage&&<td><button type="button" className="btn btn-outline-primary btn-sm" disabled={busy!==null||!(drafts[p.id]??"").trim()||(drafts[p.id]??"").trim()===p.name} onClick={()=>rename(p)}>Enregistrer</button><button type="button" className="btn btn-outline-danger btn-sm ms-2" disabled={busy!==null} onClick={()=>requestRemoval(p)}>Supprimer</button><button type="button" className="btn btn-outline-secondary btn-sm ms-2" disabled={busy!==null} onClick={()=>{setDateEdit({period:p,startOn:p.startOn,endOn:p.endOn});setCorrection(null);}}>Corriger les dates</button></td>}</tr>)}</tbody>
  </table></div>
  {dateEdit&&<div className="border rounded p-3 mt-3">
   <h3 className="h6">Corriger les dates — {dateEdit.period.name}</h3>
   <p>Avant : {dateEdit.period.startOn} → {dateEdit.period.endOn}</p>
   <div className="row g-2">
    <div className="col"><label className="form-label">Début<input className="form-control" type="date" value={dateEdit.startOn} onChange={e=>{setDateEdit({...dateEdit,startOn:e.target.value});setCorrection(null);}}/></label></div>
    <div className="col"><label className="form-label">Fin<input className="form-control" type="date" value={dateEdit.endOn} onChange={e=>{setDateEdit({...dateEdit,endOn:e.target.value});setCorrection(null);}}/></label></div>
   </div>
   <p className="small text-secondary">Événements : conserver leurs dates (option par défaut). Valeurs manuelles, capacité figée et rapports : inchangés.</p>
   <button className="btn btn-outline-primary me-2" type="button" disabled={busy!==null} onClick={previewCorrection}>Voir l’impact</button>
   <button className="btn btn-outline-secondary" type="button" disabled={busy!==null} onClick={()=>{setDateEdit(null);setCorrection(null);}}>Annuler</button>
   {correction&&<div className="mt-3">
    <p>Après : {correction.after.startOn} → {correction.after.endOn}</p>
    {correction.conflicts.length>0&&<p className="alert alert-warning">Conflits : {correction.conflicts.join(", ")}</p>}
    {!correction.canConfirm&&<p className="text-danger">Confirmation bloquée : bornes invalides ou chevauchement.</p>}
    {correction.canConfirm&&<button className="btn btn-primary" disabled={busy!==null} onClick={confirmCorrection}>Confirmer la correction</button>}
   </div>}
  </div>}
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
