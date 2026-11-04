"use client";
import {useState} from "react";
import {listCreatableDashboardTemplates,type DashboardTemplateId} from "@/lib/dashboard-builder/templates";
import {useDashboardModalFocus} from "./modal-focus";
import ui from "./modal-ux.module.css";

const PAGE_SIZE=6;
const descriptions:Record<DashboardTemplateId,string>={
 M01:"Un indicateur principal sur toute la largeur.",
 M02:"Deux indicateurs équilibrés côte à côte.",
 M03:"Trois mesures comparables sur une ligne.",
 M04:"Quatre emplacements sur deux lignes.",
 M05:"Un bloc principal et un complément.",
 M06:"Une zone majeure et deux zones secondaires.",
};
export function DashboardTemplateGallery({onChoose,onClose}:{
 onChoose:(id:DashboardTemplateId)=>void;onClose:()=>void;
}){
 const [page,setPage]=useState(0);
 const [selected,setSelected]=useState<DashboardTemplateId|null>(null);
 const focus=useDashboardModalFocus(onClose);
 const templates=listCreatableDashboardTemplates();
 const pages=Math.max(1,Math.ceil(templates.length/PAGE_SIZE));
 const visible=templates.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
 return <div className={ui.overlay} role="presentation">
  <div className={`${ui.dialog} ${ui.dialogMedium}`} ref={focus} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="db-gallery-title" aria-describedby="db-gallery-description">
   <div className={ui.header}>
    <div><h2 id="db-gallery-title" className={ui.headerTitle}>Choisir un modèle de bloc</h2>
     <p id="db-gallery-description" className={ui.headerSubtitle}>Sélectionnez une disposition pour organiser vos informations.</p></div>
    <button type="button" className={ui.close} aria-label="Fermer" onClick={onClose}>×</button>
   </div>
   <div className={ui.body}>
    <div className="row g-3">
     {visible.map(t=><div key={t.id} className="col-12 col-sm-6 col-lg-4">
      <button className={`${ui.card} ${selected===t.id?ui.cardSelected:""}`} type="button"
       aria-pressed={selected===t.id} onClick={()=>setSelected(t.id)} onDoubleClick={()=>onChoose(t.id)}>
       <span className="d-flex justify-content-between align-items-center">
        <span className={ui.cardName}>{t.name}</span>
        {selected===t.id&&<span className="badge text-bg-primary">Sélectionné</span>}
       </span>
       <span className={ui.geometry} aria-hidden="true"
        style={{gridTemplateColumns:`repeat(${t.columns},minmax(0,1fr))`,gridTemplateRows:`repeat(${t.rows},minmax(0,1fr))`}}>
        {t.slots.map(cell=><span key={cell.slotId} className={ui.geometryCell}
         style={{gridColumn:`${cell.column+1} / span ${cell.columnSpan}`,gridRow:`${cell.row+1} / span ${cell.rowSpan}`}}/>)}
       </span>
       <span className={ui.cardDetail}>{descriptions[t.id]}</span>
       <span className="small fw-semibold d-block mt-2">{t.slotCount} emplacement{t.slotCount>1?"s":""}</span>
      </button>
     </div>)}
    </div>
   </div>
   <div className={ui.footer}>
    <div className="d-flex gap-2 align-items-center">
     <span className={ui.muted}>Page {page+1} / {pages}</span>
     <button className="btn btn-outline-secondary btn-sm" type="button" disabled={page===0} onClick={()=>{setPage(v=>v-1);setSelected(null);}}>Précédent</button>
     <button className="btn btn-outline-secondary btn-sm" type="button" disabled={page>=pages-1} onClick={()=>{setPage(v=>v+1);setSelected(null);}}>Suivant</button>
    </div>
    <div className="d-flex gap-2">
     <button className="btn btn-outline-secondary" type="button" onClick={onClose}>Annuler</button>
     <button className="btn btn-primary" type="button" disabled={!selected} onClick={()=>{if(selected)onChoose(selected);}}>Choisir ce modèle</button>
    </div>
   </div>
  </div>
 </div>;
}
