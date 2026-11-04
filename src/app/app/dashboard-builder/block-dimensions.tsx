"use client";
import {useState} from "react";
import type {BlockDimensions} from "@/lib/dashboard-builder/dimensions";
import {DEFAULT_BLOCK_DIMENSIONS} from "@/lib/dashboard-builder/dimensions";
import {useDashboardModalFocus} from "./modal-focus";
import ui from "./modal-ux.module.css";

const heightOptions:readonly {value:BlockDimensions["height"];label:string;description:string}[]=[
 {value:240,label:"S · Compact",description:"240 px"},
 {value:320,label:"M · Standard",description:"320 px"},
 {value:400,label:"Intermédiaire",description:"400 px"},
 {value:480,label:"L · Étendu",description:"480 px"},
 {value:640,label:"Très étendu",description:"640 px"},
 {value:"auto",label:"Auto",description:"Selon le contenu"},
];
export function BlockDimensionControl({value,onChange,disabled=false}:{
 value?:BlockDimensions;onChange:(v:BlockDimensions)=>void;disabled?:boolean;
}){
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState<BlockDimensions>(value??DEFAULT_BLOCK_DIMENSIONS);
 const focus=useDashboardModalFocus(()=>setOpen(false),open);
 const show=()=>{setDraft(value??DEFAULT_BLOCK_DIMENSIONS);setOpen(true);};
 return <>
  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={disabled}
   aria-label="Redimensionner le bloc" aria-expanded={open} onClick={show}>◢ <span className="ms-1">Dimensions</span></button>
  {open&&<div className={ui.overlay} role="presentation">
   <div className={`${ui.dialog} ${ui.dialogMedium}`} role="dialog" aria-modal="true" aria-labelledby="block-dimension-title" tabIndex={-1} ref={focus}>
    <div className={ui.header}>
     <div><h2 id="block-dimension-title" className={ui.headerTitle}>Dimensions et présentation du bloc</h2>
      <p className={ui.headerSubtitle}>Choisissez la taille qui convient à votre tableau de bord.</p></div>
     <button type="button" className={ui.close} aria-label="Fermer" onClick={()=>setOpen(false)}>×</button>
    </div>
    <div className={ui.body}>
     <div className="row g-4">
      <div className="col-12 col-lg-7">
       <h3 className={ui.sectionTitle}>Largeur du bloc</h3>
       <div className="row g-2" role="group" aria-label="Largeur du bloc">
        {([1,2,3,4] as const).map(n=><div className="col-6 col-md-3" key={n}>
         <button type="button" aria-pressed={draft.width===n} onClick={()=>setDraft(v=>({...v,width:n}))}
          className={`${ui.card} ${draft.width===n?ui.cardSelected:""} text-center`}>
          <span aria-hidden="true" className="d-block rounded bg-primary-subtle mb-2" style={{width:`${n*25}%`,minWidth:15,height:25}}/>
          <span className="fw-semibold small">{n===4?"Pleine largeur":n===3?"Trois quarts":n===2?"Moitié":"Un quart"}</span>
          <span className="d-block small text-body-secondary">{n} colonne{n>1?"s":""}</span>
         </button>
        </div>)}
       </div>
       <h3 className={`${ui.sectionTitle} mt-4`}>Hauteur du bloc</h3>
       <div className="row g-2" role="group" aria-label="Hauteur du bloc">
        {heightOptions.map(opt=><div className="col-6 col-md-4" key={String(opt.value)}>
         <button type="button" aria-pressed={draft.height===opt.value} onClick={()=>setDraft(v=>({...v,height:opt.value}))}
          className={`${ui.card} ${draft.height===opt.value?ui.cardSelected:""} text-center`}>
          <span className="fw-semibold small">{opt.label}</span>
          <span className="d-block small text-body-secondary">{opt.description}</span>
         </button>
        </div>)}
       </div>
      </div>
      <div className="col-12 col-lg-5">
       <h3 className={ui.sectionTitle}>Aperçu de la disposition</h3>
       <div className={ui.preview}>
        <div className="small fw-semibold mb-3">Bloc dans une grille de quatre colonnes</div>
        <div className={ui.inlinePreview} style={{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}}>
         <div className={ui.previewCell} style={{gridColumn:`span ${draft.width}`,height:draft.height==="auto"?70:Math.round(draft.height/5)}}/>
         {Array.from({length:4-draft.width},(_,i)=><div className={ui.previewCell} key={i} style={{opacity:.35}}/>)}
        </div>
        <p className={`${ui.muted} mt-3 mb-0`}>Aperçu géométrique uniquement. La hauteur s'adaptera au contenu si « Auto » est sélectionné.</p>
       </div>
      </div>
     </div>
    </div>
    <div className={ui.footer}>
     <span className={ui.muted}>La modification ne sera enregistrée qu'avec le Dashboard.</span>
     <div className="d-flex gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={()=>setOpen(false)}>Annuler</button>
      <button type="button" className="btn btn-primary" onClick={()=>{onChange(draft);setOpen(false);}}>Appliquer</button>
     </div>
    </div>
   </div>
  </div>}
 </>;
}
