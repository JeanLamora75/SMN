"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import BootstrapIcon from "./bootstrap-icon";
import {DASHBOARD_ICONS,type DashboardIconName} from "@/lib/dashboard-builder/icon-catalog";

/** Sélecteur transversal : contrôlé, aucune écriture serveur et aucune dépendance au Dashboard Builder. */
export function IconPicker({value,onChange,disabled=false,label="Icône"}:{
 value?:DashboardIconName|string;onChange:(name:DashboardIconName|undefined)=>void;disabled?:boolean;label?:string;
}){
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("Toutes");
 const dialog=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const id=useId();
 const categories=["Toutes",...new Set(DASHBOARD_ICONS.map(icon=>icon.category))];
 const filtered=useMemo(()=>DASHBOARD_ICONS.filter(icon=>
  (category==="Toutes"||icon.category===category)&&
  (icon.label+" "+icon.name).toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"))
 ),[category,search]);
 const selected=DASHBOARD_ICONS.find(icon=>icon.name===value);
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const focusTimer=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLInputElement>("input")?.focus());
  function keydown(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
   if(event.key!=="Tab"||!dialog.current)return;
   const elements=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)'));
   if(!elements.length)return;
   const first=elements[0],last=elements[elements.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  document.addEventListener("keydown",keydown);
  return()=>{cancelAnimationFrame(focusTimer);document.removeEventListener("keydown",keydown);(trigger.current??previous)?.focus();};
 },[open]);
 return <>
  <button ref={trigger} type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
   disabled={disabled} onClick={()=>{setSearch("");setCategory("Toutes");setOpen(true);}} aria-haspopup="dialog">
   {selected?<BootstrapIcon name={selected.name}/>:<BootstrapIcon name="grid-3x3-gap"/>}
   <span>{selected?selected.label:"Choisir une icône"}</span>
  </button>
  {open&&<div className="modal d-block" style={{background:"rgba(0,0,0,.5)",zIndex:1080}} role="presentation"
   onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
   <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
    <div ref={dialog} className="modal-content" role="dialog" aria-modal="true" aria-labelledby={id}>
     <div className="modal-header">
      <h2 id={id} className="modal-title fs-5">Choisir une icône — {label}</h2>
      <button type="button" className="btn-close" onClick={()=>setOpen(false)} aria-label="Fermer"/>
     </div>
     <div className="modal-body">
      <div className="row g-2 mb-3">
       <div className="col-12 col-md-7">
        <label className="form-label" htmlFor={id+"-search"}>Rechercher</label>
        <input id={id+"-search"} className="form-control" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nom ou mot-clé"/>
       </div>
       <div className="col-12 col-md-5">
        <label className="form-label" htmlFor={id+"-category"}>Catégorie</label>
        <select id={id+"-category"} className="form-select" value={category} onChange={event=>setCategory(event.target.value)}>
         {categories.map(item=><option key={item} value={item}>{item}</option>)}
        </select>
       </div>
      </div>
      <div className="row row-cols-3 row-cols-sm-4 row-cols-md-6 g-2" aria-label="Catalogue d'icônes">
       {filtered.map(icon=><div key={icon.name} className="col">
        <button type="button" className={`btn w-100 h-100 d-flex flex-column align-items-center gap-2 ${icon.name===value?"btn-primary":"btn-outline-secondary"}`}
         style={{minHeight:80}} aria-label={icon.label} aria-pressed={icon.name===value}
         onClick={()=>{onChange(icon.name);setOpen(false);}}>
         <span style={{transform:"scale(1.35)"}}><BootstrapIcon name={icon.name}/></span>
         <span className="small text-break">{icon.label}</span>
        </button>
       </div>)}
      </div>
      {!filtered.length&&<p role="status" className="text-body-secondary mt-3">Aucune icône correspondante.</p>}
     </div>
     <div className="modal-footer justify-content-between">
      <button type="button" className="btn btn-outline-danger" onClick={()=>{onChange(undefined);setOpen(false);}}>Sans icône</button>
      <button type="button" className="btn btn-outline-secondary" onClick={()=>setOpen(false)}>Annuler</button>
     </div>
    </div>
   </div>
  </div>}
 </>;
}
