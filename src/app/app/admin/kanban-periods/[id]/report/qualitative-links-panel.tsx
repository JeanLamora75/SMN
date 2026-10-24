"use client";
import {useEffect,useState} from "react";
type Entry={id:string;type:string;title:string;status:string;linked:boolean};
export default function KanbanQualitativeLinks({periodId,closed}:{periodId:string;closed:boolean}){
 const [items,setItems]=useState<Entry[]>([]);
 const [busy,setBusy]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const endpoint="/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/qualitative-links";
 useEffect(()=>{let active=true;
 fetch(endpoint,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();})
 .then(data=>{if(active)setItems(data.items??[]);})
 .catch(()=>{if(active)setError("Impossible de charger les rattachements qualitatifs.");})
 .finally(()=>{if(active)setLoading(false);});
 return()=>{active=false;};
 },[endpoint]);
 async function toggle(item:Entry){
  if(busy||closed)return;
  setBusy(item.id);setError("");setMessage("");
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({itemId:item.id,action:item.linked?"unlink":"link"})});
   if(!response.ok)throw Error();
   setItems(previous=>previous.map(entry=>entry.id===item.id?{...entry,linked:!entry.linked}:entry));
   setMessage("Rattachement enregistré et audité.");
  }catch{setError("Modification refusée. Actualisez le bilan et vérifiez son statut.");}
  finally{setBusy(null);}
 }
 return <section className="smn-panel rounded-4 p-3 p-md-4 mb-3">
  <h2 className="h5">Éléments qualitatifs associés</h2>
  <p className="text-secondary small">Associez explicitement les risques, obstacles, dépendances, décisions, actions ou faits marquants de l’équipe à cette période. Aucun rattachement n’est déduit des dates.</p>
  {closed&&<p className="alert alert-info small">Période clôturée : les rattachements sont verrouillés. Rouvrez la période pour les corriger ; les versions précédentes resteront intactes.</p>}
  {loading&&<p role="status">Chargement des éléments…</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="text-success">{message}</p>}
  {!loading&&!items.length&&<p className="text-secondary">Aucun élément qualitatif enregistré pour cette équipe.</p>}
  <div className="row g-2">{items.map(item=><div className="col-12 col-lg-6" key={item.id}><div className="border rounded p-2 h-100 d-flex gap-2 align-items-center">
   <input type="checkbox" className="form-check-input m-0" id={"kanban-link-"+item.id}
    checked={item.linked} disabled={closed||busy!==null} onChange={()=>toggle(item)}/>
   <label htmlFor={"kanban-link-"+item.id} className="small flex-grow-1">
    <strong>{item.title}</strong>
    <span className="d-block text-secondary">{item.type} · {item.status}</span>
   </label>
  </div></div>)}</div>
 </section>;
}
