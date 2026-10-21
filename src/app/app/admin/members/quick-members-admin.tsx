"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import MemberProfileEditor,{type EditableMember} from "./member-profile-editor";
import AssignmentEditor from "./assignment-editor";
import MemberLifecycleEditor from "./member-lifecycle-editor";
import MemberCalendarEditor from "./member-calendar-editor";
import MemberLocationEditor from "./member-location-editor";

type AgileRole="scrum_master"|"product_owner"|"developer";
type Member={id:string;memberNumber:number;displayName:string;email:string|null;revision:number;isProvisional:boolean;
 agileRole:AgileRole|null;startOn:string|null;endOn:string|null;archived:boolean;archivedAt:string|null;isAssigned:boolean;
 contractPercent:number;allocationPercent:number;
 rolePercent:number;contributionPercent:number;roleShares:{scrumMaster:number;productOwner:number;developer:number};developmentCapacityJh:null};
type Roster={team:{id:string;name:string;mode:"scrum"|"kanban"};members:Member[]};
type State="loading"|"ready"|"error";
const MAX_COUNT=50;

export default function QuickMembersAdmin(){
 const t=useTranslation();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [status,setStatus]=useState<State>("loading");
 const [count,setCount]=useState("3");
 const [busy,setBusy]=useState(false);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [assigningId,setAssigningId]=useState<string|null>(null);
 const [lifecycleId,setLifecycleId]=useState<string|null>(null);
 const [calendarId,setCalendarId]=useState<string|null>(null);
 const [locationId,setLocationId]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 const requestId=useRef<string|null>(null);
 const refresh=useCallback(async()=>{
  const response=await fetch("/api/admin/members",{cache:"no-store"});
  if(!response.ok)throw new Error("read-failed");
  const data=await response.json() as Roster;
  if(!data.team?.id||!Array.isArray(data.members))throw new Error("invalid-roster");
  setRoster(data);setStatus("ready");
  return data;
 },[]);
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/members",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw new Error("unavailable");return r.json() as Promise<Roster>;})
   .then(data=>{
    if(!live)return;
    if(!data.team?.id||!Array.isArray(data.members))throw new Error("invalid-roster");
    setRoster(data);setStatus("ready");
   }).catch(()=>{if(live)setStatus("error");});
  return ()=>{live=false;};
 },[]);
 const dirty=count!=="3"&&roster?.members.length===0;
 const selectedMember=roster?.members.find(m=>m.id===editingId)??null;
 const selectedAssignment=roster?.members.find(m=>m.id===assigningId)??null;
 const selectedLifecycle=roster?.members.find(m=>m.id===lifecycleId)??null;
 const selectedCalendar=roster?.members.find(m=>m.id===calendarId)??null;
 const selectedLocation=roster?.members.find(m=>m.id===locationId)??null;
 const savedLifecycle=(action:"close"|"archive"|"reactivate"|"delete",smallTeam:boolean)=>{
  setLifecycleId(null);
  void refresh().then(()=>{
   setError(false);
   setMessage(t("members.lifecycle."+action+"Saved")+
    (smallTeam?" "+t("members.lifecycle.smallTeam"):""));
  }).catch(()=>{setError(true);setMessage(t("members.lifecycle.failedLoad"));});
 };
 const savedAssignment=()=>{
  setAssigningId(null);
  void refresh().then(()=>{setMessage(t("members.assignment.saved"));setError(false);})
   .catch(()=>{setMessage(t("members.assignment.loadFailed"));setError(true);});
 };
 const rolesSummary=(member:Member)=>{
  const shares=member.roleShares??{
   scrumMaster:member.agileRole==="scrum_master"?100:0,
   productOwner:member.agileRole==="product_owner"?100:0,
   developer:member.agileRole==="developer"?100:0
  };
  if(!member.isAssigned)return t("members.lifecycle.noActiveAssignment");
  return ([
   ["scrumMaster","members.roles.scrumMaster"],
   ["productOwner","members.roles.productOwner"],
   ["developer","members.roles.developer"]
  ] as const).filter(([key])=>shares[key]>0)
   .map(([key,label])=>t(label)+" "+shares[key]+" %").join(" · ");
 };
 const savedProfile=(updated:EditableMember)=>{
  setRoster(current=>current?{...current,members:current.members.map(member=>
   member.id===updated.id?{...member,...updated}:member)}:current);
  setEditingId(null);setError(false);setMessage(t("members.profile.saved"));
 };
 useUnsavedChanges(Boolean(dirty||busy),t("draft.leaveWarning"));
 const membersCreated=Boolean(roster&&roster.members.length>0);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!roster||membersCreated||busy)return;
  const quantity=Number(count);
  if(!/^[0-9]+$/.test(count)||!Number.isSafeInteger(quantity)||
    quantity<3||quantity>MAX_COUNT){
   setError(true);setMessage(t("members.invalidCount"));return;
  }
  setBusy(true);setError(false);setMessage("");
  requestId.current??=crypto.randomUUID();
  try{
   const response=await fetch("/api/admin/members",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId:roster.team.id,count:quantity,requestId:requestId.current})
   });
   const result=await response.json() as {error?:string;members?:Member[];created?:boolean};
   if(!response.ok||!Array.isArray(result.members)){
    if(response.status===409&&result.error==="already-initialized"){
     await refresh();setMessage(t("members.alreadyInitialized"));return;
    }
    throw new Error(response.status===409?"conflict":
      response.status===400?"invalid":"service");
   }
   const updated=await refresh();
   if(updated.members.length!==quantity)throw new Error("not-confirmed");
   requestId.current=null;
   setCount("3");
   setMessage(t(result.created?"members.created":"members.recovered",{count:quantity}));
  }catch(cause){
   setError(true);
   setMessage(t(cause instanceof Error&&cause.message==="conflict"?
    "members.requestConflict":cause instanceof Error&&cause.message==="invalid"?
    "members.invalidCount":"members.failed"));
  }finally{setBusy(false);}
 }
 return <div className="d-grid gap-4">
  <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="members-team-heading">
   <div>
    <h2 id="members-team-heading" className="h5">{t("members.teamTitle")}</h2>
    <p className="text-secondary small mb-0">{t("members.teamInfo")}</p>
   </div>
   {status==="loading"&&<p role="status">{t("members.loading")}</p>}
   {status==="error"&&<div role="alert" className="alert alert-warning">
    {t("members.loadFailed")}
    <button type="button" className="btn btn-outline-secondary ms-3"
     onClick={()=>{setStatus("loading");void refresh().catch(()=>setStatus("error"));}}>
     {t("common.retry")}</button>
   </div>}
   {roster&&<dl className="row mb-0">
    <dt className="col-sm-4">{t("members.team")}</dt>
    <dd className="col-sm-8">{roster.team.name}</dd>
    <dt className="col-sm-4">{t("members.mode")}</dt>
    <dd className="col-sm-8">{t(roster.team.mode==="scrum"?
     "navigation.modes.scrum":"navigation.modes.kanban")}</dd>
   </dl>}
  </section>
  {!membersCreated&&<section className="smn-panel p-4" aria-labelledby="members-create-heading">
   <h2 id="members-create-heading" className="h5">{t("members.createTitle")}</h2>
   <p className="small text-secondary">{t("members.createInfo")}</p>
   <form onSubmit={submit} className="d-grid gap-3" aria-describedby="members-help">
    <div className="col-sm-6 col-lg-4">
     <label className="form-label" htmlFor="members-count">{t("members.countLabel")}</label>
     <input id="members-count" className="form-control" type="number"
      min={3} max={MAX_COUNT} step={1} required value={count}
      onChange={e=>{setCount(e.target.value);requestId.current=null;setMessage("");}}
      disabled={busy||status!=="ready"}/>
    </div>
    <p id="members-help" className="small text-secondary mb-0">
     {t("members.rolesHint")} {t("members.percentHint")}
    </p>
    <button type="submit" className="btn btn-primary align-self-start"
     disabled={busy||status!=="ready"}>
     {busy?t("members.running"):t("members.submit")}
    </button>
   </form>
  </section>}
  {membersCreated&&<section className="smn-panel p-4" aria-labelledby="members-list-heading">
   <h2 id="members-list-heading" className="h5">{t("members.listTitle")}</h2>
   <p className="small text-secondary">{t("members.listInfo")}</p>
   <div className="table-responsive">
    <table className="table table-sm align-middle">
     <thead><tr>
      <th scope="col">{t("members.name")}</th>
      <th scope="col">{t("members.role")}</th>
      <th scope="col">{t("members.lifecycle.status")}</th>
      <th scope="col">{t("members.arrival")}</th>
      <th scope="col">{t("members.percent")}</th>
      <th scope="col">{t("members.capacity")}</th>
      <th scope="col">{t("members.profile.emailLabel")}</th>
      <th scope="col">{t("members.profile.actions")}</th>
     </tr></thead>
     <tbody>{roster?.members.map(member=><tr key={member.id}>
      <td><strong>{member.isProvisional?
       t("members.provisionalName",{number:member.memberNumber}):member.displayName}</strong>
       <span className="small text-secondary d-block">{t(member.isProvisional?
        "members.provisional":"members.profile.confirmed")}</span></td>
      <td>{rolesSummary(member)}</td>
      <td>{t(member.archived?"members.lifecycle.archived":
       member.isAssigned?"members.lifecycle.active":"members.lifecycle.unassigned")}</td>
      <td>{member.startOn?<time dateTime={member.startOn}>{member.startOn}</time>:"—"}</td>
      <td>{t("members.percentValue",{value:member.allocationPercent})}</td>
      <td>{t("members.notCalculated")}</td>
      <td>{member.email??t("members.profile.noEmail")}</td>
      <td><button type="button" className="btn btn-outline-primary btn-sm"
       disabled={busy||member.archived||editingId!==null||assigningId!==null||lifecycleId!==null||calendarId!==null||locationId!==null}
       onClick={()=>{setMessage("");setEditingId(member.id);}}>
       {t("members.profile.edit")}
      </button>
      <button type="button" className="btn btn-outline-primary btn-sm mt-1"
       disabled={busy||member.archived||editingId!==null||assigningId!==null||lifecycleId!==null||calendarId!==null||locationId!==null}
       onClick={()=>{setMessage("");setAssigningId(member.id);}}>
       {t("members.assignment.edit")}
      </button>
      <button type="button" className="btn btn-outline-secondary btn-sm mt-1"
       disabled={busy||editingId!==null||assigningId!==null||lifecycleId!==null||calendarId!==null||locationId!==null}
       onClick={()=>{setMessage("");setLifecycleId(member.id);}}>
       {t("members.lifecycle.manage")}
      </button>
      <button type="button" className="btn btn-outline-primary btn-sm mt-1"
       disabled={busy||editingId!==null||assigningId!==null||lifecycleId!==null||calendarId!==null||locationId!==null}
       onClick={()=>{setMessage("");setCalendarId(member.id);}}>
       {t("members.calendar.manage")}
      </button>
      <button type="button" className="btn btn-outline-primary btn-sm mt-1"
       disabled={busy||editingId!==null||assigningId!==null||lifecycleId!==null||calendarId!==null||locationId!==null}
       onClick={()=>{setMessage("");setLocationId(member.id);}}>
       {t("members.location.manage")}
      </button></td>
     </tr>)}</tbody>
    </table>
   </div>
   <p className="small text-secondary mb-0">{t("members.futureEdits")}</p>
   {selectedLocation&&<div className="mt-4">
    <MemberLocationEditor key={selectedLocation.id} memberId={selectedLocation.id}
     onClose={()=>setLocationId(null)}/>
   </div>}
   {selectedCalendar&&<div className="mt-4">
    <MemberCalendarEditor key={selectedCalendar.id} memberId={selectedCalendar.id}
     onClose={()=>setCalendarId(null)}/>
   </div>}
   {selectedLifecycle&&<div className="mt-4">
    <MemberLifecycleEditor key={selectedLifecycle.id} memberId={selectedLifecycle.id}
     onSaved={savedLifecycle} onCancel={()=>setLifecycleId(null)}/>
   </div>}
   {selectedAssignment&&roster&&<div className="mt-4">
    <AssignmentEditor key={selectedAssignment.id} memberId={selectedAssignment.id}
     teamId={roster.team.id} onSaved={savedAssignment}
     onCancel={()=>setAssigningId(null)}/>
   </div>}
   {selectedMember&&<div className="mt-4">
    <MemberProfileEditor key={selectedMember.id} member={selectedMember}
     onSaved={savedProfile} onCancel={()=>setEditingId(null)}/>
   </div>}
  </section>}
  {message&&<p role={error?"alert":"status"}
   className={"alert "+(error?"alert-warning":"alert-success")}>{message}</p>}
 </div>;
}
