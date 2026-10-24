"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function ManualResponseActions({archiveId,response}:{archiveId:string;response:{id:string;response_text:string;provider:string|null;model:string|null}}){
 const [editing,setEditing]=useState(false);
 const [text,setText]=useState(response.response_text);
 const [provider,setProvider]=useState(response.provider??"");
 const [model,setModel]=useState(response.model??"");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const router=useRouter();
 const url="/api/ai-briefs/archives/"+encodeURIComponent(archiveId)+"/responses/"+encodeURIComponent(response.id);
 async function act(action:"update"|"delete"){
  if(action==="delete"&&!window.confirm("Supprimer volontairement cette réponse IA active ? Le TXT archivé restera intact."))return;
  setBusy(true);setMessage("");
  try{
   const res=await fetch(url,{method:action==="update"?"PUT":"DELETE",
    ...(action==="update"?{headers:{"Content-Type":"application/json"},body:JSON.stringify({text,provider,model})}:{})});
   if(!res.ok)throw new Error("Modification refusée.");
   setEditing(false);router.refresh();
   setMessage(action==="update"?"Réponse mise à jour.":"Réponse supprimée volontairement.");
  }catch(e){setMessage(e instanceof Error?e.message:"Échec de l'opération.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2">
  {!editing?<button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setEditing(true)}>Modifier la réponse</button>:
   <div className="d-grid gap-2">
    <label className="form-label" htmlFor={"response-edit-"+response.id}>Réponse IA modifiée</label>
    <textarea id={"response-edit-"+response.id} className="form-control" rows={10} value={text} onChange={e=>setText(e.target.value)}/>
    <label className="form-label">Fournisseur (facultatif)<input className="form-control" value={provider} maxLength={120} onChange={e=>setProvider(e.target.value)}/></label>
    <label className="form-label">Modèle (facultatif)<input className="form-control" value={model} maxLength={120} onChange={e=>setModel(e.target.value)}/></label>
    <div className="d-flex gap-2"><button type="button" className="btn btn-primary btn-sm" disabled={busy||!text.trim()} onClick={()=>void act("update")}>Enregistrer les modifications</button>
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setEditing(false)}>Annuler</button></div>
   </div>}
  <button type="button" className="btn btn-outline-danger btn-sm ms-2" disabled={busy} onClick={()=>void act("delete")}>Supprimer la réponse active</button>
  {message&&<p role="status" className="small mt-2">{message}</p>}
 </div>;
}
