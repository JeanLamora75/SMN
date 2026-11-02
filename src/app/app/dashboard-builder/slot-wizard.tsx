"use client";
import {useEffect,useMemo,useState} from "react";
import type {SourceDescriptor,SourceView} from "@/server/dashboard-builder/sources";
import {compatibleVisualizations} from "@/server/dashboard-builder/visualizations";

export function DashboardSlotWizard({teamId,onClose,onConfirm}:{
 teamId:string;onClose:()=>void;onConfirm:(source:string,view:SourceView)=>void;
}){
 const [sources,setSources]=useState<readonly SourceDescriptor[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("all");
 const [selected,setSelected]=useState<SourceDescriptor|null>(null);
 const [view,setView]=useState<SourceView|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");setSources([]);
  fetch("/api/dashboard-builder/sources?teamId="+encodeURIComponent(teamId),
   {cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error(response.status===403?"Accès à cette équipe refusé.":"Catalogue des sources indisponible.");
    return response.json() as Promise<{sources:SourceDescriptor[]}>;
   }).then(data=>setSources(data.sources)).catch(()=>{
    if(!controller.signal.aborted)setError("Accès refusé ou sources indisponibles pour cette équipe.");
   }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[teamId]);
 useEffect(()=>{
  const handle=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
  window.addEventListener("keydown",handle);
  return ()=>window.removeEventListener("keydown",handle);
 },[onClose]);
 const filtered=useMemo(()=>sources.filter(s=>
  (category==="all"||s.category===category)&&
  (s.code+" "+s.name).toLocaleLowerCase().includes(search.toLocaleLowerCase())),[sources,category,search]);
 const views=selected?compatibleVisualizations(selected):[];
 const chooseSource=(source:SourceDescriptor)=>{if(source.status!=="available")return;setSelected(source);setView(null);};
 return <div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.55)",zIndex:1060}}>
  <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
   <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="slot-wizard-title">
    <div className="modal-header">
     <h2 className="modal-title fs-5" id="slot-wizard-title">Configurer un emplacement — étape {selected?"2":"1"} sur 2</h2>
     <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose}/>
    </div>
    <div className="modal-body">
     {!selected?<div>
      <div className="row g-2 mb-3">
       <div className="col-12 col-md-7"><label htmlFor="slot-search" className="form-label">Rechercher par code ou nom</label>
        <input id="slot-search" className="form-control" value={search} onChange={e=>setSearch(e.target.value)}/></div>
       <div className="col-12 col-md-5"><label htmlFor="slot-category" className="form-label">Catégorie</label>
        <select id="slot-category" className="form-select" value={category} onChange={e=>setCategory(e.target.value)}>
         <option value="all">Toutes les catégories</option>
         {["indicator","registry","cycle","calendar","objective","team","link"].map(c=><option key={c} value={c}>{c}</option>)}
        </select></div>
      </div>
      {loading?<p role="status">Chargement des sources…</p>:error?<p role="alert" className="alert alert-warning">{error}</p>:
       !filtered.length?<p role="status">Aucune source correspondant à votre recherche.</p>:
       <div className="list-group">{filtered.map(s=><button key={s.code} type="button"
        className="list-group-item list-group-item-action text-start" disabled={s.status!=="available"}
        onClick={()=>chooseSource(s)}>
        <strong>{s.name}</strong> <code>{s.code}</code>
        <span className="ms-2 small text-body-secondary">{s.category} · {s.scope} · {s.unit??"sans unité"}</span>
        {s.status!=="available"&&<span className="ms-2 badge text-bg-secondary">Indisponible</span>}
       </button>)}</div>}
     </div>:<div className="row g-3">
      <div className="col-12 col-lg-7">
       <h3 className="h6">Visualisations compatibles — {selected.name}</h3>
       <div className="row g-2">{views.map(item=><div key={item.kind} className="col-6 col-sm-4">
        <button type="button" onClick={()=>setView(item.kind)}
         className={`btn w-100 h-100 p-3 ${view===item.kind?"btn-primary":"btn-outline-secondary"}`}
         aria-pressed={view===item.kind}>
         <span aria-hidden="true" className="d-block fs-3">{item.thumbnail}</span>
         <span>{item.kind}</span>
        </button>
       </div>)}</div>
      </div>
      <div className="col-12 col-lg-5">
       <section className="smn-panel p-3 h-100" aria-label="Aperçu de la visualisation">
        <h3 className="h6">Aperçu</h3>
        {view?<p className="mb-0">Représentation « {view} » de {selected.name}. Les données réelles seront chargées en consultation.</p>:
         <p className="text-body-secondary mb-0">Sélectionnez une visualisation pour voir son aperçu.</p>}
       </section>
      </div>
     </div>}
    </div>
    <div className="modal-footer justify-content-between">
     <div>{selected&&<button type="button" className="btn btn-outline-secondary" onClick={()=>{setSelected(null);setView(null);}}>Retour aux sources</button>}</div>
     <div className="d-flex gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
      {selected&&<button type="button" className="btn btn-primary" disabled={!view}
       onClick={()=>{if(view)onConfirm(selected.code,view);}}>Confirmer</button>}
     </div>
    </div>
   </div>
  </div>
 </div>;
}
