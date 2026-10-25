"use client";
import {useEffect,useState} from "react";
type Change={id:string;previous:{startOn:string;endOn:string;name:string};proposed:{startOn:string;endOn:string;name:string};conflicts:string[]};
type Proposal={cadenceRevision:number;proposalToken:string;changes:Change[];canConfirm:boolean};
export default function KanbanCadenceProposal(){
 const [proposal,setProposal]=useState<Proposal|null>(null);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function refresh(){
  setError("");setMessage("");setProposal(null);setBusy(true);
  try{
   const response=await fetch("/api/admin/kanban-cadence/proposal",{cache:"no-store"});
   if(!response.ok)throw Error();
   setProposal(await response.json());
  }catch{setError("Impossible de préparer la proposition de recalcul.");}finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 async function confirm(){
  if(!proposal?.canConfirm)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/kanban-cadence/proposal",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({cadenceRevision:proposal.cadenceRevision,proposalToken:proposal.proposalToken})});
   if(!response.ok){setProposal(null);setError("La proposition n'est plus valide ou présente un conflit. Actualisez avant de confirmer.");return;}
   const data=await response.json();
   setProposal(null);setMessage(data.count+" période(s) future(s) replanifiée(s) et auditées.");
  }catch{setError("Replanification impossible.");}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 mt-3">
  <h2 className="h5">Adapter les périodes Kanban futures</h2>
  <p className="text-secondary">La nouvelle cadence n&apos;altère pas les périodes déjà enregistrées. Vous pouvez les conserver telles quelles ou examiner une adaptation des seules périodes futures jamais démarrées.</p>
  <button className="btn btn-outline-primary mb-3" disabled={busy} type="button" onClick={refresh}>Actualiser la proposition</button>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="alert alert-success">{message}</p>}
  {proposal&&<div>
   {!proposal.changes.length?<p className="text-secondary">Aucune période future à adapter.</p>:
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr><th>Période</th><th>Dates actuelles</th><th>Dates proposées</th><th>Conflits</th></tr></thead>
     <tbody>{proposal.changes.map(c=><tr key={c.id}>
      <td>{c.previous.name}</td><td>{c.previous.startOn} → {c.previous.endOn}</td>
      <td>{c.proposed.startOn} → {c.proposed.endOn}</td>
      <td>{c.conflicts.length?<span className="text-danger">Conflit : {c.conflicts.join(", ")}</span>:"Aucun"}</td>
     </tr>)}</tbody>
    </table></div>}
   {proposal.changes.length>0&&<div className="d-flex flex-wrap gap-2">
    <button className="btn btn-secondary" type="button" disabled={busy} onClick={()=>setProposal(null)}>Conserver les dates actuelles</button>
    <button className="btn btn-primary" type="button" disabled={busy||!proposal.canConfirm} onClick={confirm}>Confirmer le recalcul des périodes futures</button>
   </div>}
   {!proposal.canConfirm&&proposal.changes.length>0&&<p className="text-danger mt-2">Confirmation bloquée : conflit détecté.</p>}
  </div>}
 </section>;
}
