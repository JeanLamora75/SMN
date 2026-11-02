"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {DashboardCopyModal} from "./dashboard-copy-modal";
import {resetDashboardDraft} from "@/lib/dashboard-builder/reset";
import {duplicateDashboardBlock,changeDashboardBlockTemplate,removeDashboardRow,removeDashboardBlock,rowHasConfiguredContent,blockHasConfiguredContent} from "@/lib/dashboard-builder/block-actions";
import {getDashboardTemplate,listCreatableDashboardTemplates} from "@/lib/dashboard-builder/templates";
import {BlockDimensionControl} from "./block-dimensions";
import {updateBlockDimensions} from "@/lib/dashboard-builder/dimensions";
import {moveDashboardRow,moveDashboardBlock} from "@/lib/dashboard-builder/reorder";
import type {DashboardLayout,DashboardSlot} from "@/server/dashboard-builder/layout";
import {updateDashboardSlot,type SlotOptions} from "@/lib/dashboard-builder/slot-options";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import DashboardConsultation from "./dashboard-consultation";
import {DashboardTemplateGallery} from "./template-gallery";
import {DashboardSlotWizard} from "./slot-wizard";
import type {SourceDescriptor,SourceView} from "@/server/dashboard-builder/sources";
import {appendDashboardRow,appendDashboardBlock} from "@/lib/dashboard-builder/composition";
import type {DashboardTemplateId} from "@/lib/dashboard-builder/templates";

