"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import {SMNIcon} from "./smn-icon";
import {DASHBOARD_ICONS,ICON_CATEGORIES,isDashboardIcon,type DashboardIconName} from "@/lib/dashboard-builder/icon-catalog";

const FAVORITES_KEY="smn-icon-picker-favorites-v1";
const RECENTS_KEY="smn-icon-picker-recents-v1";
const PAGE_SIZE=72;
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr");
function readIcons(key:string):DashboardIconName[]{
 try{
  const json=JSON.parse(window.localStorage.getItem(key)??"[]") as unknown;
  return Array.isArray(json)?[...new Set(json.filter(isDashboardIcon))].slice(0,100):[];
 }catch{return [];}
}
function persist(key:string,values:readonly DashboardIconName[]){
 try{window.localStorage.setItem(key,JSON.stringify(values));}catch{/* Storage can be disabled: selection remains usable. */}
}

/** Sélecteur partagé : recherche intégrale, catégories, favoris/récents locaux et 72 tuiles maximum par page. */
export function IconPicker({value,onChange,disabled=false,label="Icône"}:{
 value?:DashboardIconName|string;onChange:(name:DashboardIconName|undefined)=>void;disabled?:boolean;label?:string;
}){
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState<string>("Toutes");
 const [limit,setLimit]=useState(PAGE_SIZE);
 const [favorites,setFavorites]=useState<DashboardIconName[]>([]);
 const [recent,setRecent]=useState<DashboardIconName[]>([]);
 const dialog=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const id=useId();
 const selected=DASHBOARD_ICONS.find(icon=>icon.name===value);
 useEffect(()=>{setFavorites(readIcons(FAVORITES_KEY));setRecent(readIcons(RECENTS_KEY));},[]);
 useEffect(()=>{setLimit(PAGE_SIZE);},[search,category]);
 const recentRank=useMemo(()=>new Map(recent.map((name,index)=>[name,index])),[recent]);
 const filtered=useMemo(()=>{
  const query=normalize(search.trim());
  const matches=DASHBOARD_ICONS.filter(icon=>{
   if(category==="Favoris"&&!favorites.includes(icon.name))return false;
   if(category==="Récentes"&&!recent.includes(icon.name))return false;
   if(category!=="Toutes"&&category!=="Favoris"&&category!=="Récentes"&&icon.category!==category)return false;
   return !query||normalize(icon.label+" "+icon.name+" "+icon.category).includes(query);
  });
  if(category==="Récentes")matches.sort((a,b)=>(recentRank.get(a.name)??Infinity)-(recentRank.get(b.name)??Infinity));
  return matches;
 },[search,category,favorites,recent,recentRank]);
 const visible=filtered.slice(0,limit);
 const choose=(name:DashboardIconName)=>{
  const updated=[name,...recent.filter(entry=>entry!==name)].slice(0,24);
  setRecent(updated);persist(RECENTS_KEY,updated);
  onChange(name);setOpen(false);
 };
 const toggleFavorite=(name:DashboardIconName)=>{
  const updated=favorites.includes(name)?favorites.filter(item=>item!==name):[...favorites,name];
  setFavorites(updated);persist(FAVORITES_KEY,updated);
 };
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const frame=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLInputElement>("input")?.focus());
  function handleKey(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
   if(event.key!=="Tab"||!dialog.current)return;
   const elements=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)'));
   const first=elements[0],last=elements[elements.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  document.addEventListener("keydown",handleKey);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener("keydown",handleKey);(trigger.current??previous)?.focus();};
 },[open]);
 return <>
  <button ref={trigger} type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
   disabled={disabled} onClick={()=>{setSearch("");setCategory("Toutes");setLimit(PAGE_SIZE);setOpen(true);}} aria-haspopup="dialog">
   {selected?<SMNIcon name={selected.name}/>:<SMNIcon name="grid-3x3-gap"/>}
   <span>{selected?selected.label:"Choisir une icône"}</span>
  </button>
  {open&&<div className="modal d-block" style={{background:"rgba(0,0,0,.5)",zIndex:1080}} role="presentation"
    onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
   <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
    <div ref={dialog} className="modal-content" role="dialog" aria-modal="true" aria-labelledby={id}>
     <div className="modal-header">
      <div>
       <h2 id={id} className="modal-title fs-5">Choisir une icône — {label}</h2>
       <span className="small text-body-secondary">Catalogue Bootstrap Icons · {DASHBOARD_ICONS.length} icônes</span>
      </div>
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
         {ICON_CATEGORIES.map(item=><option key={item} value={item}>{item}{item==="Favoris"?" ("+favorites.length+")":item==="Récentes"?" ("+recent.length+")":""}</option>)}
        </select>
       </div>
      </div>
      <div className="small text-body-secondary mb-2" role="status">{filtered.length} résultat{filtered.length>1?"s":""} · {visible.length} affiché{visible.length>1?"s":""}</div>
      <div className="row row-cols-3 row-cols-sm-4 row-cols-md-6 g-2" aria-label="Catalogue d'icônes">
       {visible.map(icon=><div key={icon.name} className="col">
        <div className="border rounded h-100 position-relative" style={{minHeight:94}}>
         <button type="button" className={`btn w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2 ${icon.name===value?"btn-primary":"btn-outline-secondary"}`}
          style={{minHeight:94,paddingTop:18}} aria-label={"Choisir "+icon.label} aria-pressed={icon.name===value}
          onClick={()=>choose(icon.name)}>
          <span style={{fontSize:"1.4rem"}}><SMNIcon name={icon.name}/></span>
          <span className="small text-break">{icon.label}</span>
         </button>
         <button type="button" className="btn btn-sm position-absolute top-0 end-0"
          aria-label={(favorites.includes(icon.name)?"Retirer des favoris : ":"Ajouter aux favoris : ")+icon.label}
          aria-pressed={favorites.includes(icon.name)} title={favorites.includes(icon.name)?"Retirer des favoris":"Ajouter aux favoris"}
          style={{lineHeight:1,padding:4,color:favorites.includes(icon.name)?"var(--bs-warning)":"var(--bs-secondary-color)"}}
          onClick={()=>toggleFavorite(icon.name)}><SMNIcon name={favorites.includes(icon.name)?"star-fill":"star"}/></button>
        </div>
       </div>)}
      </div>
      {filtered.length===0&&<p className="text-body-secondary mt-3">Aucune icône correspondante.</p>}
      {visible.length<filtered.length&&<div className="text-center mt-3">
       <button type="button" className="btn btn-outline-primary" onClick={()=>setLimit(count=>count+PAGE_SIZE)}>
        Afficher {Math.min(PAGE_SIZE,filtered.length-visible.length)} icônes supplémentaires
       </button>
      </div>}
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
