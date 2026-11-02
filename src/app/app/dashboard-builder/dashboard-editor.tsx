"use client";
import {useCallback,useMemo,useState} from "react";
import type {DashboardLayout,DashboardSlot} from "@/server/dashboard-builder/layout";
import {updateDashboardSlot,type SlotOptions} from "@/lib/dashboard-builder/slot-options";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import DashboardConsultation from "./dashboard-consultation";
import {DashboardTemplateGallery} from "./template-gallery";
import {DashboardSlotWizard} from "./slot-wizard";
import type {SourceView} from "@/server/dashboard-builder/sources";
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
 const [error,setError]=useState<string|null>(null);
 const [galleryRow,setGalleryRow]=useState<string|null>(null);
 const [wizardSlot,setWizardSlot]=useState<string|null>(null);
 const editing=draft!==null;
 const changed=useMemo(()=>draft!==null&&signature(draft)!==signature(published),[draft,published]);
 const enter=()=>{if(!canEdit)return;setDraft(copy(published));setError(null);};
 const cancel=()=>{if(saving)return;setDraft(null);setError(null);setExitOpen(false);};
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
  {!editing&&canEdit&&<details className="dropdown mb-3">
   <summary className="btn btn-outline-primary">Actions du tableau de bord</summary>
   <ul className="dropdown-menu show position-static">
    <li><button type="button" className="dropdown-item" onClick={enter}>Personnaliser</button></li>
   </ul>
  </details>}
  {editing&&<div className="d-flex align-items-center gap-2 mb-3">
   <span className="badge text-bg-secondary">Personnalisation</span>
   <button className="btn btn-outline-secondary" type="button" onClick={requestExit} disabled={saving}>Quitter</button>
  </div>}
  <DashboardConsultation layout={draft??published} teamId={teamId} navigation={navigation}
   mode={mode} locale={locale} personalizing={editing}/>
  {editing&&draft&&<section className="mb-5 pb-5" aria-label="Composition des lignes">
   {draft.rows.map((row,index)=><div className="smn-panel p-3 mb-3" key={row.id}>
    <h3 className="h6">Ligne {index+1}</h3>
    <div className="row g-2 mb-2">{row.blocks.map(block=><div className="col-12 col-lg" key={block.id}>
     <div className="border rounded p-2">
      <div className="fw-semibold mb-2">{block.templateId}</div>
      <div className="d-flex gap-2">{block.slots.map(slot=><div className="flex-fill" key={slot.id}>
       <button type="button" className="btn btn-outline-secondary w-100" onClick={()=>setWizardSlot(slot.id)} disabled={saving}
        aria-label={`Configurer emplacement ${slot.templateSlotId}`}>
        {slot.source?"✎ "+slot.source:"+"}</button>
      </div>)}</div>
     </div>
    </div>)}</div>
    <button className="btn btn-outline-primary" type="button" onClick={()=>setGalleryRow(row.id)} disabled={saving}>
     Ajouter un bloc
    </button>
   </div>)}
   <button className="btn btn-outline-primary w-100" type="button" onClick={addRow} disabled={saving}>Ajouter une ligne</button>
  </section>}
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
