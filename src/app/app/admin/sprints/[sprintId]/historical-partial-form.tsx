"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function HistoricalPartialForm({sprintId}:{sprintId:string}){
 const router=useRouter(),[open,setOpen]=useState(false),[goalTitle,setGoalTitle]=useState(""),
 [goalDescription,setGoalDescription]=useState(""),[reviewComment,setReviewComment]=useState(""),
 [source,setSource]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function save(e:React.FormEvent){
  e.preventDefault();setError("");setNotice("");
  if(!goalTitle.trim()&&!reviewComment.trim()){setError("Renseignez au moins un objectif ou un commentaire retrouvé.");return;}
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/historical-partial",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,goalTitle,goalDescription,reviewComment,source})});
   const result=await response.json();
   if(!response.ok){setError(result.error==="review-already-present"?"Une analyse manuelle existe déjà : modifiez-la dans l'onglet Rétrospective.":"Enregistrement refusé. Vérifiez que le Sprint est terminé et non clôturé.");return;}
   setNotice("Informations historiques enregistrées avec provenance, sans évaluation automatique.");
   setGoalTitle("");setGoalDescription("");setReviewComment("");setOpen(false);router.refresh();
  }catch{setError("Service indisponible.");}finally{setBusy(false);}
 }
 return <section className="my-3">
  <button className="btn btn-outline-primary btn-sm" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>Renseigner un bilan historique partiel</button>
  {notice&&<p className="alert alert-success mt-2" role="status">{notice}</p>}
  {error&&<p className="alert alert-warning mt-2" role="alert">{error}</p>}
  {open&&<form onSubmit={save} className="border rounded p-3 mt-2 d-grid gap-3">
   <p className="text-secondary small mb-0">Seuls les éléments retrouvés sont enregistrés. L&apos;objectif reste non évalué et aucun événement rétrospectif n&apos;est généré.</p>
   <label>Objectif retrouvé (facultatif)<input className="form-control" maxLength={240} value={goalTitle} onChange={e=>setGoalTitle(e.target.value)}/></label>
   {goalTitle.trim()&&<label>Description retrouvée (facultative)<textarea className="form-control" maxLength={2000} value={goalDescription} onChange={e=>setGoalDescription(e.target.value)}/></label>}
   <label>Commentaires rétrospectifs retrouvés (facultatifs)<textarea className="form-control" maxLength={3000} value={reviewComment} onChange={e=>setReviewComment(e.target.value)}/></label>
   <label>Source des informations (facultative)<input className="form-control" maxLength={500} value={source} onChange={e=>setSource(e.target.value)}/></label>
   <div><button className="btn btn-primary btn-sm" disabled={busy||(!goalTitle.trim()&&!reviewComment.trim())} type="submit">{busy?"Enregistrement…":"Enregistrer le bilan partiel"}</button></div>
  </form>}
 </section>;
}
