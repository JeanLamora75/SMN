"use client";
import {useEffect,useMemo,useState} from "react";
import type {SourceDescriptor,SourceView} from "@/server/dashboard-builder/sources";
import {compatibleVisualizations} from "@/server/dashboard-builder/visualizations";
import type {DashboardSlot} from "@/server/dashboard-builder/layout";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import {normalizeSlotOptions,type SlotOptions} from "@/lib/dashboard-builder/slot-options";

export function DashboardSlotWizard({teamId,initialSlot,cycles,onClose,onConfirm,onClear}:{
 teamId:string;initialSlot?:DashboardSlot;cycles:readonly DashboardCycle[];onClose:()=>void;
 onConfirm:(source:string,view:SourceView,options:SlotOptions)=>void;onClear:()=>void;
}){
 const [sources,setSources]=useState<readonly SourceDescriptor[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("all");
 const [selected,setSelected]=useState<SourceDescriptor|null>(null);
 const [view,setView]=useState<SourceView|null>((initialSlot?.view as SourceView|undefined)??null);
 const [options,setOptions]=useState<SlotOptions>(()=>({...initialSlot?.filters} as SlotOptions));
 const [confirmClear,setConfirmClear]=useState(false);
 const [optionError,setOptionError]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/dashboard-builder/sources?teamId="+encodeURIComponent(teamId),
   {cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error(response.status===403?"Accès à cette équipe refusé.":"Catalogue des sources indisponible.");
    return response.json() as Promise<{sources:SourceDescriptor[]}>;
   }).then(data=>{setSources(data.sources);
    if(initialSlot?.source){const current=data.sources.find(x=>x.code===initialSlot.source&&x.status==="available");
     if(current)setSelected(current);}
   }).catch(()=>{
    if(!controller.signal.aborted)setError("Accès refusé ou sources indisponibles pour cette équipe.");
   }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[teamId,initialSlot?.source]);
 useEffect(()=>{
  const handle=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
  window.addEventListener("keydown",handle);
  return ()=>window.removeEventListener("keydown",handle);
 },[onClose]);
 const filtered=useMemo(()=>sources.filter(s=>
  s.status==="available"&&
  (category==="all"||s.category===category)&&
  (s.name+" "+(s.category==="indicator"?s.unit??"":"")).toLocaleLowerCase().includes(search.toLocaleLowerCase())),[sources,category,search]);
 const views=selected?compatibleVisualizations(selected):[];
 const chooseSource=(source:SourceDescriptor)=>{if(source.status!=="available")return;setSelected(source);setView(null);setOptions({});setOptionError("");};
 const confirm=()=>{
  if(!selected||!view)return;
  try{const clean=normalizeSlotOptions(options,selected.category,cycles.map(c=>c.id));
   onConfirm(selected.code,view,clean);
  }catch(e){setOptionError(e instanceof Error?e.message:"Options invalides");}
 };
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
       <div className="col-12 col-md-7"><label htmlFor="slot-search" className="form-label">Rechercher une source</label>
        <input id="slot-search" className="form-control" value={search} onChange={e=>setSearch(e.target.value)}/></div>
       <div className="col-12 col-md-5"><label htmlFor="slot-category" className="form-label">Catégorie</label>
        <select id="slot-category" className="form-select" value={category} onChange={e=>setCategory(e.target.value)}>
         <option value="all">Toutes les catégories</option>
         {[...new Set(sources.filter(s=>s.status==="available").map(s=>s.category))].map(c=><option key={c} value={c}>{c}</option>)}
        </select></div>
      </div>
      {loading?<p role="status">Chargement des sources…</p>:error?<p role="alert" className="alert alert-warning">{error}</p>:
       !filtered.length?<p role="status">Aucune source correspondant à votre recherche.</p>:
       <div className="list-group">{filtered.map(s=><button key={s.code} type="button"
        className="list-group-item list-group-item-action text-start" disabled={s.status!=="available"}
        onClick={()=>chooseSource(s)}>
        <strong>{s.name}</strong>
        <span className="ms-2 small text-body-secondary">{({indicator:"Indicateur",registry:"Registres",cycle:"Cycles",calendar:"Calendrier",objective:"Objectifs",team:"Équipe",link:"Liens"} as const)[s.category]} · {s.scope==="cycle"?"Par cycle":"Par équipe"}{s.unit?" · "+s.unit:""}</span>
        
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
      <div className="col-12">
       <details className="border rounded p-3">
        <summary>Options avancées</summary>
        <div className="row g-3 mt-2">
         <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="slot-cycle">Exception de cycle</label>
          <select id="slot-cycle" className="form-select" value={options.cycleIdOverride??""}
           onChange={e=>setOptions(o=>({...o,cycleIdOverride:e.target.value||undefined}))}>
           <option value="">Cycle actif</option>
           {cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
         </div>
         {selected.category==="registry"&&<>
          <div className="col-12 col-md-6"><label className="form-label" htmlFor="registry-type">Type de fiche</label>
           <select id="registry-type" className="form-select" value={options.type??"all"}
            onChange={e=>setOptions(o=>({...o,type:e.target.value}))}>
            <option value="all">Risques, obstacles et dépendances</option>
            <option value="risk">Risques</option><option value="obstacle">Obstacles</option>
            <option value="dependency">Dépendances</option>
            <option value="highlight">Événements</option>
            <option value="decision">Décisions</option><option value="action">Actions</option>
           </select></div>
          <div className="col-12 col-md-6"><label className="form-check mt-4">
           <input className="form-check-input" type="checkbox" checked={options.showClosed===true}
            onChange={e=>setOptions(o=>({...o,showClosed:e.target.checked}))}/>
           <span className="form-check-label">Inclure les fiches clôturées</span></label></div>
         </>}
         {["registry","cycle","calendar","team","link"].includes(selected.category)&&<>
          <div className="col-6 col-md-3"><label className="form-label" htmlFor="slot-limit">Nombre</label>
           <input id="slot-limit" type="number" min="1" max="100" className="form-control"
            value={options.limit??""} onChange={e=>setOptions(o=>({...o,limit:e.target.value?Number(e.target.value):undefined}))}/></div>
          <div className="col-6 col-md-3"><label className="form-label" htmlFor="slot-sort">Tri</label>
           <select id="slot-sort" className="form-select" value={options.sort??""}
            onChange={e=>setOptions(o=>({...o,sort:e.target.value as SlotOptions["sort"]||undefined}))}>
            <option value="">Par défaut</option><option value="asc">Croissant</option><option value="desc">Décroissant</option>
           </select></div>
          <div className="col-12"><label htmlFor="slot-columns" className="form-label">Colonnes (codes séparés par une virgule)</label>
           <input id="slot-columns" className="form-control" value={(options.columns??[]).join(",")}
            onChange={e=>setOptions(o=>({...o,columns:e.target.value?e.target.value.split(",").map(x=>x.trim()):undefined}))}/></div>
         </>}
        </div>
       </details>
       {optionError&&<p role="alert" className="alert alert-danger mt-2">{optionError}</p>}
      </div>
     </div>}
    </div>
    <div className="modal-footer justify-content-between">
     <div>{initialSlot?.source&&<button type="button" className="btn btn-outline-danger" onClick={()=>setConfirmClear(true)}>Vider cet emplacement</button>}{selected&&<button type="button" className="btn btn-outline-secondary" onClick={()=>{setSelected(null);setView(null);}}>Retour aux sources</button>}</div>
     <div className="d-flex gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
      {selected&&<button type="button" className="btn btn-primary" disabled={!view}
       onClick={confirm}>Confirmer</button>}
     </div>
    </div>
   </div>
  </div>
  {confirmClear&&<div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.55)",zIndex:1070}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="slot-clear-title">
    <div className="modal-header"><h3 className="modal-title fs-5" id="slot-clear-title">Vider cet emplacement ?</h3></div>
    <div className="modal-body">Seul cet emplacement sera vidé dans le brouillon.</div>
    <div className="modal-footer">
     <button className="btn btn-outline-secondary" onClick={()=>setConfirmClear(false)}>Conserver</button>
     <button className="btn btn-danger" onClick={onClear}>Confirmer le vidage</button>
    </div>
   </div></div>
  </div>}
 </div>;
}
