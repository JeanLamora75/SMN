"use client";
import {useEffect,useMemo,useState} from "react";
import type {DashboardLayout} from "@/server/dashboard-builder/layout";
type Target={id:string;name:string;revision:number;hasSavedLayout:boolean;availableCodes:string[]};
export function DashboardCopyModal({sourceTeamId,layout,unsaved,onClose,onSuccess}:{
 sourceTeamId:string;layout:DashboardLayout;unsaved:boolean;onClose:()=>void;onSuccess:(message:string)=>void;
}){
 const [targets,setTargets]=useState<Target[]>([]);
 const [selected,setSelected]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/dashboard-builder/copy?sourceTeamId="+encodeURIComponent(sourceTeamId),{signal:controller.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("Accès aux équipes indisponible");return r.json() as Promise<{targets:Target[]}>;})
   .then(data=>setTargets(data.targets)).catch(()=>{if(!controller.signal.aborted)setError("Impossible de charger les équipes autorisées.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[sourceTeamId]);
 const target=targets.find(t=>t.id===selected);
 const incompatible=useMemo(()=>{
  if(!target)return [];
  const blocks=[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)];
  return [...new Set(blocks.flatMap(b=>b.slots).filter(s=>s.source&&!target.availableCodes.includes(s.source)).map(s=>s.source!))];
 },[target,layout]);
 const copy=async()=>{
  if(!target||busy||(target.hasSavedLayout&&!confirmed))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/dashboard-builder/copy",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sourceTeamId,targetTeamId:target.id,expectedRevision:target.revision})});
   const response=await r.json() as {error?:string;message?:string;warnings?:string[]};
   if(!r.ok)throw Error(response.message??"Copie impossible");
   onSuccess(response.warnings?.length?"Disposition copiée. Certaines sources sont indisponibles dans l’équipe cible.":"Disposition copiée vers l’équipe cible.");
   onClose();
  }catch(e){setError(e instanceof Error?e.message:"Copie impossible");}
  finally{setBusy(false);}
 };
 return <div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.55)",zIndex:1080}}>
  <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
   <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="copy-dashboard-title">
    <div className="modal-header"><h2 id="copy-dashboard-title" className="modal-title fs-5">Copier le Dashboard enregistré vers une autre équipe</h2>
     <button type="button" className="btn-close" aria-label="Fermer" disabled={busy} onClick={onClose}/></div>
    <div className="modal-body">
     {unsaved&&<p className="alert alert-warning">Votre brouillon contient des modifications non enregistrées. Seule la dernière disposition enregistrée sera copiée.</p>}
     <div className="row g-3">
      <section className="col-12 col-lg-6" aria-label="Choix de l’équipe cible">
       <label className="form-label" htmlFor="dashboard-copy-target">Équipe cible autorisée</label>
       <select id="dashboard-copy-target" className="form-select" value={selected}
        onChange={e=>{setSelected(e.target.value);setConfirmed(false);setError("");}} disabled={loading||busy}>
        <option value="">Choisir une équipe</option>
        {targets.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
       </select>
       {loading?<p role="status">Chargement…</p>:!targets.length?<p className="alert alert-info mt-3">Aucune autre équipe autorisée en édition.</p>:null}
       {target?.hasSavedLayout&&<p className="alert alert-warning mt-3">Une disposition enregistrée existe dans cette équipe. Elle sera remplacée après confirmation.</p>}
       {incompatible.length>0&&<div className="alert alert-warning mt-3">Sources pouvant être incompatibles dans l’équipe cible : {incompatible.join(", ")}. Elles seront conservées dans la configuration.</div>}
      </section>
      <section className="col-12 col-lg-6" aria-label="Aperçu de la disposition copiée">
       <h3 className="h6">Aperçu — dernière disposition enregistrée</h3>
       <p className="small text-body-secondary">Deux zones dynamiques et {layout.rows.length} lignes. Seules les configurations sont copiées ; les valeurs métier et références de cycles ne le sont pas.</p>
       <div className="row g-2 mb-2">{layout.header.blocks.map(b=><div className="col-6" key={b.id}><div className="border rounded p-2 small">{b.templateId} · {b.slots.length} emplacement(s)</div></div>)}</div>
       {layout.rows.map((row,i)=><div className="border rounded p-2 mb-2" key={row.id}>
        <strong className="small">Ligne {i+1}</strong>
        <div className="d-flex flex-wrap gap-2">{row.blocks.map(b=><span key={b.id} className="badge text-bg-secondary">{b.templateId} · {b.slots.filter(s=>s.source).length}/{b.slots.length}</span>)}</div>
       </div>)}
      </section>
     </div>
     {target?.hasSavedLayout&&<label className="d-flex gap-2 align-items-start mt-3"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
      Je confirme le remplacement de la disposition enregistrée de {target.name}.</label>}
     {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
    </div>
    <div className="modal-footer"><button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annuler</button>
     <button className="btn btn-primary" disabled={!target||busy||(target.hasSavedLayout&&!confirmed)} onClick={()=>void copy()}>Copier la disposition enregistrée</button>
    </div>
   </div>
  </div>
 </div>;
}
