"use client";
import Link from "next/link";
import NeutralAvatar from "../neutral-avatar";
import CountryFlag from "../country-flag";
import {useTranslation} from "@/i18n/client";
import {useCallback,useEffect,useState,useRef} from "react";
import type {EditableMember} from "../member-profile-editor";
import MemberIdentityEditor from "./member-identity-editor";
import AssignmentEditor from "../assignment-editor";
import MemberAssignmentHistory from "./member-assignment-history";
import MemberCalendarEditor from "../member-calendar-editor";
import MemberCalendarExceptionEditor from "../member-calendar-exception-editor";
import MemberLifecycleEditor from "../member-lifecycle-editor";
import MemberAbsenceEditor from "../member-absence-editor";
import MemberAbsenceSummary from "./member-absence-summary";
import type {AbsenceItem} from "@/server/members/absence";
import MemberHistory from "./member-history";
import MemberCalendarSummary from "./member-calendar-summary";
type Member=EditableMember&{memberNumber:number;archived:boolean;isAssigned:boolean;startOn:string|null;
 email:string|null;professionalFunction?:string|null;roleShares:{scrumMaster:number;productOwner:number;developer:number}};
type Roster={team:{id:string;name:string};members:Member[]};
type Section="profile"|"assignment"|"calendar"|"calendarException"|"absence"|"lifecycle"|null;
type Tab="assignment"|"calendar"|"absences"|"history";
export default function MemberDetail({id}:{id:string}){
 const t=useTranslation();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [loading,setLoading]=useState(true);
 const [section,setSection]=useState<Section>(null);
 const [tab,setTab]=useState<Tab>("assignment");
 const [assignmentRefreshKey,setAssignmentRefreshKey]=useState(0);
 const [calendarRefreshKey,setCalendarRefreshKey]=useState(0);
 const [absenceRefreshKey,setAbsenceRefreshKey]=useState(0);
 const [absenceToEdit,setAbsenceToEdit]=useState<AbsenceItem|null>(null);
 const [error,setError]=useState("");
 const [location,setLocation]=useState<{current:{city:string|null;region:string|null;countryIso2:string|null}|null}|null>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const [profileDirty,setProfileDirty]=useState(false);
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/members",{cache:"no-store"});
  if(!r.ok)throw Error("read-unavailable");
  setRoster(await r.json() as Roster);
 },[]);
 useEffect(()=>{let alive=true;void fetch("/api/admin/members",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Roster>;})
  .then(data=>{if(alive){setRoster(data);setLoading(false);}})
  .catch(()=>{if(alive){setError(t("memberUX.loadFailed"));setLoading(false);}});
  return()=>{alive=false;};},[t]);
 useEffect(()=>{if(!section)return;const previous=document.activeElement as HTMLElement|null;
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();dialogRef.current?.querySelector<HTMLButtonElement>("[data-close-dialog]")?.click();}
   if(event.key==="Tab"){const items=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')??[]).filter(item=>item.getClientRects().length>0);
    if(!items.length)return;const first=items[0],last=items[items.length-1];
    if(!dialogRef.current?.contains(document.activeElement)){event.preventDefault();first.focus();return;}
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
  document.addEventListener("keydown",onKey);
  const focus=window.setTimeout(()=>dialogRef.current?.querySelector<HTMLElement>('input,button')?.focus(),0);
  return()=>{window.clearTimeout(focus);document.removeEventListener("keydown",onKey);previous?.focus();};},[section]);
 useEffect(()=>{let live=true;fetch("/api/admin/members/"+encodeURIComponent(id)+"/location",{cache:"no-store"})
 .then(async r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(live)setLocation(v);}).catch(()=>{});
 return()=>{live=false;};},[id]);
 const member=roster?.members.find(x=>x.id===id);
 const saved=()=>{setSection(null);setAssignmentRefreshKey(current=>current+1);
  setCalendarRefreshKey(current=>current+1);
  setAbsenceRefreshKey(current=>current+1);
  void refresh().catch(()=>setError(t("memberUX.refreshFailed")));
  void fetch("/api/admin/members/"+encodeURIComponent(id)+"/location",{cache:"no-store"})
   .then(async r=>r.ok?r.json():null).then(v=>{if(v)setLocation(v);}).catch(()=>undefined);};
 const closeDialog=()=>{
  if((section!=="profile"||profileDirty)&&!window.confirm(t("draft.discardWarning")))return;
  setSection(null);
 };
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
   <header className="smn-panel p-4">
    <div className="d-flex flex-wrap align-items-center gap-4">
     <NeutralAvatar size={92}/>
     <div className="flex-grow-1">
      <div className="d-flex align-items-center flex-wrap gap-2">
       <h1 className="h3 mb-0 d-inline-flex align-items-center gap-2"><CountryFlag key={location?.current?.countryIso2??"none"} countryIso2={location?.current?.countryIso2}/>{member.displayName}</h1>{button("profile",t("memberUX.profile"))}
       <span className={"badge "+(member.archived?"text-bg-secondary":"text-bg-success")}>{member.archived?t("memberUX.archived"):member.isAssigned?t("memberUX.active"):t("memberUX.unassigned")}</span>
      </div>
      <p className="text-secondary mt-2 mb-1">{member.professionalFunction??t("memberUX.functionMissing")}</p>
      <div className="d-flex flex-wrap gap-2">
       {([["SM",member.roleShares.scrumMaster],["PO",member.roleShares.productOwner],["Dev",member.roleShares.developer]] as const).map(([label,value])=>
        <span key={label} className={"badge "+(value>0?"text-bg-primary":"text-bg-secondary opacity-50")}>{label}{value>0?" · "+value+" %":""}</span>)}
      </div>
     </div>
     <div className="ms-lg-auto text-lg-end">
      <div>{member.email??t("memberUX.emailMissing")}</div>
      <div className="text-secondary mt-2">{location?.current?.city??location?.current?.region??location?.current?.countryIso2??t("memberUX.locationUnavailable")}</div>
     </div>
    </div>
   </header>
   <nav className="smn-panel p-2 smn-member-tabs" aria-label={t("memberUX.tabs.assignment")}>
    <div className="nav nav-pills d-flex gap-2" role="tablist">
     {(["assignment","calendar","absences","history"] as const).map(item=>
      <button key={item} type="button" role="tab" aria-selected={tab===item}
       className={"nav-link "+(tab===item?"active":"")} onClick={()=>setTab(item)}>
       {t(({assignment:"memberUX.tabs.assignment",calendar:"memberUX.tabs.calendar",absences:"memberUX.tabs.absences",history:"memberUX.tabs.history"} as const)[item])}
      </button>)}
    </div>
   </nav>
   {tab==="assignment"&&<section className="smn-panel p-4">
    <h2 className="h5">{t("memberUX.rolesTitle")} {button("assignment",t("memberUX.assignment"))}</h2>
    <p>{t("memberUX.assignmentStart",{date:member.startOn??"—"})}</p>
    <div className="d-flex gap-2">{([["SM",member.roleShares.scrumMaster],["PO",member.roleShares.productOwner],["Dev",member.roleShares.developer]] as const).map(([label,value])=>
     <span className={"badge "+(value>0?"text-bg-primary":"text-bg-secondary")} key={label}>{label} {value} %</span>)}</div>
    <MemberAssignmentHistory key={member.id+"-"+assignmentRefreshKey} memberId={member.id}/>
   </section>}
   {tab==="calendar"&&<section className="smn-panel p-4">
    <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
     <h2 className="h5 mb-0">{t("memberUX.calendarTitle")} {button("calendar",t("memberUX.calendarEdit"))}</h2>
     <button type="button" className="btn btn-outline-primary btn-sm ms-2"
      disabled={section!==null||member.archived}
      onClick={()=>setSection("calendarException")}>+ {t("members.calendar.addException")}</button>
    </div>
    <MemberCalendarSummary key={member.id+"-"+calendarRefreshKey} memberId={member.id}/>
   </section>}
   {tab==="absences"&&<section className="smn-panel p-4">
    <h2 className="h5">{t("memberUX.tabs.absences")}</h2>
    <MemberAbsenceSummary key={member.id+"-"+absenceRefreshKey} memberId={member.id}
     onCreate={()=>{setAbsenceToEdit(null);setSection("absence");}}
     onEdit={absence=>{setAbsenceToEdit(absence);setSection("absence");}}/>
   </section>}
   {tab==="history"&&<section className="smn-panel p-4">
    <h2 className="h5">{t("memberUX.tabs.history")}</h2>
    <MemberHistory memberId={member.id}/>
   </section>}
   {section&&<div className="smn-member-modal-backdrop" role="presentation">
    <div className="smn-member-modal smn-cockpit-modal" role="dialog" aria-modal="true" aria-label={section==="absence"?t(absenceToEdit?"members.absence.editTitle":"members.absence.newTitle"):
      section==="calendarException"?t("members.calendar.addException"):t("memberUX.edit",{name:section})} ref={dialogRef}>
     <div className="smn-cockpit-modal-header">
      <strong>{section==="absence"?t(absenceToEdit?"members.absence.editTitle":"members.absence.newTitle"):
       section==="calendarException"?t("members.calendar.addException"):t("memberUX.edit",{name:section})}</strong>
      <button data-close-dialog type="button" className="btn-close" aria-label={t("teamUX.cancel")} onClick={closeDialog}/>
     </div>
     <div className="smn-cockpit-modal-body">
      {section==="profile"&&<MemberIdentityEditor key={member.id+member.revision} member={member} onSaved={saved} onCancel={closeDialog} onDirtyChange={setProfileDirty}/>}
      {section==="assignment"&&roster&&<AssignmentEditor key={member.id} memberId={member.id} memberRevision={member.revision} teamId={roster.team.id} teamName={roster.team.name} onSaved={saved} onCancel={()=>setSection(null)}/>}
      {section==="calendar"&&<MemberCalendarEditor key={member.id+"-calendar-edit"} memberId={member.id} teamName={roster?.team.name??""} onSaved={saved} onCancel={()=>setSection(null)}/>}
      {section==="calendarException"&&<MemberCalendarExceptionEditor key={member.id+"-calendar-exception"} memberId={member.id} onSaved={saved} onCancel={()=>setSection(null)}/>}
      {section==="absence"&&<MemberAbsenceEditor key={member.id+"-absence-"+(absenceToEdit?.id??"new")} memberId={member.id}
       record={absenceToEdit} onSaved={saved} onCancel={()=>setSection(null)}/>}
      {section==="lifecycle"&&<MemberLifecycleEditor key={member.id} memberId={member.id} onSaved={saved} onCancel={()=>setSection(null)}/>}
     </div>
    </div>
   </div>}
  </div>}
 </div>;
}
