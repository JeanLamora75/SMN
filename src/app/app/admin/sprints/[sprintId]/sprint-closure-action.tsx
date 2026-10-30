"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";

type Props={sprintId:string;teamId:string;status:string;canManage:boolean};
export default function SprintClosureAction({sprintId,teamId,status,canManage}:Props){
 const router=useRouter(),dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false),[confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const available=status==="finished"||status==="closed";
 const closing=status==="finished";
 useEffect(()=>{
  const element=dialog.current;
  if(open&&element&&!element.open)element.showModal();
  return ()=>{if(element?.open)element.close();};
 },[open]);
 const dismiss=()=>{if(!busy){setOpen(false);setConfirmed(false);setError("");}};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!confirmed||busy||!available||!canManage)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/sprints/closure?"+new URLSearchParams({teamId}),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,action:closing?"close":"reopen"})
   });
   const result=await response.json();
   if(!response.ok||!result.ok){
    setError(result.error==="invalid-transition"?"Le statut du Sprint a changé. Recharge la page.":result.error==="not-found"?"Sprint introuvable dans l’équipe active.":"Impossible de modifier la clôture du Sprint.");
    return;
   }
   dismiss();
   router.refresh();
  }catch{setError("Erreur réseau lors de la modification du Sprint.");}
  finally{setBusy(false);}
 }
 return <>
  <button type="button" className="smn-sprint-status-pill"
   title={available&&canManage?"Modifier la clôture du Sprint":"Statut du Sprint"}
   disabled={!available||!canManage}
   onClick={()=>{setConfirmed(false);setError("");setOpen(true);}}>
   {status==="closed"?"Clôturé":status==="finished"?"Terminé":status}
  </button>
  {open&&<dialog ref={dialog} className="smn-sprint-edit-dialog"
   aria-labelledby="smn-sprint-closure-title" onCancel={event=>{event.preventDefault();dismiss();}}>
   <div className="modal-content smn-cockpit-modal">
    <div className="smn-cockpit-modal-header">
     <h2 className="h5 mb-0" id="smn-sprint-closure-title">{closing?"Clôturer le Sprint":"Rouvrir le Sprint"}</h2>
     <button type="button" className="btn-close" aria-label="Fermer" disabled={busy} onClick={dismiss}/>
    </div>
    <form className="smn-cockpit-modal-body d-grid gap-3" onSubmit={submit}>
     <label className="d-flex gap-2 align-items-start">
      <input className="form-check-input mt-1" type="checkbox" checked={confirmed}
       disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/>
      <span>{closing?"Je confirme la clôture du Sprint. Son bilan sera figé et historisé.":"Je confirme la réouverture du Sprint. Les clôtures précédentes restent historisées."}</span>
     </label>
     {error&&<p className="alert alert-warning mb-0" role="alert">{error}</p>}
     <div className="d-flex justify-content-end gap-2">
      <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={dismiss}>Annuler</button>
      <button type="submit" className="btn btn-primary" disabled={!confirmed||busy}>{busy?"Enregistrement…":closing?"Clôturer":"Rouvrir"}</button>
     </div>
    </form>
   </div>
  </dialog>}
 </>;
}