type Navigation={current:DashboardCycle|null;previous:string|null;next:string|null};
type SaveResponse={layout:DashboardLayout;revision:number;persisted:boolean};
const copy=(layout:DashboardLayout):DashboardLayout=>structuredClone(layout);
const signature=(layout:DashboardLayout)=>JSON.stringify(layout);
export function DashboardEditor({initialLayout,initialRevision,canEdit,teamId,navigation,cycles,mode,locale}:{
 initialLayout:DashboardLayout;initialRevision:number;canEdit:boolean;teamId:string;
 navigation:Navigation;cycles:readonly DashboardCycle[];mode:"scrum"|"kanban";locale:string;
}){
 const [published,setPublished]=useState<DashboardLayout>(()=>copy(initialLayout));
 const [draft,setDraft]=useState<DashboardLayout|null>(null);
 const [revision,setRevision]=useState(initialRevision);
 const [saving,setSaving]=useState(false);
 const [exitOpen,setExitOpen]=useState(false);
 const [resetOpen,setResetOpen]=useState(false);
 const [copyOpen,setCopyOpen]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const [sourceCatalog,setSourceCatalog]=useState<readonly SourceDescriptor[]>([]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/dashboard-builder/sources?"+new URLSearchParams({teamId}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("source-catalog-unavailable");return response.json() as Promise<{sources:SourceDescriptor[]}>;})
   .then(result=>{if(!controller.signal.aborted)setSourceCatalog(Array.isArray(result.sources)?result.sources:[]);})
   .catch(()=>{if(!controller.signal.aborted)setSourceCatalog([]);});
  return()=>controller.abort();
 },[teamId]);
 const sourceByCode=useMemo(()=>new Map(sourceCatalog.map(source=>[source.code,source])),[sourceCatalog]);
 useEffect(()=>{if(!success)return;const timeout=setTimeout(()=>setSuccess(null),4000);return ()=>clearTimeout(timeout);},[success]);
 const [galleryRow,setGalleryRow]=useState<string|null>(null);
 const [wizardSlot,setWizardSlot]=useState<string|null>(null);
 const [pendingAction,setPendingAction]=useState<{kind:"row"|"block"|"template";id:string;template?:DashboardTemplateId}|null>(null);
 const [dragged,setDragged]=useState<{kind:"row"|"block";id:string}|null>(null);
 const editing=draft!==null;
 const changed=useMemo(()=>draft!==null&&signature(draft)!==signature(published),[draft,published]);
 const enter=()=>{if(!canEdit)return;setDraft(copy(published));setError(null);};
 const cancel=()=>{if(saving)return;setDraft(null);setError(null);setExitOpen(false);setResetOpen(false);};
 const confirmReset=()=>{
  if(!draft||saving||!canEdit)return;
  setDraft(resetDashboardDraft(mode,()=>crypto.randomUUID()));
  setResetOpen(false);
  setGalleryRow(null);setWizardSlot(null);setPendingAction(null);setError(null);
 };
 const requestExit=()=>{if(!editing||saving)return;if(changed)setExitOpen(true);else cancel();};
 const save=useCallback(async(leave=false)=>{
  if(!draft||!changed||saving||!canEdit)return;
  setSaving(true);setError(null);
  try{
   const response=await fetch("/api/dashboard-builder/layout",{
    method:"PUT",headers:{"Content-Type":"application/json"},cache:"no-store",
    body:JSON.stringify({teamId,expectedRevision:revision,layout:draft}),
   });
   if(!response.ok){
    const payload=await response.json().catch(()=>null) as {message?:string;error?:string}|null;
    throw Error(response.status===409?"La disposition a été modifiée dans une autre session. Votre brouillon est conservé.":
     payload?.message??"Enregistrement impossible. Votre brouillon est conservé.");
   }
   const saved=await response.json() as SaveResponse;
   setPublished(copy(saved.layout));
   setRevision(saved.revision);
   setDraft(leave?null:copy(saved.layout));
   setExitOpen(false);
   setSuccess("Tableau de bord enregistré.");
  }catch(e){
   setError(e instanceof Error?e.message:"Erreur réseau. Votre brouillon est conservé.");
  }finally{setSaving(false);}
 },[draft,changed,saving,canEdit,teamId,revision]);
 // The structural draft action is deliberately non-destructive; future stories
 // provide the full row/block/slot editor while retaining this save lifecycle.
 const activeSlot:DashboardSlot|undefined=draft?[...draft.header.blocks,...draft.rows.flatMap(r=>r.blocks)].flatMap(b=>b.slots).find(s=>s.id===wizardSlot):undefined;
 const confirmSlot=(source:string,view:SourceView,options:SlotOptions)=>{
  if(!wizardSlot)return;
  setDraft(current=>current?updateDashboardSlot(current,wizardSlot,{source,view,filters:options}):null);
  setWizardSlot(null);
 };
 const reorderRow=(id:string,index:number)=>setDraft(d=>d?moveDashboardRow(d,id,index):null);
 const reorderBlock=(id:string,rowId:string,index:number)=>setDraft(d=>d?moveDashboardBlock(d,id,rowId,index):null);
 const dropOnRow=(targetId:string,index:number)=>{
  if(!dragged)return;
  if(dragged.kind==="row")reorderRow(dragged.id,index);
  else reorderBlock(dragged.id,targetId,0);
  setDragged(null);
 };
 const duplicateBlock=(id:string)=>setDraft(d=>{if(!d)return null;const block=d.rows.flatMap(r=>r.blocks).find(b=>b.id===id);return block?duplicateDashboardBlock(d,id,crypto.randomUUID(),block.slots.map(()=>crypto.randomUUID())):d;});
 const chooseTemplate=(id:string,template:DashboardTemplateId)=>{
  if(!draft)return;
  const current=draft.rows.flatMap(r=>r.blocks).find(b=>b.id===id);
  if(!current)return;
  const model=getDashboardTemplate(template)!;
  if(current.slots.slice(model.slotCount).some(slot=>!!slot.source||!!slot.view)){
   setPendingAction({kind:"template",id,template});return;
  }
  setDraft(d=>d?changeDashboardBlockTemplate(d,id,template,Array.from({length:Math.max(0,model.slotCount-current.slots.length)},()=>crypto.randomUUID())).layout:null);
 };
 const commitPending=()=>{
  if(!pendingAction)return;
  const action=pendingAction;
  setDraft(d=>{if(!d)return null;
   if(action.kind==="row")return removeDashboardRow(d,action.id,true);
   if(action.kind==="block")return removeDashboardBlock(d,action.id,true);
   const block=d.rows.flatMap(r=>r.blocks).find(b=>b.id===action.id);
   if(!block||!action.template)return d;
   const target=getDashboardTemplate(action.template)!;
   return changeDashboardBlockTemplate(d,action.id,action.template,Array.from({length:Math.max(0,target.slotCount-block.slots.length)},()=>crypto.randomUUID())).layout;
  });
  setPendingAction(null);
 };
 const addRow=()=>setDraft(current=>current?appendDashboardRow(current,crypto.randomUUID()):null);
 const addBlock=(templateId:DashboardTemplateId)=>{
  if(!galleryRow||!draft)return;
  const templateSlots={M01:1,M02:2,M03:3,M04:4,M05:2,M06:3}[templateId];
  setDraft(current=>current?appendDashboardBlock(current,galleryRow,templateId,{
   blockId:crypto.randomUUID(),slotIds:Array.from({length:templateSlots},()=>crypto.randomUUID()),
  }):null);
  setGalleryRow(null);
 };
 return <div>
  {success&&<div className="alert alert-success py-2" role="status">{success}</div>}
  {error&&!editing&&<div className="alert alert-danger" role="alert">{error}<button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={()=>setError(null)}>Fermer</button></div>}
  {!editing&&canEdit&&<details className="dropdown mb-3">
   <summary className="btn btn-outline-primary">Actions du tableau de bord</summary>
   <ul className="dropdown-menu show position-static">
    <li><button type="button" className="dropdown-item" onClick={enter}>Personnaliser</button></li>
    <li><button type="button" className="dropdown-item" onClick={()=>setCopyOpen(true)}>Copier vers une autre équipe</button></li>
   </ul>
  </details>}
  {editing&&<div className="d-flex align-items-center gap-2 mb-3">
   <span className="badge text-bg-secondary">Personnalisation</span>
   <details className="dropdown"><summary className="btn btn-outline-secondary">Actions du tableau de bord</summary>
    <ul className="dropdown-menu show position-static"><li><button className="dropdown-item" type="button" disabled={saving} onClick={()=>setResetOpen(true)}>Réinitialiser</button><li><button className="dropdown-item" type="button" disabled={saving} onClick={()=>setCopyOpen(true)}>Copier vers une autre équipe</button></li></li></ul>
   </details>
   <button className="btn btn-outline-secondary" type="button" onClick={requestExit} disabled={saving}>Quitter</button>
  </div>}
  <DashboardConsultation layout={draft??published} teamId={teamId} navigation={navigation}
   mode={mode} locale={locale} personalizing={editing} canManage={canEdit}/>
  {editing&&draft&&<section className="mb-5 pb-5" aria-label="Composition des lignes">
   {draft.rows.map((row,index)=><div className="smn-panel p-3 mb-3" key={row.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();dropOnRow(row.id,index);}}>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
     <h3 className="h6 mb-0">Ligne {index+1}</h3>
     <div className="d-flex align-items-center gap-2">
      <button type="button" className="btn btn-outline-secondary btn-sm" draggable
       onDragStart={()=>setDragged({kind:"row",id:row.id})} onDragEnd={()=>setDragged(null)}
       aria-label={`Déplacer ligne ${index+1} à la souris`}>⠿</button>
      <details><summary className="btn btn-outline-secondary btn-sm">Actions ligne</summary>
       <div className="d-flex flex-wrap gap-1 mt-1">
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||index===0} onClick={()=>reorderRow(row.id,index-1)}>Monter</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||index===draft.rows.length-1} onClick={()=>reorderRow(row.id,index+1)}>Descendre</button>
        <button type="button" className="btn btn-outline-danger btn-sm" disabled={saving} onClick={()=>rowHasConfiguredContent(draft,row.id)?setPendingAction({kind:"row",id:row.id}):setDraft(d=>d?removeDashboardRow(d,row.id):null)}>Supprimer</button>
       </div>
      </details>
     </div>
    </div>
    <div className="row g-2 mb-2">{row.blocks.map((block,blockIndex)=><div className="col-12 col-lg" key={block.id}
     onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();e.preventDefault();if(dragged?.kind==="block")reorderBlock(dragged.id,row.id,blockIndex);setDragged(null);}}>
     <div className="border rounded p-2">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
       <strong>{block.templateId}</strong>
       <button className="btn btn-outline-secondary btn-sm" type="button" draggable
        onDragStart={()=>setDragged({kind:"block",id:block.id})} onDragEnd={()=>setDragged(null)}
        aria-label={`Déplacer bloc ${block.templateId} à la souris`}>⠿</button>
       <details><summary className="btn btn-outline-secondary btn-sm">Actions bloc</summary><div className="d-flex flex-wrap gap-1 mt-1">
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||blockIndex===0} onClick={()=>reorderBlock(block.id,row.id,blockIndex-1)}>Monter</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||blockIndex===row.blocks.length-1} onClick={()=>reorderBlock(block.id,row.id,blockIndex+1)}>Descendre</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||index===0} onClick={()=>reorderBlock(block.id,draft.rows[index-1].id,draft.rows[index-1].blocks.length)}>Ligne précédente</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving||index===draft.rows.length-1} onClick={()=>reorderBlock(block.id,draft.rows[index+1].id,draft.rows[index+1].blocks.length)}>Ligne suivante</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving} onClick={()=>duplicateBlock(block.id)}>Dupliquer</button>
        <label className="small">Modèle <select className="form-select form-select-sm" value={block.templateId} disabled={saving} onChange={e=>chooseTemplate(block.id,e.target.value as DashboardTemplateId)}>{listCreatableDashboardTemplates().map(t=><option key={t.id} value={t.id}>{t.id}</option>)}</select></label>
        <button type="button" className="btn btn-outline-danger btn-sm" disabled={saving} onClick={()=>blockHasConfiguredContent(block)?setPendingAction({kind:"block",id:block.id}):setDraft(d=>d?removeDashboardBlock(d,block.id):null)}>Supprimer</button>
       </div></details>
      </div>
      <div className="d-flex justify-content-end mb-2"><BlockDimensionControl value={block.dimensions} disabled={saving} onChange={value=>setDraft(d=>d?updateBlockDimensions(d,block.id,value):null)}/></div>
      <div className="d-flex gap-2">{block.slots.map(slot=><div className="flex-fill" key={slot.id}>
       <button type="button" className="btn btn-outline-secondary w-100" onClick={()=>setWizardSlot(slot.id)} disabled={saving}
        aria-label={`Configurer emplacement ${slot.templateSlotId}`}>
        {slot.source?<span className="d-flex flex-column align-items-start text-start"><strong>✎ {sourceByCode.get(slot.source)?.name??"Source introuvable"}</strong>{sourceByCode.get(slot.source)&&<span className="small text-body-secondary">{sourceByCode.get(slot.source)?.category==="indicator"?"Indicateur":sourceByCode.get(slot.source)?.category==="registry"?"Registre":"Source"} · {sourceByCode.get(slot.source)?.scope==="cycle"?"Par cycle":"Par équipe"}{sourceByCode.get(slot.source)?.unit?" · "+sourceByCode.get(slot.source)?.unit:""}</span>}</span>:"+"}</button>
      </div>)}</div>
     </div>
    </div>)}</div>
    <button className="btn btn-outline-primary" type="button" onClick={()=>setGalleryRow(row.id)} disabled={saving}>
     Ajouter un bloc
    </button>
   </div>)}
   <button className="btn btn-outline-primary w-100" type="button" onClick={addRow} disabled={saving}>Ajouter une ligne</button>
  </section>}
  {copyOpen&&<DashboardCopyModal sourceTeamId={teamId} layout={published} unsaved={changed} onClose={()=>setCopyOpen(false)} onSuccess={setSuccess}/>}
  {resetOpen&&<div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.55)",zIndex:1080}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content" role="alertdialog" aria-modal="true" aria-labelledby="dashboard-reset-title">
    <div className="modal-header"><h2 className="modal-title fs-5" id="dashboard-reset-title">Réinitialiser le Dashboard {mode==="scrum"?"Scrum":"Kanban"} ?</h2></div>
    <div className="modal-body"><p>La disposition de départ remplacera uniquement votre brouillon pour cette équipe.</p>
     <p>Les deux zones dynamiques d’en-tête seront restaurées. Les informations fixes du cycle et les données métier ne seront pas modifiées.</p>
     <p className="mb-0">Vous pourrez encore choisir « Annuler » pour retrouver votre Dashboard enregistré. Aucune sauvegarde automatique ne sera effectuée.</p></div>
    <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={()=>setResetOpen(false)}>Conserver mon brouillon</button>
     <button className="btn btn-danger" type="button" onClick={confirmReset} disabled={saving}>Réinitialiser le brouillon</button></div>
   </div></div>
  </div>}
  {pendingAction&&<div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.55)",zIndex:1070}}><div className="modal-dialog modal-dialog-centered"><div className="modal-content" role="alertdialog" aria-modal="true" aria-labelledby="block-action-confirm"><div className="modal-header"><h2 className="modal-title fs-5" id="block-action-confirm">Confirmer la perte de contenu ?</h2></div><div className="modal-body">Cette opération retirera du brouillon des emplacements configurés. Annuler conserve l’intégralité de la configuration.</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={()=>setPendingAction(null)}>Annuler</button><button type="button" className="btn btn-danger" onClick={commitPending}>Confirmer</button></div></div></div></div>}
  {galleryRow&&<DashboardTemplateGallery onChoose={addBlock} onClose={()=>setGalleryRow(null)}/>}
  {wizardSlot&&<DashboardSlotWizard teamId={teamId} initialSlot={activeSlot} cycles={cycles} onClose={()=>setWizardSlot(null)} onConfirm={confirmSlot} onClear={()=>{setDraft(current=>current?updateDashboardSlot(current,wizardSlot,null):null);setWizardSlot(null);}}/>}

  {editing&&<div className="position-fixed bottom-0 start-0 end-0 bg-body border-top shadow-sm p-3" style={{zIndex:1040}}
    role="region" aria-label="Barre de sauvegarde du Dashboard">
   <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
    <span role="status">{saving?"Enregistrement en cours…":changed?"Modifications non enregistrées":"Aucune modification"}</span>
    <div className="d-flex gap-2">
     <button className="btn btn-outline-secondary" type="button" onClick={requestExit} disabled={saving}>Annuler</button>
     <button className="btn btn-primary" type="button" onClick={()=>void save()} disabled={!changed||saving}>Enregistrer</button>
    </div>
   </div>
   {error&&<p className="alert alert-danger mt-2 mb-0" role="alert">{error}</p>}
  </div>}
  {exitOpen&&<div className="modal d-block" role="presentation" style={{background:"rgba(0,0,0,.45)"}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content" role="dialog"
    aria-modal="true" aria-labelledby="dashboard-exit-title">
    <div className="modal-header"><h2 className="modal-title fs-5" id="dashboard-exit-title">Quitter la personnalisation ?</h2></div>
    <div className="modal-body"><p>Des modifications ne sont pas enregistrées.</p>
     {error&&<p className="alert alert-danger" role="alert">{error}</p>}</div>
    <div className="modal-footer d-flex flex-wrap gap-2">
     <button type="button" className="btn btn-primary" onClick={()=>void save(true)} disabled={saving}>
      Enregistrer et quitter
     </button>
     <button type="button" className="btn btn-outline-danger" onClick={cancel} disabled={saving}>
      Quitter sans enregistrer
     </button>
     <button type="button" className="btn btn-outline-secondary" onClick={()=>{setExitOpen(false);setError(null);}} disabled={saving}>
      Continuer la personnalisation
     </button>
    </div>
   </div></div>
  </div>}
 </div>;
}
