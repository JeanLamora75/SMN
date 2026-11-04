"use client";
import {useEffect,useMemo,useState} from "react";
import type {DashboardLayout} from "@/server/dashboard-builder/layout";
import {getDashboardTemplate} from "@/lib/dashboard-builder/templates";
import {useDashboardModalFocus} from "./modal-focus";
import ui from "./modal-ux.module.css";
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
 const focus=useDashboardModalFocus(()=>{if(!busy)onClose();});
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
 return <div className={ui.overlay} role="presentation">
  <div className={ui.dialog} role="dialog" tabIndex={-1} ref={focus} aria-modal="true" aria-labelledby="copy-dashboard-title">
   <div className={ui.header}><div><h2 id="copy-dashboard-title" className={ui.headerTitle}>Copier le Dashboard vers une autre équipe</h2>
    <p className={ui.headerSubtitle}>La copie reprend la dernière disposition enregistrée, sans données métier.</p></div>
     <button type="button" className={ui.close} aria-label="Fermer" disabled={busy} onClick={onClose}>×</button></div>
    <div className={ui.body}>
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
       {incompatible.length>0&&<div className={`${ui.warning} mt-3`} role="status">⚠ {incompatible.length} source{incompatible.length>1?"s":""} de la disposition ne {incompatible.length>1?"sont":"sera"} pas disponible{incompatible.length>1?"s":""} dans l'équipe cible. Le{incompatible.length>1?"s":""} paramétrage{incompatible.length>1?"s":""} sera{incompatible.length>1?"ont":""} conservé{incompatible.length>1?"s":""}, et les emplacements concernés resteront à reconfigurer.</div>}
      </section>
      <section className="col-12 col-lg-6" aria-label="Aperçu de la disposition copiée">
       <h3 className="h6">Aperçu — dernière disposition enregistrée</h3>
       <p className="small text-body-secondary">Deux zones dynamiques et {layout.rows.length} lignes. Seules les configurations sont copiées ; les valeurs métier et références de cycles ne le sont pas.</p>
       <div className={ui.preview} aria-label="Schéma de la disposition enregistrée">
        <div className="small fw-semibold mb-2">Deux zones d'en-tête</div>
        <div className="row g-2 mb-3">{layout.header.blocks.map(b=><div className="col-6" key={b.id}>
         <div className={ui.previewCell} style={{height:52,padding:9}}>
          <span className="small">{b.title?.trim()||"Indicateur d'en-tête"}</span>
         </div>
        </div>)}</div>
        {layout.rows.map((row,i)=><div className="mb-3" key={row.id}>
         <div className="small fw-semibold mb-1">Ligne {i+1}</div>
         <div className="row g-2">{row.blocks.map(b=>{
          const shape=getDashboardTemplate(b.templateId,b.templateVersion);
          return <div className="col-12 col-sm-6" key={b.id}><div className="border rounded-3 bg-body p-2">
           <div className="small fw-semibold text-truncate">{b.title?.trim()||shape?.name||"Bloc"}</div>
           {shape&&<div className={ui.geometry} aria-hidden="true" style={{minHeight:52,
            gridTemplateColumns:`repeat(${shape.columns},minmax(0,1fr))`,gridTemplateRows:`repeat(${shape.rows},minmax(0,1fr))`}}>
            {shape.slots.map(cell=><span className={ui.geometryCell} key={cell.slotId}
             style={{gridColumn:`${cell.column+1} / span ${cell.columnSpan}`,gridRow:`${cell.row+1} / span ${cell.rowSpan}`}}/>)}
           </div>}
           <span className={ui.muted}>{b.slots.filter(x=>x.source).length} sur {b.slots.length} emplacement(s) configuré(s)</span>
          </div></div>;
         })}</div>
        </div>)}
       </div>
      </section>
     </div>
     {target?.hasSavedLayout&&<label className="d-flex gap-2 align-items-start mt-3"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
      Je confirme le remplacement de la disposition enregistrée de {target.name}.</label>}
     {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
    </div>
    <div className={ui.footer}><span className={ui.muted}>Copie de configuration uniquement.</span><div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annuler</button>
     <button className="btn btn-primary" disabled={!target||busy||(target.hasSavedLayout&&!confirmed)} onClick={()=>void copy()}>Copier la disposition enregistrée</button></div>
    </div>
  </div>
 </div>;
}
