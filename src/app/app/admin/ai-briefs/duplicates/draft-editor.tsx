"use client";
import {useState} from "react";
import Link from "next/link";

type Draft={
 id:string;parent_archive_id:string;mode:"scrum"|"kanban";cycle_id:string;
 template_id:string;template_revision:number;content:string;revision:number;
 finalized_archive_id:string|null;
};
export default function DraftEditor({initial}:{initial:Draft}){
 const [draft,setDraft]=useState(initial);
 const [content,setContent]=useState(initial.content);
 const [preview,setPreview]=useState<string|null>(null);
 const [reviewed,setReviewed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const clean=content===draft.content;
 const approved=clean&&preview===content&&reviewed;
 async function save(){
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/ai-briefs/duplicates/"+encodeURIComponent(draft.id),{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision:draft.revision,content})
   });
   if(!r.ok)throw Error(r.status===409?"Conflit : le brouillon a changé. Rechargez la page.":"Enregistrement impossible.");
   const result=await r.json() as {revision:number};
   setDraft({...draft,content,revision:result.revision});setPreview(null);setReviewed(false);
   setMessage("Brouillon enregistré. Une nouvelle revue de confidentialité est requise.");
  }catch(e){setMessage(e instanceof Error?e.message:"Enregistrement impossible.");}
  finally{setBusy(false);}
 }
 async function finalize(){
  if(!approved||busy)return;
  setBusy(true);setMessage("");
  try{
   const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(content));
   const approvedSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
   const r=await fetch("/api/admin/ai-briefs/finalize",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode:draft.mode,cycleId:draft.cycle_id,templateId:draft.template_id,
     templateRevision:draft.template_revision,txt:content,approvedSha256,reviewConfirmed:true,
     draftId:draft.id,draftRevision:draft.revision})
   });
   if(!r.ok)throw Error("Finalisation refusée : l'archive n'a pas été créée.");
   const archived=await r.json() as {id:string};
   setDraft({...draft,finalized_archive_id:archived.id});
   setMessage("Nouvelle archive finalisée : "+archived.id);
  }catch(e){setMessage(e instanceof Error?e.message:"Finalisation impossible.");}
  finally{setBusy(false);}
 }
 return <section className="smn-panel rounded-4 p-4 my-3">
  <h1 className="h4">Dupliquer et réviser un brief IA</h1>
  <p>Parent : <Link href={"/app/ai-briefs/archives/"+draft.parent_archive_id}>{draft.parent_archive_id}</Link></p>
  <p className="small text-secondary">Brouillon {draft.id} · révision {draft.revision}. Les analyses ou réponses IA du parent ne sont pas recopiées.</p>
  {draft.finalized_archive_id?<p className="alert alert-success">Copie finalisée : <Link href={"/app/ai-briefs/archives/"+draft.finalized_archive_id}>{draft.finalized_archive_id}</Link>. Modification interdite.</p>:
   <>
    <label className="form-label" htmlFor="duplicate-text">TXT de la copie (modifiable, parent inchangé)</label>
    <textarea id="duplicate-text" rows={24} className="form-control font-monospace" value={content}
     onChange={e=>{setContent(e.target.value);setPreview(null);setReviewed(false);}} disabled={busy}/>
    <div className="d-flex gap-2 flex-wrap my-3">
     <button type="button" className="btn btn-outline-primary" disabled={busy||clean||!content.trim()} onClick={()=>void save()}>Enregistrer le brouillon</button>
     <button type="button" className="btn btn-outline-secondary" disabled={busy||!clean} onClick={()=>{setPreview(content);setReviewed(false);}}>Prévisualiser toute la copie</button>
    </div>
    {preview!==null&&<div>
     <h2 className="h6">Texte intégral à finaliser</h2>
     <textarea className="form-control font-monospace" rows={18} readOnly value={preview} aria-label="Texte intégral de la copie"/>
     <div className="alert alert-warning mt-3">Vérifiez les noms, informations privées et secrets dans tous les textes libres. SMN ne garantit pas leur anonymisation.</div>
     <label className="form-check"><input className="form-check-input" type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>
      <span className="form-check-label">J'ai vérifié la confidentialité du texte exact affiché.</span></label>
    </div>}
    <button type="button" className="btn btn-primary mt-3" disabled={!approved||busy} onClick={()=>void finalize()}>Finaliser la nouvelle archive</button>
   </>}
  {message&&<p role="status" className="mt-3">{message}</p>}
 </section>;
}
