"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import MemberProfileEditor,{type EditableMember} from "../member-profile-editor";
import AssignmentEditor from "../assignment-editor";
import MemberCalendarEditor from "../member-calendar-editor";
import MemberLocationEditor from "../member-location-editor";
import MemberLifecycleEditor from "../member-lifecycle-editor";
type Member=EditableMember&{memberNumber:number;archived:boolean;isAssigned:boolean;startOn:string|null;
 email:string|null;roleShares:{scrumMaster:number;productOwner:number;developer:number}};
type Roster={team:{id:string;name:string};members:Member[]};
type Section="profile"|"assignment"|"calendar"|"location"|"lifecycle"|null;
export default function MemberDetail({id}:{id:string}){
 const [roster,setRoster]=useState<Roster|null>(null);
 const [loading,setLoading]=useState(true);
 const [section,setSection]=useState<Section>(null);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/members",{cache:"no-store"});
  if(!r.ok)throw Error("lecture indisponible");
  setRoster(await r.json() as Roster);
 },[]);
 useEffect(()=>{let alive=true;void fetch("/api/admin/members",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Roster>;})
  .then(data=>{if(alive){setRoster(data);setLoading(false);}})
  .catch(()=>{if(alive){setError("Impossible de charger la fiche du membre.");setLoading(false);}});
  return()=>{alive=false;};},[]);
 const member=roster?.members.find(x=>x.id===id);
 const saved=()=>{setSection(null);void refresh().catch(()=>setError("Rafraîchissement impossible."));};
 const button=(target:Exclude<Section,null>,label:string)=>
  <button type="button" className="btn btn-outline-secondary btn-sm ms-2" title={"Modifier "+label}
   aria-label={"Modifier "+label} disabled={section!==null||member?.archived}
   onClick={()=>setSection(target)}>✎</button>;
 return <div className="container py-4" style={{maxWidth:1000}}>
  <Link href="/app/admin/members" className="btn btn-link px-0 mb-3">← Équipe</Link>
  {loading&&<p role="status">Chargement…</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {!loading&&!member&&<p role="alert">Membre introuvable.</p>}
  {member&&<div className="d-grid gap-3">
   <header className="smn-panel p-4 d-flex flex-wrap gap-3 align-items-center">
    <span aria-hidden="true" className="rounded-circle bg-body-tertiary border d-flex align-items-center justify-content-center" style={{width:76,height:76,fontSize:38}}>♙</span>
    <div className="flex-grow-1"><h1 className="h3 mb-1">{member.displayName}{button("profile","la fiche")}</h1>
     <p className="text-secondary mb-0">{member.email??"E-mail non renseigné"} · {member.archived?"Archivé":member.isAssigned?"Actif":"Sans affectation"}</p>
    </div>
   </header>
   <section className="smn-panel p-4">
    <h2 className="h5">Rôles et affectation {button("assignment","les rôles et l’affectation")}</h2>
    <div className="d-flex gap-2 flex-wrap">
     {([["SM",member.roleShares.scrumMaster],["PO",member.roleShares.productOwner],["Dev",member.roleShares.developer]] as const)
      .map(([label,value])=><span key={label} className={"badge "+(value>0?"text-bg-primary":"text-bg-secondary opacity-50")}>{label}{value>0?" · "+value+" %":""}</span>)}
    </div>
    <p className="text-secondary mt-2 mb-0">Début d’affectation : {member.startOn??"—"}</p>
   </section>
   <div className="row g-3">
    <div className="col-md-6"><section className="smn-panel p-4 h-100"><h2 className="h5">Calendrier individuel {button("calendar","le calendrier")}</h2><p className="text-secondary mb-0">Voir et ajuster les jours travaillés et exceptions.</p></section></div>
    <div className="col-md-6"><section className="smn-panel p-4 h-100"><h2 className="h5">Localisation {button("location","la localisation")}</h2><p className="text-secondary mb-0">Pays et fuseau horaire du membre.</p></section></div>
   </div>
   <section className="smn-panel p-4"><h2 className="h5">Cycle de vie {button("lifecycle","le cycle de vie")}</h2><p className="text-secondary mb-0">Clôture d’affectation, archivage et réactivation.</p></section>
   {section==="profile"&&<MemberProfileEditor key={member.id+member.revision} member={member} onSaved={saved} onCancel={()=>setSection(null)}/>}
   {section==="assignment"&&roster&&<AssignmentEditor key={member.id} memberId={member.id} teamId={roster.team.id} teamName={roster.team.name} onSaved={saved} onCancel={()=>setSection(null)}/>}
   {section==="calendar"&&roster&&<MemberCalendarEditor key={member.id} memberId={member.id} teamName={roster.team.name} onClose={saved}/>}
   {section==="location"&&roster&&<MemberLocationEditor key={member.id} memberId={member.id} teamName={roster.team.name} onClose={saved}/>}
   {section==="lifecycle"&&<MemberLifecycleEditor key={member.id} memberId={member.id} onSaved={saved} onCancel={()=>setSection(null)}/>}
  </div>}
 </div>;
}
