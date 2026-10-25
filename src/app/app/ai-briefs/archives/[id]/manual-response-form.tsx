"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function AddManualResponse({archiveId}:{archiveId:string}){
 const [text,setText]=useState("");
 const [provider,setProvider]=useState("");
 const [model,setModel]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const router=useRouter();
 async function save(){
  if(!text.trim())return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/ai-briefs/archives/"+encodeURIComponent(archiveId)+"/responses",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,provider,model})
   });
   if(!response.ok)throw Error("Enregistrement de la réponse impossible");
   setText("");setProvider("");setModel("");
   setMessage("Réponse collée enregistrée, sans appel à une IA ni vérification factuelle automatique.");
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur d'enregistrement");}
  finally{setBusy(false);}
 }
 return <section className="border rounded-3 p-3 mt-4">
  <h2 className="h5">Ajouter une réponse IA reçue manuellement</h2>
  <p className="small text-secondary">Collez uniquement une réponse déjà obtenue hors de SMN. Le texte original du brief ne sera pas modifié. SMN ne vérifie pas les affirmations de l&apos;IA.</p>
  <label htmlFor="manual-ai-answer" className="form-label">Réponse IA</label>
  <textarea id="manual-ai-answer" className="form-control" rows={9} maxLength={250000} value={text} onChange={e=>setText(e.target.value)}/>
  <div className="row g-3 mt-1">
   <div className="col-md-6"><label className="form-label" htmlFor="manual-ai-provider">Fournisseur (facultatif)</label><input id="manual-ai-provider" className="form-control" maxLength={120} value={provider} onChange={e=>setProvider(e.target.value)}/></div>
   <div className="col-md-6"><label className="form-label" htmlFor="manual-ai-model">Modèle (facultatif)</label><input id="manual-ai-model" className="form-control" maxLength={120} value={model} onChange={e=>setModel(e.target.value)}/></div>
  </div>
  <button type="button" className="btn btn-primary mt-3" disabled={busy||!text.trim()} onClick={()=>void save()}>Enregistrer la réponse collée</button>
  {message&&<p className="mt-2" role="status">{message}</p>}
 </section>;
}
