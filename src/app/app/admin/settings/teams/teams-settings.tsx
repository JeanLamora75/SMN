"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {createPortal} from "react-dom";
import {OPEN_TEAM_EDITOR} from "./team-create-button";
import {useTranslation} from "@/i18n/client";
import {filterSettingsTeams} from "@/lib/settings-collection-filter";

type Team={
 id:string;name:string;agileMode:"scrum"|"kanban";isArchived:boolean;canChangeMode:boolean;productName:string|null;vision:string|null;
 productGoal:string|null;revision:number;
};
type Values={name:string;agileMode:"scrum"|"kanban";productName:string;vision:string;productGoal:string};
type Listing={items:Team[];canWrite:boolean};
type Response={ok?:boolean;changed?:boolean;teamId?:string;revision?:number;
 error?:string};
const blank:Values={name:"",agileMode:"scrum",productName:"",vision:"",productGoal:""};
const valuesFrom=(team:Team):Values=>({
 name:team.name,agileMode:team.agileMode,productName:team.productName??"",vision:team.vision??"",
 productGoal:team.productGoal??""
});
const same=(a:Values,b:Values)=>a.name===b.name&&a.agileMode===b.agileMode&&a.productName===b.productName&&
 a.vision===b.vision&&a.productGoal===b.productGoal;

