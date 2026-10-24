"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function HumanAnalysisForm({mode,cycleId,archiveId}:{mode:"scrum"|"kanban";cycleId:string;archiveId?:string}){
 const [scope,setScope]=useState("Bilan collectif");
 const [content,setContent]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const router=useRouter();
 async function save(){
  if(!scope.trim()||!content.trim())return;
  setBusy(true);setMessage("");
  try{
   const result=await fetch("/api/ai-briefs/human-analyses",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,cycleId,archiveId:archiveId??null,scope,content})});
   if(!result.ok)throw Error("Enregistrement impossible");
   setContent("");setMessage("Analyse humaine enregistrée, sans appel IA ni modification des métriques.");
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}finally{setBusy(false);}
 }
 return <section className="border rounded-3 p-3 mt-4">
  <h2 className="h5">Nouvelle analyse humaine</h2>
  <p className="small text-secondary">Interprétation rédigée par un humain ; ce texte ne constitue pas une mesure vérifiée ni une réponse IA. Le rattachement à un brief est facultatif.</p>
  <label className="form-label" htmlFor="human-scope">Sujet ou périmètre</label>
  <input id="human-scope" className="form-control" maxLength={160} value={scope} onChange={e=>setScope(e.target.value)}/>
  <label className="form-label mt-2" htmlFor="human-analysis-content">Analyse humaine</label>
  <textarea id="human-analysis-content" className="form-control" rows={7} value={content} maxLength={200000} onChange={e=>setContent(e.target.value)}/>
  <button className="btn btn-primary mt-3" type="button" disabled={busy||!scope.trim()||!content.trim()} onClick={()=>void save()}>Enregistrer l'analyse humaine</button>
  {message&&<p role="status" className="mt-2">{message}</p>}
 </section>;
}
