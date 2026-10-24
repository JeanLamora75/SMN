"use client";
import {useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import {allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";
import {composeBriefTxt} from "@/lib/ai-brief-txt";
import type {BriefFact} from "@/server/ai-briefs/facts";

type Editable={sections:string[];questions:string[];instructions:string[];data:string[];depth:number};
const editable=(t:ManagedBriefTemplate):Editable=>({sections:[...t.sections],questions:[...t.questions],instructions:[...t.instructions],data:[...t.data],depth:t.depth});
const lines=(s:string)=>s.split("\n").map(x=>x.trim()).filter(Boolean);

export default function BriefOverrides({template,mode,context,facts,preparedAt}:{template:ManagedBriefTemplate;mode:BriefMode;context:{id:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};facts:Record<string,BriefFact>;preparedAt:string}){
 const [base,setBase]=useState(template);
 const [draft,setDraft]=useState<Editable>(()=>editable(template));
 const [message,setMessage]=useState("");
 const [conflict,setConflict]=useState(false);
 const [saving,setSaving]=useState(false);
 const [finalizedId,setFinalizedId]=useState<string|null>(null);
 const [preview,setPreview]=useState<string|null>(null);
 const [observations,setObservations]=useState("");
 const [humanQuestions,setHumanQuestions]=useState("");
 const [humanInstructions,setHumanInstructions]=useState("");
 const [privacyReviewed,setPrivacyReviewed]=useState(false);
 const [reviewedText,setReviewedText]=useState<string|null>(null);
 const fields=allowedBriefFields(mode,["cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","risks","dependencies","decisions","scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned","kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"]);
 const changed=JSON.stringify(draft)!==JSON.stringify(editable(base));
 const currentTxt=composeBriefTxt({context,mode,preparedAt,template:{...base,...draft,questions:[...draft.questions,...lines(humanQuestions)],instructions:[...draft.instructions,...lines(humanInstructions)]},facts,observations:lines(observations)});
 const approved=preview!==null&&reviewedText===preview&&preview===currentTxt&&privacyReviewed&&!conflict;
 async function finalize(){
  if(!approved||preview===null||finalizedId!==null)return;
  setSaving(true);
  try{
   if(!await checkRevision())return;
   const bytes=new TextEncoder().encode(preview);
   const digest=await crypto.subtle.digest("SHA-256",bytes);
   const approvedSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
   const response=await fetch("/api/admin/ai-briefs/finalize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,cycleId:context.id,templateId:base.id,templateRevision:base.revision,txt:preview,approvedSha256,reviewConfirmed:true})});
   if(!response.ok)throw Error("Archivage impossible : aucune finalisation confirmée.");
   const archive=await response.json() as {id:string};
   setFinalizedId(archive.id);setMessage("TXT archivé de manière immuable : "+archive.id);
  }catch(e){setMessage(e instanceof Error?e.message:"Archivage impossible.");}
  finally{setSaving(false);}
 }


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
   setBase(current);setDraft(editable(current));setPreview(null);setPrivacyReviewed(false);setReviewedText(null);setConflict(false);setMessage("Configuration enregistrée du modèle rechargée. Aucun brouillon sauvegardé.");
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
   setBase({...base,...draft,revision:result.revision});setPreview(null);setPrivacyReviewed(false);setReviewedText(null);
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
     <textarea className="form-control" id={"override-"+key} rows={6} value={draft[key].join("\n")} onChange={e=>{setDraft({...draft,[key]:lines(e.target.value)});setPrivacyReviewed(false);setReviewedText(null);setPreview(null);}}/>
    </div>)}
    <div className="col-12 col-lg-4"><label className="form-label" htmlFor="override-depth">Profondeur historique (1–5)</label>
     <input className="form-control" type="number" min={1} max={5} id="override-depth" value={draft.depth} onChange={e=>{setDraft({...draft,depth:Number(e.target.value)});setPrivacyReviewed(false);setReviewedText(null);setPreview(null);}}/></div>
    <div className="col-12"><p className="mb-2">Sélection des données collectives ({mode})</p>
     <div className="row g-2">{fields.map(field=><label className="col-12 col-md-6 col-xl-4 form-check" key={field}>
      <input type="checkbox" className="form-check-input" checked={draft.data.includes(field)} onChange={e=>{setDraft({...draft,data:e.target.checked?[...draft.data,field]:draft.data.filter(x=>x!==field)});setPrivacyReviewed(false);setReviewedText(null);setPreview(null);}}/> {field}
     </label>)}</div>
    </div>
   </div>
  </fieldset>
  <div className="border-top mt-3 pt-3">
   <h4 className="h6">Observations humaines et demandes à l’IA</h4>
   <p className="small text-secondary">Ces commentaires concernent uniquement le brief en cours. Ils ne modifient aucune métrique ni fiche métier.</p>
   <div className="row g-3">
    <div className="col-12"><label htmlFor="human-observations" className="form-label">Observations collectives (une par ligne)</label>
     <textarea id="human-observations" className="form-control" rows={4} maxLength={12000} value={observations} onChange={e=>{setObservations(e.target.value);setPreview(null);setPrivacyReviewed(false);}}/></div>
    <div className="col-12 col-lg-6"><label htmlFor="human-questions" className="form-label">Questions supplémentaires à l’IA (une par ligne)</label>
     <textarea id="human-questions" className="form-control" rows={4} maxLength={6000} value={humanQuestions} onChange={e=>{setHumanQuestions(e.target.value);setPreview(null);setPrivacyReviewed(false);}}/></div>
    <div className="col-12 col-lg-6"><label htmlFor="human-instructions" className="form-label">Consignes supplémentaires à l’IA (une par ligne)</label>
     <textarea id="human-instructions" className="form-control" rows={4} maxLength={6000} value={humanInstructions} onChange={e=>{setHumanInstructions(e.target.value);setPreview(null);setPrivacyReviewed(false);}}/></div>
   </div>
   <div className="form-check mt-3"><input type="checkbox" className="form-check-input" id="brief-privacy-reviewed" disabled={preview===null||preview!==currentTxt||conflict} checked={approved} onChange={e=>{setPrivacyReviewed(e.target.checked);setReviewedText(e.target.checked?preview:null);}}/>
    <label htmlFor="brief-privacy-reviewed" className="form-check-label">J’ai examiné le TXT intégral affiché et vérifié les noms, données privées et secrets éventuellement présents dans les textes libres. Je confirme cette version exacte uniquement.</label></div>
  </div>
  <div className="d-flex flex-wrap gap-2 mt-3">
   <button className="btn btn-primary btn-sm" disabled={conflict||saving} onClick={async()=>{if(!await checkRevision())return;setPreview(currentTxt);setPrivacyReviewed(false);setReviewedText(null);}}>Générer l’aperçu TXT</button>
   <button className="btn btn-outline-primary btn-sm" onClick={()=>void checkRevision()} disabled={saving}>Actualiser le contenu / vérifier la révision</button>
   <button className="btn btn-outline-secondary btn-sm" onClick={()=>void reload()} disabled={saving}>Recharger le modèle (abandonner les ajustements)</button>
   {!base.builtin&&<button className="btn btn-primary btn-sm" disabled={!changed||conflict||saving} onClick={()=>void saveModel()}>Enregistrer le modèle</button>}
  </div>
  <aside className="alert alert-info mt-3" aria-label="Transmission manuelle à une IA">
   <strong>Transmission manuelle uniquement.</strong> SMN ne contacte aucun service IA et ne crée aucune analyse automatiquement.
   Après validation de la confidentialité, vous choisissez librement si vous souhaitez copier le texte puis le coller vous-même dans un service extérieur.
   Les politiques de confidentialité, de conservation et de traitement de ce prestataire ne sont pas contrôlées par SMN.
   Les URL et instructions présentes dans un modèle sont du texte : elles ne déclenchent aucun appel réseau vers une IA.
  </aside>
  {approved&&!finalizedId&&<button className="btn btn-primary btn-sm mt-2 ms-2" disabled={saving} type="button" onClick={()=>void finalize()}>Finaliser et archiver le TXT validé</button>}
  {finalizedId&&<p className="alert alert-success mt-3" role="status">Brief finalisé et archivé sous l’identifiant {finalizedId}. Le texte ne peut pas être modifié.</p>}
  {approved&&<button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={async()=>{
   try{await navigator.clipboard.writeText(preview!);setMessage("TXT copié. Tout transfert à une IA reste une action manuelle hors de SMN.");}
   catch{setMessage("Copie impossible : sélectionnez le texte dans l’aperçu et copiez-le manuellement.");}
  }}>Copier le TXT validé</button>}
  {preview!==null&&!approved&&<p className="alert alert-warning mt-3" role="alert">Confidentialité non vérifiée : le TXT peut contenir des noms, informations privées ou secrets issus des textes libres. Relisez le texte intégral et confirmez cette version exacte avant tout partage.</p>}
  {preview!==null&&<div className="mt-3"><label htmlFor="brief-txt-preview" className="form-label fw-semibold">Aperçu TXT plat (non archivé)</label><textarea id="brief-txt-preview" className="form-control font-monospace" rows={20} readOnly value={preview}/><p className="small mt-2">{approved?"Version affichée vérifiée pour confidentialité (non archivée).":"Version non validée : aucun export ni finalisation possible."}</p></div>}
  {changed&&!conflict&&<p className="text-secondary small mt-2">Configuration ponctuelle modifiée : aucune écriture métier. La composition et l'archivage du TXT seront ajoutés dans les prochaines stories.</p>}
  {message&&<p role="status" className="mt-2 mb-0">{message}</p>}
 </section>;
}
