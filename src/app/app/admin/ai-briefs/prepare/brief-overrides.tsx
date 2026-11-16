"use client";
import {useRef,useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import type {BriefMode} from "@/lib/ai-brief-templates";
import type {BriefFact} from "@/server/ai-briefs/facts";
import {resolveBriefPrompt} from "@/lib/ai-brief-tag-resolver";
import {canApproveBrief} from "@/lib/ai-brief-review";
import OfficeTagConfigurator from "../../../reports/office-tag-configurator";
import {insertPromptTag} from "@/lib/ai-brief-tag-insertion";

type Historic={id:string;type:"human"|"ai";origin:string;createdAt:string;content:string;cycleId:string};
type Cycle={id:string;teamId:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};
const sanitize=(text:string)=>text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");
export default function BriefOverrides({template,mode,context,facts,preparedAt,historical,indicators}:{
 template:ManagedBriefTemplate;mode:BriefMode;context:Cycle;facts:Record<string,BriefFact>;preparedAt:string;historical:Historic[];
 indicators:readonly {tag:string;value:string|null;unit:string;source:string;available:boolean;reason:string|null}[];
}){
 const [base,setBase]=useState(template);
 const [prompt,setPrompt]=useState(template.promptText);
 const [observations,setObservations]=useState("");
 const [selectedHistory,setSelectedHistory]=useState<string[]>([]);
 const [activeView,setActiveView]=useState<"edit"|"preview">("edit");
 const [preview,setPreview]=useState<string|null>(null);
 const [reviewedText,setReviewedText]=useState<string|null>(null);
 const [privacyReviewed,setPrivacyReviewed]=useState(false);
 const [revisionChecked,setRevisionChecked]=useState(false);
 const [conflict,setConflict]=useState(false);
 const [saving,setSaving]=useState(false);
 const [finalizedId,setFinalizedId]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const input=useRef<HTMLTextAreaElement>(null);
 const cursor=useRef({start:0,end:0});
 const resolved=resolveBriefPrompt({promptText:prompt,mode,context,facts,preparedAt,indicators});
 const chosen=historical.filter(x=>selectedHistory.includes(x.type+":"+x.id));
 const historyText=chosen.length?"\nANALYSES HISTORIQUES AJOUTÉES EXPLICITEMENT\n"+chosen.map(x=>
  "- "+x.type+" | "+x.createdAt+" | "+x.origin+" | cycle "+x.cycleId+"\n"+sanitize(x.content)).join("\n"):"";
 const observationsText=observations.trim()?"\nOBSERVATIONS DE L'UTILISATEUR\n"+sanitize(observations.trim()):"";
 const currentTxt=[
  "BRIEF IA — TEXTE BRUT",
  "Équipe : "+context.team,"Produit : "+(context.product??"Non renseigné"),
  "Mode : "+mode,"Cycle : "+context.name,"Identifiant du cycle : "+context.id,
  "Dates : "+context.startAt+" — "+context.endAt+" ("+context.timeZone+")",
  "Statut : "+context.status,"Date de préparation : "+preparedAt,
  "Modèle : "+base.title+" (révision "+base.revision+")",
  context.status==="closed"?"":"ATTENTION : données provisoires, cycle non clôturé.",
  "",resolved.text,observationsText,historyText,
  "Transmission à une IA : manuelle uniquement."
 ].filter(x=>x!==null).join("\n").replace(/\n{3,}/g,"\n\n").trimEnd()+"\n";
 const approved=resolved.safe&&canApproveBrief({preview,currentTxt,reviewedText,privacyReviewed,revisionChecked,conflict});
 function invalidate(){setPreview(null);setPrivacyReviewed(false);setReviewedText(null);setRevisionChecked(false);setFinalizedId(null);}
 async function latest(){
  const result=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
  if(!result.ok)throw Error("Catalogue indisponible");
  const json=await result.json() as {templates:ManagedBriefTemplate[]};
  return json.templates.find(x=>x.id===base.id);
 }
 async function checkRevision(){
  try{
   const last=await latest();
   if(!last||!last.active||last.revision!==base.revision){
    setConflict(true);setRevisionChecked(false);setPrivacyReviewed(false);setReviewedText(null);
    setMessage("Le modèle a changé. Rechargez sa nouvelle version pour reprendre.");
    return false;
   }
   setRevisionChecked(true);
   return true;
  }catch{
   setRevisionChecked(false);setPrivacyReviewed(false);setReviewedText(null);
   setMessage("Impossible de vérifier la révision du modèle.");
   return false;
  }
 }
 async function loadLatest(){
  try{
   const last=await latest();
   if(!last||!last.active)throw Error("Modèle indisponible");
   setBase(last);setPrompt(last.promptText);setObservations("");setSelectedHistory([]);
   invalidate();setConflict(false);setActiveView("edit");setMessage("Dernière version rechargée.");
  }catch(e){setMessage(e instanceof Error?e.message:"Rechargement impossible.");}
 }
 async function generatePreview(){
  if(!await checkRevision())return;
  setPreview(currentTxt);setPrivacyReviewed(false);setReviewedText(null);setActiveView("preview");
  setMessage(resolved.safe?"Aperçu généré : relisez-le entièrement avant confirmation.":"Aperçu généré avec des tags non résolus : copie et archivage interdits.");
 }
 async function finalize(){
  if(!approved||preview===null||finalizedId!==null)return;
  setSaving(true);
  try{
   if(!await checkRevision()||!resolved.safe||preview!==currentTxt||reviewedText!==preview||!privacyReviewed)
    throw Error("La version validée n'est plus à jour. Recommencez la revue.");
   const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(preview));
   const approvedSha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
   const res=await fetch("/api/admin/ai-briefs/finalize",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,cycleId:context.id,templateId:base.id,templateRevision:base.revision,txt:preview,approvedSha256,reviewConfirmed:true})});
   const data=await res.json() as {ok?:boolean;id?:string;error?:string};
   if(!res.ok||!data.ok||!data.id)throw Error(data.error??"Archivage non confirmé.");
   setFinalizedId(data.id);setMessage("TXT archivé sans modification : "+data.id);
  }catch(e){setMessage(e instanceof Error?e.message:"Archivage impossible.");}
  finally{setSaving(false);}
 }
 function insertTag(tag:string){
  const {start,end}=cursor.current;
  const result=insertPromptTag(prompt,tag,start,end);
  setPrompt(result.text);
  const n=result.cursor;cursor.current={start:n,end:n};invalidate();
  requestAnimationFrame(()=>{input.current?.focus();input.current?.setSelectionRange(n,n);});
 }
 return <section className="border rounded-3 p-3 mt-3" aria-label="Préparation du prompt IA">
  <h3 className="h5">Rédiger et prévisualiser le prompt</h3>
  <p className="small text-secondary">Modèle {base.title} · révision {base.revision}. Les modifications restent propres à ce brief, sans modifier le modèle.</p>
  {conflict&&<p role="alert" className="alert alert-warning">La version du modèle a changé. Rechargez-le avant de poursuivre.</p>}
  <div className="btn-group d-lg-none mb-3" role="group" aria-label="Mode de travail">
   <button type="button" className={"btn btn-sm "+(activeView==="edit"?"btn-primary":"btn-outline-primary")} onClick={()=>setActiveView("edit")} aria-pressed={activeView==="edit"}>Rédiger</button>
   <button type="button" className={"btn btn-sm "+(activeView==="preview"?"btn-primary":"btn-outline-primary")} onClick={()=>setActiveView("preview")} aria-pressed={activeView==="preview"}>Aperçu</button>
  </div>
  <div className="row g-3">
   <div className={"col-12 col-lg-6 "+(activeView==="preview"?"d-none d-lg-block":"")}>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
     <label htmlFor="brief-prompt" className="form-label fw-semibold mb-0">Prompt du brief</label>
     <OfficeTagConfigurator locale="fr" teamId={context.teamId} onInsert={insertTag}/>
    </div>
    <textarea ref={input} id="brief-prompt" rows={20} maxLength={100000} className="form-control font-monospace"
     value={prompt} disabled={conflict||saving}
     onSelect={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onChange={e=>{setPrompt(e.target.value);cursor.current={start:e.target.selectionStart,end:e.target.selectionEnd};invalidate();}}/>
    <label htmlFor="brief-observations" className="form-label fw-semibold mt-3">Observations complémentaires</label>
    <textarea id="brief-observations" className="form-control" rows={3} maxLength={12000} value={observations}
     disabled={conflict||saving} onChange={e=>{setObservations(e.target.value);invalidate();}}/>
    <details className="border rounded-3 p-3 mt-3">
     <summary className="fw-semibold">Analyses historiques (inclusion facultative)</summary>
     <p className="small text-secondary mt-2">Aucune analyse n'est incluse par défaut. Leur contenu sera visible dans le TXT avant validation.</p>
     {historical.map(x=><label className="d-block small my-2" key={x.type+":"+x.id}>
      <input className="form-check-input me-2" type="checkbox" disabled={conflict||saving}
       checked={selectedHistory.includes(x.type+":"+x.id)}
       onChange={e=>{const k=x.type+":"+x.id;setSelectedHistory(old=>e.target.checked?[...old,k]:old.filter(v=>v!==k));invalidate();}}/>
      {x.type==="ai"?"Réponse IA":"Analyse humaine"} · {x.createdAt} · {x.origin} · {x.content.slice(0,100)}
     </label>)}
     {historical.length===0&&<p className="small text-secondary">Aucune analyse disponible.</p>}
    </details>
   </div>
   <div className={"col-12 col-lg-6 "+(activeView==="edit"?"d-none d-lg-block":"")}>
    <label htmlFor="brief-txt-preview" className="form-label fw-semibold">Aperçu TXT intégral</label>
    <textarea id="brief-txt-preview" className="form-control font-monospace" rows={20} readOnly value={preview??""} placeholder="Générez un aperçu pour le relire."/>
    {resolved.diagnostics.length>0&&<div className="alert alert-warning mt-3" role="alert">
     <strong>Tags à corriger avant toute copie ou archivage</strong>
     <ul className="mb-0">{resolved.diagnostics.map((x,i)=><li key={i}><code>{x.tag}</code> : {x.reason}</li>)}</ul>
    </div>}
    {preview!==null&&<div className="border rounded p-3 mt-3">
     <label className="form-check-label" htmlFor="brief-privacy-reviewed">
      <input id="brief-privacy-reviewed" className="form-check-input me-2" type="checkbox"
       disabled={saving||conflict||!revisionChecked||!resolved.safe||preview!==currentTxt}
       checked={approved} onChange={e=>{setPrivacyReviewed(e.target.checked);setReviewedText(e.target.checked?preview:null);}}/>
      J'ai relu intégralement cette version exacte et vérifié la confidentialité des informations avant tout partage.
     </label>
    </div>}
   </div>
  </div>
  <div className="d-flex flex-wrap gap-2 mt-3">
   <button type="button" className="btn btn-primary" disabled={saving||conflict||!prompt.trim()} onClick={()=>void generatePreview()}>Générer l'aperçu</button>
   <button type="button" className="btn btn-outline-secondary" disabled={saving} onClick={()=>void loadLatest()}>Recharger le modèle</button>
   <button type="button" className="btn btn-outline-primary" disabled={saving||!approved} onClick={async()=>{
    if(!approved||!await checkRevision()||!preview||preview!==currentTxt)return;
    try{await navigator.clipboard.writeText(preview);setMessage("TXT copié. Aucun appel IA effectué.");}
    catch{setMessage("Copie impossible : sélectionnez manuellement le texte de l'aperçu.");}
   }}>Copier le TXT validé</button>
   <button type="button" className="btn btn-primary" disabled={saving||!approved||finalizedId!==null} onClick={()=>void finalize()}>Finaliser et archiver</button>
  </div>
  <p className="alert alert-info mt-3 mb-2"><strong>Transmission exclusivement manuelle.</strong> SMN n'appelle aucun fournisseur d'IA. Aucune donnée ou archive n'est créée lors de la simple consultation.</p>
  {finalizedId&&<p role="status" className="alert alert-success">Archive immuable créée : {finalizedId}</p>}
  {message&&<p role="status" className="small mb-0">{message}</p>}
 </section>;
}
