"use client";
import {useCallback,useMemo,useState} from "react";
import type {DashboardLayout} from "@/server/dashboard-builder/layout";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import DashboardConsultation from "./dashboard-consultation";

type Navigation={current:DashboardCycle|null;previous:string|null;next:string|null};
type SaveResponse={layout:DashboardLayout;revision:number;persisted:boolean};
const copy=(layout:DashboardLayout):DashboardLayout=>structuredClone(layout);
const signature=(layout:DashboardLayout)=>JSON.stringify(layout);
export function DashboardEditor({initialLayout,initialRevision,canEdit,teamId,navigation,mode,locale}:{
 initialLayout:DashboardLayout;initialRevision:number;canEdit:boolean;teamId:string;
 navigation:Navigation;mode:"scrum"|"kanban";locale:string;
}){
 const [published,setPublished]=useState<DashboardLayout>(()=>copy(initialLayout));
 const [draft,setDraft]=useState<DashboardLayout|null>(null);
 const [revision,setRevision]=useState(initialRevision);
 const [saving,setSaving]=useState(false);
 const [exitOpen,setExitOpen]=useState(false);
 const [error,setError]=useState<string|null>(null);
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
 const addRow=()=>setDraft(current=>current?{...current,rows:[...current.rows,{id:crypto.randomUUID(),blocks:[]}]}:null);
 return <div>
  {!editing&&canEdit&&<div className="dropdown mb-3">
   <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    Actions du tableau de bord
   </button>
   <ul className="dropdown-menu">
    <li><button type="button" className="dropdown-item" onClick={enter}>Personnaliser</button></li>
   </ul>
  </div>}
  {editing&&<div className="d-flex align-items-center gap-2 mb-3">
   <span className="badge text-bg-secondary">Personnalisation</span>
   <button className="btn btn-outline-primary" type="button" onClick={addRow} disabled={saving}>Ajouter une ligne</button>
   <button className="btn btn-outline-secondary" type="button" onClick={requestExit} disabled={saving}>Quitter</button>
  </div>}
  <DashboardConsultation layout={draft??published} teamId={teamId} navigation={navigation}
   mode={mode} locale={locale} personalizing={editing}/>
  {editing&&<div className="position-sticky bottom-0 bg-body border-top shadow-sm p-3 mt-4"
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
