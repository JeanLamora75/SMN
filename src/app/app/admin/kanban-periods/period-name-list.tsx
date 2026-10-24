"use client";
import {useEffect,useState} from "react";
type Period={id:string;name:string;startOn:string;endOn:string;status:string};
export default function PeriodNameList({canManage}:{canManage:boolean}){
 const [periods,setPeriods]=useState<Period[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
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
    {canManage&&<td><button type="button" className="btn btn-outline-primary btn-sm" disabled={busy!==null||!(drafts[p.id]??"").trim()||(drafts[p.id]??"").trim()===p.name} onClick={()=>rename(p)}>Enregistrer</button></td>}</tr>)}</tbody>
  </table></div>
  {!periods.length&&!error&&<p className="text-secondary">Aucune période Kanban enregistrée.</p>}
 </section>;
}
