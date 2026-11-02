"use client";
import {useState} from "react";
import {listCreatableDashboardTemplates,type DashboardTemplateId} from "@/lib/dashboard-builder/templates";

const PAGE_SIZE=6;
export function DashboardTemplateGallery({onChoose,onClose}:{
 onChoose:(id:DashboardTemplateId)=>void;onClose:()=>void;
}){
 const [page,setPage]=useState(0);
 const templates=listCreatableDashboardTemplates();
 const pages=Math.max(1,Math.ceil(templates.length/PAGE_SIZE));
 const visible=templates.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
 return <div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.5)",zIndex:1050}}>
  <div className="modal-dialog modal-dialog-centered modal-lg">
   <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="db-gallery-title">
    <div className="modal-header">
     <h2 id="db-gallery-title" className="modal-title fs-5">Choisir un modèle de bloc</h2>
     <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose}/>
    </div>
    <div className="modal-body">
     <div className="row g-3">
      {visible.map(t=><div key={t.id} className="col-12 col-sm-6 col-lg-4">
       <button className="btn btn-outline-secondary w-100 h-100 text-start p-3" type="button" onClick={()=>onChoose(t.id)}>
        <strong>{t.id} · {t.name}</strong>
        <div className="my-3 d-grid gap-1" aria-hidden="true" style={{gridTemplateColumns:`repeat(${t.columns},minmax(0,1fr))`}}>
         {t.thumbnail.flatMap((row,r)=>row.map((slot,c)=>
          <div key={`${r}-${c}`} className="rounded bg-secondary-subtle border" style={{height:24,opacity:slot==="primary"?1:.65}}/>))}
        </div>
        <span className="small">{t.slotCount} emplacement{t.slotCount>1?"s":""}</span>
       </button>
      </div>)}
     </div>
    </div>
    <div className="modal-footer justify-content-between">
     <span className="small text-body-secondary">Page {page+1} / {pages}</span>
     <div className="d-flex gap-2">
      <button className="btn btn-outline-secondary" type="button" disabled={page===0} onClick={()=>setPage(v=>v-1)}>Précédent</button>
      <button className="btn btn-outline-secondary" type="button" disabled={page>=pages-1} onClick={()=>setPage(v=>v+1)}>Suivant</button>
     </div>
    </div>
   </div>
  </div>
 </div>;
}
