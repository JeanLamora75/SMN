"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Member={id:string;displayName:string;isProvisional:boolean;memberNumber:number;archived:boolean;isAssigned:boolean;roleShares:{scrumMaster:number;productOwner:number;developer:number}};
type Roster={team:{id:string;name:string;mode:string};members:Member[]};
type View="cards"|"list";
const CHOICE="smn-team-roster-view";
export default function TeamOverview(){
 const t=useTranslation();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [view,setView]=useState<View>("cards");
 const [creationOpen,setCreationOpen]=useState(false);
 const [newName,setNewName]=useState("");
 const [creating,setCreating]=useState(false);
 const [createError,setCreateError]=useState("");
 const requestId=useRef<string|null>(null);
 useEffect(()=>{try{if(localStorage.getItem(CHOICE)==="list")setView("list");}catch{}},[]);
 useEffect(()=>{let alive=true;fetch("/api/admin/members",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("members");return r.json() as Promise<Roster>;})
  .then(v=>{if(alive){setRoster(v);setStatus("ready");}})
  .catch(()=>{if(alive)setStatus("error");});return()=>{alive=false;};},[]);
 function choose(next:View){setView(next);try{localStorage.setItem(CHOICE,next);}catch{}}
 async function createOne(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!roster||creating||!newName.trim())return;
  setCreating(true);setCreateError("");
  requestId.current??=crypto.randomUUID();
  try{
   const r=await fetch("/api/admin/members",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId:roster.team.id,displayName:newName.trim(),requestId:requestId.current})});
   const body=await r.json() as {error?:string};
   if(!r.ok)throw Error(body.error??"service");
   const refreshed=await fetch("/api/admin/members",{cache:"no-store"});
   if(!refreshed.ok)throw Error("refresh-failed");
   setRoster(await refreshed.json() as Roster);
   setCreationOpen(false);setNewName("");requestId.current=null;
  }catch(err){setCreateError(err instanceof Error?err.message:"service");}
  finally{setCreating(false);}
 }
 const members=(roster?.members??[]).filter(m=>!m.archived);
 const capacity=Math.max(12,Math.ceil((members.length+1)/6)*6);
 const roles=(m:Member)=>([["SM",m.roleShares?.scrumMaster],["PO",m.roleShares?.productOwner],["Dev",m.roleShares?.developer]] as const);
 return <section className="smn-panel p-4">
  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
   <div><h1 className="h3 mb-1">{roster?.team.name??t("members.teamTitle")}</h1>
    <p className="text-secondary mb-0">{members.length} membres actifs</p></div>
   <div className="btn-group" role="group" aria-label="Mode d’affichage">
    <button type="button" className={"btn "+(view==="cards"?"btn-primary":"btn-outline-secondary")} aria-label="Vue cartes" aria-pressed={view==="cards"} onClick={()=>choose("cards")}>▦</button>
    <button type="button" className={"btn "+(view==="list"?"btn-primary":"btn-outline-secondary")} aria-label="Vue liste" aria-pressed={view==="list"} onClick={()=>choose("list")}>☷</button>
   </div>
  </div>
  {status==="loading"&&<p role="status">{t("members.loading")}</p>}
  {status==="error"&&<p role="alert">{t("members.loadFailed")}</p>}
  {status==="ready"&&members.length===0&&<div className="alert alert-info mb-3">L’équipe n’a pas encore été initialisée. <Link href="/app/admin/members/manage" className="alert-link">Initialiser les membres de l’équipe</Link></div>}
  {status==="ready"&&view==="cards"&&<div className="row row-cols-2 row-cols-md-3 row-cols-xl-6 g-3">
   {Array.from({length:capacity},(_,i)=>{const m=members[i];
    return <div className="col" key={m?.id??"slot-"+i}>
     {m?<Link href={"/app/admin/members/"+encodeURIComponent(m.id)} className="card text-decoration-none text-body h-100 rounded-4 shadow-sm" style={{minHeight:180}}>
       <div className="card-body d-flex flex-column align-items-center text-center gap-2">
        <strong className="text-truncate w-100" title={m.displayName}>{m.displayName}</strong>
        <span className="rounded-circle border bg-body-tertiary d-flex align-items-center justify-content-center" style={{width:62,height:62,fontSize:32}} aria-hidden="true">♙</span>
        <div className="d-flex gap-1 flex-wrap justify-content-center">{roles(m).map(([name,share])=><span key={name} className={"badge "+((share??0)>0?"text-bg-primary":"text-bg-secondary opacity-50")}>{name}</span>)}</div>
        <small className="text-secondary">{m.isAssigned?"Membre de l’équipe":"Non affecté"}</small>
       </div>
      </Link>:i===members.length?<button type="button" onClick={()=>setCreationOpen(true)} disabled={members.length===0} className="card h-100 w-100 rounded-4 border-primary text-primary bg-transparent" style={{minHeight:180}} aria-label="Ajouter un membre">
        <span className="m-auto display-5">+</span>
       </button>:<div className="rounded-4 h-100" aria-hidden="true" style={{minHeight:180,border:"2px dashed var(--bs-border-color)",background:"var(--bs-tertiary-bg)"}}/>}
    </div>})}
  </div>}
  {status==="ready"&&view==="list"&&<div className="table-responsive"><table className="table table-hover align-middle">
   <thead><tr><th>Membre</th><th>SM</th><th>PO</th><th>Dev</th><th>Fiche</th></tr></thead>
   <tbody>{members.map(m=><tr key={m.id}><th>{m.displayName}</th>{roles(m).map(([name,share])=><td key={name}>{(share??0)>0?"✓":"—"}</td>)}<td><Link href={"/app/admin/members/"+encodeURIComponent(m.id)} className="btn btn-outline-primary btn-sm">Consulter</Link></td></tr>)}</tbody>
  </table><button className="btn btn-primary" disabled={members.length===0} onClick={()=>setCreationOpen(true)}>+ Ajouter un membre</button></div>}
  {creationOpen&&<div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="team-create-title" style={{background:"rgba(0,0,0,.5)"}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title fs-5" id="team-create-title">Ajouter un membre</h2>
     <button className="btn-close" aria-label="Fermer" onClick={()=>setCreationOpen(false)}/></div>
    <form onSubmit={e=>void createOne(e)}>
     <div className="modal-body">
      <label className="form-label" htmlFor="new-team-member">Nom du membre</label>
      <input id="new-team-member" className="form-control" maxLength={120} required autoFocus
       value={newName} disabled={creating}
       onChange={e=>{setNewName(e.target.value);setCreateError("");requestId.current=null;}}/>
      <p className="small text-secondary mt-2">Rôle Agile initial : Développeur. Modifiable dans la fiche du membre.</p>
      {createError&&<p role="alert" className="alert alert-warning">Création impossible : {createError}</p>}
     </div>
     <div className="modal-footer">
      <button type="button" className="btn btn-secondary" disabled={creating} onClick={()=>setCreationOpen(false)}>Annuler</button>
      <button type="submit" className="btn btn-primary" disabled={creating||!newName.trim()}>Créer le membre</button>
     </div>
    </form>
   </div></div></div>}
 </section>;
}
