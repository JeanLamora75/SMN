"use client";
import {useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import {allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";

type Editable={sections:string[];questions:string[];instructions:string[];data:string[];depth:number};
const editable=(t:ManagedBriefTemplate):Editable=>({sections:[...t.sections],questions:[...t.questions],instructions:[...t.instructions],data:[...t.data],depth:t.depth});
const lines=(s:string)=>s.split("\n").map(x=>x.trim()).filter(Boolean);

export default function BriefOverrides({template,mode}:{template:ManagedBriefTemplate;mode:BriefMode}){
 const [base,setBase]=useState(template);
 const [draft,setDraft]=useState<Editable>(()=>editable(template));
 const [message,setMessage]=useState("");
 const [conflict,setConflict]=useState(false);
 const [saving,setSaving]=useState(false);
 const fields=allowedBriefFields(mode,["cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","risks","dependencies","decisions","scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"]);
 const changed=JSON.stringify(draft)!==JSON.stringify(editable(base));

 async function latest(){
  const res=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
  if(!res.ok)throw Error("Catalogue indisponible");
  const body=await res.json() as {templates:ManagedBriefTemplate[]};
  return body.templates.find(t=>t.id===base.id);
 }
 async function checkRevision(){
  try{
   const current=await latest();
   if(!current||current.revision!==base.revision||!current.active){
    setConflict(true);setMessage("Le modèle a changé depuis l'ouverture. Rechargez sa dernière version avant de poursuivre ou d'enregistrer.");
    return false;
   }
   setMessage("Révision du modèle vérifiée. Vos ajustements restent locaux.");
   return true;
  }catch{setMessage("Impossible de vérifier la révision du modèle.");return false;}
 }
 async function reload(){
  try{
   const current=await latest();
   if(!current||!current.active){setConflict(true);setMessage("Ce modèle n'est plus disponible.");return;}
   setBase(current);setDraft(editable(current));setConflict(false);setMessage("Configuration enregistrée du modèle rechargée. Aucun brouillon sauvegardé.");
  }catch{setMessage("Rechargement impossible.");}
 }
 async function saveModel(){
  if(base.builtin){setMessage("Les modèles initiaux sont protégés. Dupliquez le modèle dans l'administration.");return;}
  setSaving(true);
  try{
   if(!await checkRevision())return;
   const res=await fetch("/api/admin/ai-briefs/templates",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"update",id:base.id,revision:base.revision,template:{title:base.title,description:base.description,...draft}})});
   if(res.status===409){setConflict(true);setMessage("Conflit de révision : rechargez le modèle avant de réessayer.");return;}
   if(!res.ok)throw Error("Enregistrement refusé");
   const result=await res.json() as {revision:number};
   setBase({...base,...draft,revision:result.revision});
   setConflict(false);setMessage("Nouvelle révision du modèle enregistrée explicitement.");
  }catch{setMessage("Enregistrement impossible.");}
  finally{setSaving(false);}
 }
 return <section className="border rounded-3 p-3 mt-3" aria-label="Ajustements ponctuels du brief">
  <h3 className="h5">Adapter ce brief uniquement</h3>
  <p className="small text-secondary">Modèle : {base.title} · Révision {base.revision}. Les changements ci-dessous restent en mémoire dans cette page, sans enregistrement automatique.</p>
  {conflict&&<div className="alert alert-warning" role="alert">Le modèle a été modifié ou désactivé. Rechargez sa configuration avant de continuer.</div>}
  <fieldset disabled={conflict||saving}>
   <div className="row g-3">
    {(["sections","questions","instructions"] as const).map(key=><div className="col-12 col-lg-4" key={key}>
     <label className="form-label" htmlFor={"override-"+key}>{({sections:"Rubriques (ordre des lignes)",questions:"Questions",instructions:"Consignes"})[key]}</label>
     <textarea className="form-control" id={"override-"+key} rows={6} value={draft[key].join("\n")} onChange={e=>setDraft({...draft,[key]:lines(e.target.value)})}/>
    </div>)}
    <div className="col-12 col-lg-4"><label className="form-label" htmlFor="override-depth">Profondeur historique (1–5)</label>
     <input className="form-control" type="number" min={1} max={5} id="override-depth" value={draft.depth} onChange={e=>setDraft({...draft,depth:Number(e.target.value)})}/></div>
    <div className="col-12"><p className="mb-2">Sélection des données collectives ({mode})</p>
     <div className="row g-2">{fields.map(field=><label className="col-12 col-md-6 col-xl-4 form-check" key={field}>
      <input type="checkbox" className="form-check-input" checked={draft.data.includes(field)} onChange={e=>setDraft({...draft,data:e.target.checked?[...draft.data,field]:draft.data.filter(x=>x!==field)})}/> {field}
     </label>)}</div>
    </div>
   </div>
  </fieldset>
  <div className="d-flex flex-wrap gap-2 mt-3">
   <button className="btn btn-outline-primary btn-sm" onClick={()=>void checkRevision()} disabled={saving}>Actualiser le contenu / vérifier la révision</button>
   <button className="btn btn-outline-secondary btn-sm" onClick={()=>void reload()} disabled={saving}>Recharger le modèle (abandonner les ajustements)</button>
   {!base.builtin&&<button className="btn btn-primary btn-sm" disabled={!changed||conflict||saving} onClick={()=>void saveModel()}>Enregistrer le modèle</button>}
  </div>
  {changed&&!conflict&&<p className="text-secondary small mt-2">Configuration ponctuelle modifiée : aucune écriture métier. La composition et l'archivage du TXT seront ajoutés dans les prochaines stories.</p>}
  {message&&<p role="status" className="mt-2 mb-0">{message}</p>}
 </section>;
}
