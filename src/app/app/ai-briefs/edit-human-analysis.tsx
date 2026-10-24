"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function EditHumanAnalysis({analysis}:{analysis:{id:string;content:string}}){
 const [editing,setEditing]=useState(false);
 const [content,setContent]=useState(analysis.content);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const router=useRouter();
 async function save(){
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/ai-briefs/human-analyses",{method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:analysis.id,content})});
   if(!res.ok)throw Error("Modification impossible");
   setEditing(false);router.refresh();setMessage("Analyse humaine actualisée.");
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}
  finally{setBusy(false);}
 }
 return <div className="mt-2">
  {!editing?<button className="btn btn-outline-secondary btn-sm" onClick={()=>setEditing(true)}>Modifier l’analyse humaine</button>:
   <><textarea className="form-control" rows={6} value={content} onChange={e=>setContent(e.target.value)}/>
    <button className="btn btn-primary btn-sm mt-2" disabled={busy||!content.trim()} onClick={()=>void save()}>Enregistrer</button>
    <button className="btn btn-outline-secondary btn-sm mt-2 ms-2" onClick={()=>setEditing(false)}>Annuler</button></>}
  {message&&<p role="status">{message}</p>}
 </div>;
}
