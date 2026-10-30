"use client";
import {useEffect,useState,type FormEvent} from "react";
type Profile={displayName:string;email:string|null;professionalFunction:string|null;revision:number;archived:boolean};
export default function MemberTeamProfileEditor({memberId,teamId,onSaved,onCancel}:{
 memberId:string;teamId:string;onSaved:(profile:Profile)=>void;onCancel:()=>void;
}){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[profession,setProfession]=useState("");
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/team-profile?"+
   new URLSearchParams({teamId}),{signal:ctrl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("load");return r.json() as Promise<Profile>})
   .then(p=>{if(ctrl.signal.aborted)return;setProfile(p);setName(p.displayName);
    setEmail(p.email??"");setProfession(p.professionalFunction??"");})
   .catch(()=>{if(!ctrl.signal.aborted)setError("Impossible de charger le profil du membre.");});
  return()=>ctrl.abort();
 },[memberId,teamId]);
 async function submit(e:FormEvent){
  e.preventDefault();if(!profile||busy)return;
  setBusy(true);setError("");
  try{
   const result=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/team-profile",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,revision:profile.revision,displayName:name.trim(),
     email:email.trim()||null,professionalFunction:profession.trim()||null})
   });
   const data=await result.json() as Profile&{error?:string};
   if(!result.ok){setError(data.error==="conflict"?
    "La fiche a été modifiée. Fermez puis rouvrez l'éditeur.":
    "Impossible d'enregistrer le profil.");return;}
   onSaved({...data,archived:false});
  }catch{setError("Service momentanément indisponible.");}
  finally{setBusy(false);}
 }
 return <div className="smn-member-profile-editor border rounded-3 p-3">
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {!profile&&!error?<p role="status">Chargement…</p>:
   <form onSubmit={submit} className="row g-3">
    <label className="col-md-6">Nom affiché<input className="form-control mt-1" required maxLength={120} value={name} disabled={busy||!profile||profile.archived} onChange={e=>setName(e.target.value)}/></label>
    <label className="col-md-6">Adresse e-mail<input className="form-control mt-1" type="email" maxLength={254} value={email} disabled={busy||!profile||profile.archived} onChange={e=>setEmail(e.target.value)}/></label>
    <label className="col-12">Fonction professionnelle<input className="form-control mt-1" maxLength={120} value={profession} disabled={busy||!profile||profile.archived} onChange={e=>setProfession(e.target.value)}/></label>
    <div className="col-12 d-flex gap-2 justify-content-end">
     <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>Annuler</button>
     <button type="submit" className="btn btn-primary" disabled={busy||!profile||profile.archived||!name.trim()}>Enregistrer</button>
    </div>
   </form>}
 </div>;
}