export default function TeamsSettings(){
 const t=useTranslation();
 const [items,setItems]=useState<Team[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [modalOpen,setModalOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const [values,setValues]=useState<Values>(blank);
 const [canWrite,setCanWrite]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [query,setQuery]=useState("");
 const [stateFilter,setStateFilter]=useState<"all"|"active"|"archived">("all");
 const current=items.find(team=>team.id===selected)??null;
 const initial=current?valuesFrom(current):blank;
 const dirty=modalOpen&&!same(initial,values);
 const hasName=values.name.trim().length>0;
 const shown=useMemo(()=>filterSettingsTeams(items,query,stateFilter),[items,query,stateFilter]);
 const requestList=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const res=await fetch("/api/admin/teams",{cache:"no-store"});
   if(!res.ok)throw Error("load");
   const data=await res.json() as Listing;
   if(!Array.isArray(data.items)||typeof data.canWrite!=="boolean")
    throw Error("shape");
   setItems(data.items);setCanWrite(data.canWrite);
   setSelected(previous=>data.items.some(item=>item.id===previous)?previous:null);
  }catch{
   setError(t("teamSettings.loadFailed"));
   setCanWrite(false);
  }finally{setLoading(false);}
 },[t]);
 useEffect(()=>{void Promise.resolve().then(()=>requestList());},[requestList]);
 useEffect(()=>{setMounted(true);},[]);
 useEffect(()=>{
  const openNew=()=>changeTeam(null);
  window.addEventListener(OPEN_TEAM_EDITOR,openNew);
  return()=>window.removeEventListener(OPEN_TEAM_EDITOR,openNew);
 });
 useEffect(()=>{
  if(!modalOpen)return;
  const dialog=dialogRef.current;
  if(!dialog)return;
  dialog.showModal();
  dialog.querySelector<HTMLInputElement>("#smn-team-settings-name")?.focus();
  return()=>{if(dialog.open)dialog.close();openerRef.current?.focus();};
 },[modalOpen]);
 useEffect(()=>{
  if(!dirty)return;
  const protect=(event:BeforeUnloadEvent)=>{
   event.preventDefault();event.returnValue="";
  };
  window.addEventListener("beforeunload",protect);
  return()=>window.removeEventListener("beforeunload",protect);
 },[dirty]);

 function changeTeam(next:string|null){
  if(saving)return;
  if(dirty&&!window.confirm(t("teamSettings.confirmDiscard")))return;
  openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const team=items.find(item=>item.id===next)??null;
  setSelected(team?.id??null);setValues(team?valuesFrom(team):blank);
  setError("");setNotice("");setModalOpen(true);
 }
 function closeTeam(){
  if(saving)return;
  if(dirty&&!window.confirm(t("teamSettings.confirmDiscard")))return;
  setModalOpen(false);setSelected(null);setValues(blank);setError("");
 }
 function setField(key:keyof Values,value:string){
  setValues(old=>({...old,[key]:value}));setError("");setNotice("");
 }
 async function toggleArchived(){
  if(!current||saving||loading||!canWrite)return;
  const archived=!current.isArchived;
  if(dirty&&!window.confirm(t("teamSettings.confirmDiscard")))return;
  if(!window.confirm(t(archived?"settingsCollections.archiveTeamConfirm":"settingsCollections.reactivateTeamConfirm")))return;
  setSaving(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/teams",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId:current.id,revision:current.revision,archived})
   });
   const data=await response.json() as Response;
   if(!response.ok||!data.ok){
    setError(data.error==="last-active-team"?t("settingsCollections.lastActiveTeam"):t("teamSettings.saveFailed"));
    return;
   }
   setSelected(null);setValues(blank);
   await requestList();
  }catch{setError(t("teamSettings.saveFailed"));}
  finally{setSaving(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving||loading||!canWrite||current?.isArchived||!hasName||(!dirty&&current))return;
  setSaving(true);setError("");setNotice("");
  const body={
   ...(current?{teamId:current.id,revision:current.revision,agileMode:values.agileMode}:{agileMode:values.agileMode}),
   name:values.name,
   productName:values.productName.trim()||null,
   vision:values.vision.trim()||null,
   productGoal:values.productGoal.trim()||null
  };
  try{
   const res=await fetch("/api/admin/teams",{
    method:current?"PATCH":"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
   });
   const result=await res.json() as Response;
   if(!res.ok||result.ok!==true){
    const code=result.error;
    setError(t(code==="duplicate-name"?"teamSettings.duplicate":
     code==="conflict"?"teamSettings.conflict":
     code==="invalid-input"?"teamSettings.invalid":
     code==="forbidden"?"teamSettings.denied":
     code==="schema-not-ready"?"teamSettings.unavailable":
     "teamSettings.saveFailed"));
    if(code==="has-cycles")setError(t("settingsCollections.hasCycles"));
    if(code==="archived-team")setError(t("settingsCollections.archivedTeam"));
    if(code==="service-unavailable")setError(t("settingsCollections.teamServiceUnavailable",{status:res.status}));
    return;
   }
   // Rafraîchir la liste, sans modifier l'équipe active dans le shell.
   setSelected(null);setValues(blank);setModalOpen(false);
   setNotice(t(current?"teamSettings.saved":"teamSettings.created"));
   await requestList();
  }catch{
   setError(t("teamSettings.saveFailed"));
  }finally{setSaving(false);}
 }
 return <div className="smn-teams-settings">
  <section aria-labelledby="smn-teams-list-title">
   <div className="smn-panel rounded-4 p-3 p-md-4">
    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
     <h2 className="h5 mb-0" id="smn-teams-list-title">{t("teamSettings.title")}</h2>
     <button type="button" className="btn btn-sm btn-outline-secondary"
      onClick={()=>void requestList()} disabled={saving||loading}>
      {t("teamSettings.retry")}
     </button>
    </div>
    <div className="smn-teams-settings-filters mb-3">
     <label className="form-label mb-0">{t("settingsCollections.searchTeams")}
      <input type="search" className="form-control mt-1" value={query} onChange={event=>setQuery(event.target.value)} disabled={loading} />
     </label>
     <label className="form-label mb-0">{t("settingsCollections.filterStatus")}
      <select className="form-select mt-1" value={stateFilter} onChange={event=>setStateFilter(event.target.value as "all"|"active"|"archived")} disabled={loading}>
       <option value="all">{t("settingsCollections.all")}</option>
       <option value="active">{t("settingsCollections.active")}</option>
       <option value="archived">{t("settingsCollections.archived")}</option>
      </select>
     </label>
    </div>
    {!loading&&<p role="status" aria-live="polite" className="small text-secondary mb-3">{t("settingsCollections.results",{count:shown.length,total:items.length})}</p>}
    {loading?<p role="status">{t("teamSettings.loading")}</p>:
     items.length===0?<p className="text-secondary">{t("teamSettings.noTeams")}</p>:
     shown.length===0?<div role="status"><p className="text-secondary">{t("settingsCollections.noMatches")}</p><button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setQuery("");setStateFilter("all");}}>{t("settingsCollections.reset")}</button></div>:
     <ul className="list-group" aria-label={t("teamSettings.select")}>
      {shown.map(item=><li className="list-group-item p-0" key={item.id}>
       <button type="button" className={"btn w-100 text-start rounded-0 py-3 "+
        (selected===item.id?"fw-semibold bg-body-tertiary":"")}
        aria-current={selected===item.id?"true":undefined}
        disabled={saving} onClick={()=>changeTeam(item.id)}>
        <span className="d-block">{item.name}</span>
        <span className="small text-secondary">{item.productName??t("teamSettings.noProduct")} · {item.agileMode==="kanban"?"Kanban":"Scrum"} {item.isArchived?" · "+t("settingsCollections.archived"):""}</span>
       </button>
      </li>)}
     </ul>}
   </div>
  </section>
  {mounted&&modalOpen&&createPortal(<dialog ref={dialogRef} className="smn-teams-settings-dialog"
   aria-labelledby="smn-teams-form-title" onCancel={event=>{event.preventDefault();closeTeam();}}>
   <div className="smn-teams-settings-modal">
    <header className="smn-teams-settings-modal-header">
     <div className="smn-teams-settings-modal-identity"><span className="smn-teams-settings-modal-icon" aria-hidden="true">♧</span>
      <div><span className="smn-teams-settings-modal-eyebrow">COCKPIT AGILE</span>
      <h2 className="h5 mb-0" id="smn-teams-form-title">{t(current?"teamSettings.editTeam":"teamSettings.newTeam")}</h2></div></div>
     <button type="button" className="btn-close" aria-label={t("teamSettings.cancel")} onClick={closeTeam} disabled={saving}/>
    </header>
    <div className="smn-teams-settings-modal-body">
    <p className="text-secondary small">{t("teamSettings.description")}</p>
    {!canWrite&&!loading&&<p className="alert alert-info" role="status">
     {t("teamSettings.unavailable")}
    </p>}
    {notice&&<p className="alert alert-success" role="status">{notice}</p>}
    {error&&<p className="alert alert-warning" role="alert">{error}</p>}
    {current&&<div className="d-flex justify-content-end mb-3"><button type="button" className="btn btn-outline-secondary" disabled={saving||!canWrite} onClick={()=>void toggleArchived()}>{t(current.isArchived?"settingsCollections.reactivateTeam":"settingsCollections.archiveTeam")}</button></div>}
    <form id="smn-teams-settings-form" className="d-grid gap-3" data-smn-unsaved-changes={dirty?"true":"false"}
     onSubmit={event=>void submit(event)}>
     <div>
      <label htmlFor="smn-team-settings-name" className="form-label">
       {t("teamSettings.teamName")} <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <input id="smn-team-settings-name" className="form-control" type="text"
       required maxLength={120} autoComplete="off" value={values.name}
       aria-required="true" disabled={!canWrite||saving||loading||!!current?.isArchived}
       onChange={event=>setField("name",event.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-settings-agile-mode" className="form-label">
       {t("teamSettings.agileMode")} <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <select id="smn-team-settings-agile-mode" className="form-select"
       value={values.agileMode} required aria-required="true"
       disabled={!!current&&(!current.canChangeMode||current.isArchived)||!canWrite||saving||loading}
       onChange={event=>setValues(old=>({...old,agileMode:event.target.value==="kanban"?"kanban":"scrum"}))}>
       <option value="scrum">Scrum</option>
       <option value="kanban">Kanban</option>
      </select>
      {current&&!current.canChangeMode&&<p className="form-text">{t("teamSettings.agileModeImmutable")}</p>}
     </div>
     <div>
      <label htmlFor="smn-team-settings-product" className="form-label">
       {t("teamSettings.productName")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <input id="smn-team-settings-product" className="form-control" type="text"
       maxLength={120} value={values.productName}
       disabled={!canWrite||saving||loading||!!current?.isArchived}
       onChange={event=>setField("productName",event.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-settings-vision" className="form-label">
       {t("teamSettings.vision")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <textarea id="smn-team-settings-vision" className="form-control" rows={4}
       maxLength={5000} value={values.vision} disabled={!canWrite||saving||loading||!!current?.isArchived}
       onChange={event=>setField("vision",event.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-settings-goal" className="form-label">
       {t("teamSettings.productGoal")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <textarea id="smn-team-settings-goal" className="form-control" rows={4}
       maxLength={5000} value={values.productGoal} disabled={!canWrite||saving||loading||!!current?.isArchived}
       onChange={event=>setField("productGoal",event.target.value)}/>
     </div>
    </form>
    </div>
    <footer className="smn-teams-settings-modal-footer d-flex flex-wrap gap-2 justify-content-end">
      <button type="button" className="btn btn-outline-secondary"
       onClick={closeTeam} disabled={saving||loading}>
       {t("teamSettings.cancel")}
      </button>
      <button type="submit" form="smn-teams-settings-form" className="btn btn-primary"
       disabled={!canWrite||loading||saving||!!current?.isArchived||!hasName||current!==null&&!dirty}>
       {t(current?"teamSettings.save":"teamSettings.create")}
      </button>
    </footer>
   </div>
  </dialog>,document.body)}
  {notice&&<p className="alert alert-success mt-3" role="status">{notice}</p>}
 </div>;
}
