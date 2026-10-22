"use client";
import Link from "next/link";
import NeutralAvatar from "../neutral-avatar";
import {useTranslation} from "@/i18n/client";
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
type Tab="profile"|"assignment"|"calendar"|"location"|"history";
export default function MemberDetail({id}:{id:string}){
 const t=useTranslation();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [loading,setLoading]=useState(true);
 const [section,setSection]=useState<Section>(null);
 const [tab,setTab]=useState<Tab>("profile");
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/members",{cache:"no-store"});
  if(!r.ok)throw Error("read-unavailable");
  setRoster(await r.json() as Roster);
 },[]);
 useEffect(()=>{let alive=true;void fetch("/api/admin/members",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Roster>;})
  .then(data=>{if(alive){setRoster(data);setLoading(false);}})
  .catch(()=>{if(alive){setError(t("memberUX.loadFailed"));setLoading(false);}});
  return()=>{alive=false;};},[]);
 const member=roster?.members.find(x=>x.id===id);
 const saved=()=>{setSection(null);void refresh().catch(()=>setError(t("memberUX.refreshFailed")));};
 const button=(target:Exclude<Section,null>,label:string)=>
  <button type="button" className="btn btn-outline-secondary btn-sm ms-2" title={t("memberUX.edit",{name:label})}
   aria-label={t("memberUX.edit",{name:label})} disabled={section!==null||(member?.archived&&target!=="lifecycle")}
   onClick={()=>setSection(target)}>✎</button>;
 return <div className="container-fluid smn-member-page py-4 px-3 px-lg-4">
  <Link href="/app/admin/members" className="btn btn-link px-0 mb-3">← {t("memberUX.back")}</Link>
  {loading&&<p role="status">{t("memberUX.loading")}</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {!loading&&!member&&<p role="alert">{t("memberUX.notFound")}</p>}
  {member&&<div className="d-grid gap-3">
   <header className="smn-panel p-4 d-flex flex-wrap gap-4 align-items-center">
    <NeutralAvatar size={92}/>
    <div className="flex-grow-1">
     <div className="d-flex flex-wrap gap-2 align-items-center"><h1 className="h3 mb-0">{member.displayName}</h1>{button("profile",t("memberUX.profile"))}
      <span className={"badge "+(member.archived?"text-bg-secondary":"text-bg-success")}>{member.archived?t("memberUX.archived"):member.isAssigned?t("memberUX.active"):t("memberUX.unassigned")}</span></div>
     <div className="text-secondary mt-2">{t("memberUX.functionMissing")}</div>
     <div className="d-flex gap-2 flex-wrap mt-2">
     {([["SM",member.roleShares.scrumMaster],["PO",member.roleShares.productOwner],["Dev",member.roleShares.developer]] as const)
      .map(([label,value])=><span key={label} className={"badge "+(value>0?"text-bg-primary":"text-bg-secondary opacity-50")}>{label}{value>0?" · "+value+" %":""}</span>)}
     </div>
    </div>
   </header>
   <nav className="smn-panel p-2 smn-member-tabs" aria-label="Détails du membre">
    <div className="nav nav-pills d-flex gap-2" role="tablist">
    {(["profile","assignment","calendar","location","history"] as const).map(item=>
     <button key={item} type="button" role="tab" aria-selected={tab===item}
      className={"nav-link "+(tab===item?"active":"")} onClick={()=>{setTab(item);setSection(null);}}>
      {t(({profile:"memberUX.tabs.profile",assignment:"memberUX.tabs.assignment",calendar:"memberUX.tabs.calendar",location:"memberUX.tabs.location",history:"memberUX.tabs.history"} as const)[item])}
     </button>)}
    </div>
   </nav>
   {tab==="profile"&&<div className="row g-3">
    <div className="col-md-6"><section className="smn-panel p-4 h-100">
     <h2 className="h5">{t("memberUX.tabs.profile")}</h2>
     <dl className="mb-0">
      <dt>{t("members.name")}</dt><dd>{member.displayName}{button("profile",t("memberUX.profile"))}</dd>
      <dt>{t("members.profile.emailLabel")}</dt><dd>{member.email??t("memberUX.emailMissing")}{button("profile",t("memberUX.profile"))}</dd>
     </dl>
    </section></div>
    <div className="col-md-6"><section className="smn-panel p-4 h-100">
     <h2 className="h5">{t("memberUX.rolesTitle")}</h2>
     <p>{t("memberUX.assignmentStart",{date:member.startOn??"—"})}{button("assignment",t("memberUX.assignment"))}</p>
     <p className="mb-0">{t("memberUX.functionMissing")}</p>
    </section></div>
   </div>}
   {tab==="assignment"&&<section className="smn-panel p-4">
    <h2 className="h5">{t("memberUX.rolesTitle")}</h2>
    <p>{t("memberUX.assignmentStart",{date:member.startOn??"—"})}{button("assignment",t("memberUX.assignment"))}</p>
    <div className="d-flex gap-2">{([["SM",member.roleShares.scrumMaster],["PO",member.roleShares.productOwner],["Dev",member.roleShares.developer]] as const).map(([label,value])=>
     <span className={"badge "+(value>0?"text-bg-primary":"text-bg-secondary")} key={label}>{label} {value} %</span>)}</div>
   </section>}
   {tab==="calendar"&&<section className="smn-panel p-4"><h2 className="h5">{t("memberUX.calendarTitle")}</h2>
    <MemberCalendarEditor key={member.id+"-calendar"} memberId={member.id} teamName={roster?.team.name??""} onClose={()=>setTab("profile")}/>
   </section>}
   {tab==="location"&&<section className="smn-panel p-4"><h2 className="h5">{t("memberUX.locationTitle")}</h2>
    <MemberLocationEditor key={member.id+"-location"} memberId={member.id} teamName={roster?.team.name??""} onClose={()=>setTab("profile")}/>
   </section>}
   {tab==="history"&&<section className="smn-panel p-4"><h2 className="h5">{t("memberUX.tabs.history")}</h2>
    <p>{t("memberUX.historyHelp")}</p>
    {button("lifecycle",t("memberUX.lifecycleEdit"))}
   </section>}
   {section==="profile"&&<MemberProfileEditor key={member.id+member.revision} member={member} onSaved={saved} onCancel={()=>setSection(null)}/>}
   {section==="assignment"&&roster&&<AssignmentEditor key={member.id} memberId={member.id} teamId={roster.team.id} teamName={roster.team.name} onSaved={saved} onCancel={()=>setSection(null)}/>}
   {section==="lifecycle"&&<MemberLifecycleEditor key={member.id} memberId={member.id} onSaved={saved} onCancel={()=>setSection(null)}/>}
  </div>}
 </div>;
}
