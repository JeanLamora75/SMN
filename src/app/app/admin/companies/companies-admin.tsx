"use client";
import {useEffect,useState,type FormEvent} from "react";
type Company={id:string;name:string;comment:string|null;color:string;archivedAt:string|null;revision:number};
const palette=["blue","indigo","violet","teal","green","amber","orange","red"];
const blank=()=>({name:"",comment:"",color:"blue"});
export default function CompaniesAdmin(){
 const [items,setItems]=useState<Company[]>([]);
 const [selected,setSelected]=useState<Company|null>(null);
 const [draft,setDraft]=useState(blank);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 async function load(){
  const r=await fetch("/api/admin/companies",{cache:"no-store"});
  if(!r.ok)throw Error("catalog");
  const value=await r.json() as {companies:Company[]};
  setItems(value.companies);
 }
 useEffect(()=>{let alive=true;void fetch("/api/admin/companies",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("catalog");return r.json() as Promise<{companies:Company[]}>;})
  .then(x=>{if(alive)setItems(x.companies)})
  .catch(()=>{if(alive)setError("Chargement des entreprises impossible.")})
  .finally(()=>{if(alive)setLoading(false)});return()=>{alive=false};},[]);
 function edit(c:Company|null){
  setSelected(c);setDraft(c?{name:c.name,comment:c.comment??"",color:c.color}:blank());
  setMessage("");setError("");
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch(selected?"/api/admin/companies/"+encodeURIComponent(selected.id):"/api/admin/companies",{
    method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...draft,comment:draft.comment||null,...(selected?{revision:selected.revision}:{})})
   });
   if(!r.ok){const value=await r.json() as {error?:string};throw Error(value.error??"save");}
   await load();edit(null);setMessage("Entreprise enregistrée.");
  }catch(e){setError(e instanceof Error?e.message:"Enregistrement impossible.")}
  finally{setBusy(false)}
 }
 async function archive(c:Company){
  if(busy)return;
  const action=c.archivedAt?"reactivate":"archive";
  if(!window.confirm(action==="archive"?"Archiver cette entreprise ?":"Réactiver cette entreprise ?"))return;
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/companies/"+encodeURIComponent(c.id),{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,revision:c.revision})
   });
   if(!r.ok){const result=await r.json() as {error?:string};throw Error(result.error??"archive");}
   await load();edit(null);setMessage("Statut mis à jour.");
  }catch(e){setError(e instanceof Error?e.message:"Modification impossible.")}
  finally{setBusy(false)}
 }
 return <section className="smn-panel p-3 p-lg-4">
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {message&&<p className="alert alert-success" role="status">{message}</p>}
  {loading?<p role="status">Chargement…</p>:<div className="table-responsive">
   <table className="table table-sm align-middle"><thead><tr><th>Entreprise</th><th>Commentaire</th><th>Statut</th><th>Actions</th></tr></thead>
    <tbody>{items.map(c=><tr key={c.id}>
     <td><span className="me-2 d-inline-block rounded-circle" style={{width:12,height:12,backgroundColor:`var(--bs-${c.color},var(--bs-secondary))`}}/>{c.name}</td>
     <td>{c.comment??"—"}</td><td>{c.archivedAt?"Archivée":"Active"}</td>
     <td><div className="d-flex gap-2">
      <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy||!!c.archivedAt} onClick={()=>edit(c)}>Modifier</button>
      <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={()=>void archive(c)}>{c.archivedAt?"Réactiver":"Archiver"}</button>
     </div></td></tr>)}</tbody>
   </table>{!items.length&&<p>Aucune entreprise enregistrée.</p>}
  </div>}
  <form onSubmit={save} className="border-top pt-3 d-grid gap-3">
   <h2 className="h5">{selected?"Modifier l’entreprise":"Ajouter une entreprise"}</h2>
   <div><label htmlFor="company-name" className="form-label">Nom</label>
    <input id="company-name" className="form-control" required maxLength={120} value={draft.name}
     onChange={e=>setDraft(x=>({...x,name:e.target.value}))}/></div>
   <div><label htmlFor="company-comment" className="form-label">Commentaire</label>
    <textarea id="company-comment" className="form-control" maxLength={2000} value={draft.comment}
     onChange={e=>setDraft(x=>({...x,comment:e.target.value}))}/></div>
   <div><label htmlFor="company-color" className="form-label">Couleur</label>
    <select id="company-color" className="form-select" value={draft.color}
     onChange={e=>setDraft(x=>({...x,color:e.target.value}))}>{palette.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
   <div className="d-flex gap-2"><button className="btn btn-primary" disabled={busy}>Enregistrer</button>
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>edit(null)}>Nouveau</button></div>
  </form>
 </section>;
}
