"use client";
import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import SettingsFilterPanel from "../settings/settings-filter-panel";
import {createPortal} from "react-dom";
import {useTranslation} from "@/i18n/client";
import type {TranslationKey,TranslationParams} from "@/i18n/catalog";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Company={id:string;name:string;comment:string|null;color:string;archivedAt:string|null;revision:number};
type Draft={name:string;comment:string;color:string};
type View="cards"|"list";
type Status="all"|"active"|"archived";
type Translator=(key:TranslationKey,params?:TranslationParams)=>string;
const VIEW_KEY="smn-company-settings-view";
const palette=["blue","indigo","violet","teal","green","amber","orange","red"] as const;
const blank=():Draft=>({name:"",comment:"",color:"blue"});
const companyApiErrorKeys={
 "invalid-input":"invalidInput",
 "duplicate-name":"duplicateName",
 "not-found":"notFound",
 "conflict":"conflict",
 "already-archived":"alreadyArchived",
 "already-active":"alreadyActive",
 "forbidden":"forbidden",
 "service-unavailable":"serviceUnavailable"
} as const;
function companyError(code:string|undefined,t:Translator,fallback:"saveFailed"|"changeFailed"):string{
 const key=code&&Object.prototype.hasOwnProperty.call(companyApiErrorKeys,code)
  ?companyApiErrorKeys[code as keyof typeof companyApiErrorKeys]:null;
 return key?t(`companiesAdmin.errors.${key}` as TranslationKey):t(`companiesAdmin.${fallback}` as TranslationKey);
}


async function readCompaniesResponse(response:Response,t:Translator):Promise<{companies:Company[]}>{
 if(!response.ok){
  const body=await response.json().catch(()=>({})) as {error?:string};
  if(body.error==="company-schema-missing")throw Error(t("companiesAdmin.loadSchema"));
  if(response.status===403)throw Error(t("companiesAdmin.accessDenied"));
  throw Error(t("companiesAdmin.httpError",{status:response.status}));
 }
 const value=await response.json() as {companies?:Company[]};
 if(!Array.isArray(value.companies))throw Error(t("companiesAdmin.loadFailed"));
 return {companies:value.companies};
}

export default function CompaniesAdmin(){
 const t=useTranslation();
 const [items,setItems]=useState<Company[]>([]);
 const [selected,setSelected]=useState<Company|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState<Status>("all");
 const [view,setView]=useState<View>("list");
 const dirty=selected?draft.name!==selected.name||draft.comment!==(selected.comment??"")||draft.color!==selected.color:
  draft.name!==""||draft.comment!==""||draft.color!=="blue";
 useUnsavedChanges(editorOpen&&(dirty||busy),t("draft.leaveWarning"));

 useEffect(()=>{setMounted(true)},[]);
 useEffect(()=>{
  if(!editorOpen)return;
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  dialog.querySelector<HTMLInputElement>("#company-name")?.focus();
  return()=>{if(dialog.open)dialog.close();openerRef.current?.focus()};
 },[editorOpen]);
 useEffect(()=>{
  void Promise.resolve().then(()=>{
   try{if(window.localStorage.getItem(VIEW_KEY)==="cards")setView("cards")}catch{/* Optional preference */}
  });
 },[]);
 const rows=useMemo(()=>items.filter(c=>
  (status==="all"||(status==="active"?!c.archivedAt:!!c.archivedAt))&&
  (!search.trim()||[c.name,c.comment??""].some(v=>v.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())))
 ),[items,search,status]);

 async function load(){
  const response=await fetch("/api/admin/companies",{cache:"no-store"});
  const value=await readCompaniesResponse(response,t);
  setItems(value.companies);
 }
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/companies",{cache:"no-store",signal:controller.signal})
   .then(response=>readCompaniesResponse(response,t))
   .then(value=>{if(!controller.signal.aborted){setItems(value.companies);setError("")}})
   .catch((cause:unknown)=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:t("companiesAdmin.loadFailed"))})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[t]);
 function resetEditor(){
  setSelected(null);setDraft(blank());setEditorOpen(false);setError("");
 }
 function closeEditor(){
  if(busy)return;
  if(dirty&&!window.confirm(t("companiesAdmin.unsaved")))return;
  resetEditor();
 }
 function edit(company:Company|null){
  if(busy)return;
  if(editorOpen&&dirty&&!window.confirm(t("companiesAdmin.unsaved")))return;
  openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setSelected(company);
  setDraft(company?{name:company.name,comment:company.comment??"",color:company.color}:blank());
  setMessage("");setError("");setEditorOpen(true);
 }
 function changeView(next:View){
  setView(next);
  try{window.localStorage.setItem(VIEW_KEY,next)}catch{/* Optional preference */}
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||!draft.name.trim())return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch(selected?"/api/admin/companies/"+encodeURIComponent(selected.id):"/api/admin/companies",{
    method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...draft,comment:draft.comment||null,...(selected?{revision:selected.revision}:{})})
   });
   if(!response.ok){
    const value=await response.json().catch(()=>({})) as {error?:string};
    throw Error(companyError(value.error,t,"saveFailed"));
   }
   await load();resetEditor();setMessage(t("companiesAdmin.saved"));
  }catch(cause){setError(cause instanceof Error?cause.message:t("companiesAdmin.saveFailed"))}
  finally{setBusy(false)}
 }
 async function archive(company:Company){
  if(busy)return;
  if(editorOpen&&dirty&&!window.confirm(t("companiesAdmin.unsaved")))return;
  const action=company.archivedAt?"reactivate":"archive";
  if(!window.confirm(t(action==="archive"?"companiesAdmin.archiveConfirm":"companiesAdmin.reactivateConfirm")))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/companies/"+encodeURIComponent(company.id),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,revision:company.revision})
   });
   if(!response.ok){
    const result=await response.json().catch(()=>({})) as {error?:string};
    throw Error(companyError(result.error,t,"changeFailed"));
   }
   await load();resetEditor();setMessage(t("companiesAdmin.statusChanged"));
  }catch(cause){setError(cause instanceof Error?cause.message:t("companiesAdmin.changeFailed"))}
  finally{setBusy(false)}
 }
 const actions=(company:Company)=><div className="d-flex flex-wrap gap-2">
  <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy||!!company.archivedAt} onClick={()=>edit(company)}>{t("companiesAdmin.edit")}</button>
  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={()=>void archive(company)}>
   {t(company.archivedAt?"companiesAdmin.reactivate":"companiesAdmin.archive")}
  </button>
 </div>;
 const companyName=(company:Company)=><span className="d-inline-flex align-items-center gap-2">
  <span aria-hidden="true" className="d-inline-block rounded-circle flex-shrink-0" style={{width:12,height:12,backgroundColor:`var(--bs-${company.color},var(--bs-secondary))`}}/>
  <span className="fw-semibold">{company.name}</span>
 </span>;
 const emptyLabel=items.length?t("companiesAdmin.noMatches"):t("companiesAdmin.empty");
 return <div className="d-grid gap-3">
  {error&&<div role="alert" className="alert alert-warning mb-0">{error}
   <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={()=>void load().then(()=>setError("")).catch(cause=>setError(String(cause)))}>{t("companiesAdmin.retry")}</button>
  </div>}
  {message&&<p role="status" className="alert alert-success mb-0">{message}</p>}
  <SettingsFilterPanel>    <div className="d-flex flex-wrap gap-2 flex-grow-1">
     <label className="form-label mb-0" style={{minWidth:200,maxWidth:360,flex:"1 1 220px"}}>
      {t("companiesAdmin.search")}
      <input type="search" className="form-control mt-1" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("companiesAdmin.search")}/>
     </label>
     <label className="form-label mb-0" style={{minWidth:140,maxWidth:200,flex:"1 1 140px"}}>
      {t("companiesAdmin.filter")}
      <select className="form-select mt-1" value={status} onChange={e=>setStatus(e.target.value as Status)}>
       <option value="all">{t("companiesAdmin.all")}</option>
       <option value="active">{t("companiesAdmin.active")}</option>
       <option value="archived">{t("companiesAdmin.archived")}</option>
      </select>
     </label>
    </div>
  </SettingsFilterPanel>
  <section className="smn-panel rounded-4 p-3 p-lg-4">
   <div className="d-flex flex-wrap align-items-end gap-3 justify-content-between mb-3">
    <div className="d-flex flex-wrap gap-2">
     <div className="btn-group btn-group-sm" role="group" aria-label={t("settingsCatalog.view.switchLabel")}>
      <button type="button" className={`btn ${view==="cards"?"btn-primary":"btn-outline-secondary"}`} aria-pressed={view==="cards"} onClick={()=>changeView("cards")}><i className="bi bi-grid-3x2-gap me-1" aria-hidden="true"/>{t("companiesAdmin.viewCards")}</button>
      <button type="button" className={`btn ${view==="list"?"btn-primary":"btn-outline-secondary"}`} aria-pressed={view==="list"} onClick={()=>changeView("list")}><i className="bi bi-list-ul me-1" aria-hidden="true"/>{t("companiesAdmin.viewList")}</button>
     </div>
     <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={()=>edit(null)}>{t("companiesAdmin.new")}</button>
    </div>
   </div>
   <p role="status" aria-live="polite" className="small text-secondary mb-3">{t("companiesAdmin.count",{count:rows.length,total:items.length})}</p>
   {loading?<p role="status">{t("companiesAdmin.loading")}</p>:rows.length===0?<div className="d-flex flex-wrap gap-2 align-items-center">
    <p role="status" className="mb-0">{emptyLabel}</p>
    {(search||status!=="all")&&<button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{setSearch("");setStatus("all")}}>{t("companiesAdmin.reset")}</button>}
   </div>:view==="list"?<div className="table-responsive">
    <table className="table table-hover align-middle">
     <thead><tr><th scope="col">{t("companiesAdmin.name")}</th><th scope="col">{t("companiesAdmin.comment")}</th><th scope="col">{t("companiesAdmin.status")}</th><th scope="col">{t("companiesAdmin.actions")}</th></tr></thead>
     <tbody>{rows.map(company=><tr key={company.id}>
      <th scope="row">{companyName(company)}</th>
      <td className="text-break">{company.comment??"—"}</td>
      <td>{t(company.archivedAt?"companiesAdmin.archived":"companiesAdmin.active")}</td>
      <td>{actions(company)}</td>
     </tr>)}</tbody>
    </table>
   </div>:<div className="row g-3">
    {rows.map(company=><div className="col-12 col-md-6 col-xxl-4" key={company.id}>
     <article className="smn-panel rounded-4 p-3 h-100 d-flex flex-column gap-2">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
       <h2 className="h6 mb-0">{companyName(company)}</h2>
       <span className="badge text-bg-secondary">{t(company.archivedAt?"companiesAdmin.archived":"companiesAdmin.active")}</span>
      </div>
      <p className="small text-secondary mb-2 text-break">{company.comment??"—"}</p>
      <div className="mt-auto">{actions(company)}</div>
     </article>
    </div>)}
   </div>}
  </section>
  {mounted&&editorOpen&&createPortal(<dialog ref={dialogRef} className="smn-company-cockpit-dialog"
   aria-labelledby="smn-company-dialog-title" onCancel={event=>{event.preventDefault();closeEditor()}}>
   <div className="smn-company-cockpit-modal">
    <header className="smn-company-cockpit-header">
     <div className="smn-company-cockpit-identity"><span className="smn-company-cockpit-icon" aria-hidden="true">▦</span>
      <div><span className="smn-company-cockpit-eyebrow">COCKPIT AGILE</span>
       <h2 id="smn-company-dialog-title" className="h5 mb-0">{t(selected?"companiesAdmin.editTitle":"companiesAdmin.createTitle")}</h2></div></div>
     <button type="button" className="btn-close" disabled={busy} aria-label={t("companiesAdmin.cancel")} onClick={closeEditor}/>
    </header>
    <form id="smn-company-dialog-form" onSubmit={save}>
     <div className="smn-company-cockpit-body">
     {error&&<div role="alert" className="alert alert-warning">{error}</div>}
     <div className="row g-3">
    <div className="col-12 col-lg-5">
     <label htmlFor="company-name" className="form-label">{t("companiesAdmin.name")}</label>
     <input id="company-name" className="form-control" required maxLength={120} disabled={busy} value={draft.name} onChange={e=>setDraft(x=>({...x,name:e.target.value}))}/>
    </div>
    <div className="col-12 col-lg-4">
     <label htmlFor="company-comment" className="form-label">{t("companiesAdmin.comment")}</label>
     <textarea id="company-comment" className="form-control" maxLength={2000} disabled={busy} rows={2} value={draft.comment} onChange={e=>setDraft(x=>({...x,comment:e.target.value}))}/>
    </div>
    <div className="col-12 col-lg-3">
     <label htmlFor="company-color" className="form-label">{t("companiesAdmin.color")}</label>
     <select id="company-color" className="form-select" disabled={busy} value={draft.color} onChange={e=>setDraft(x=>({...x,color:e.target.value}))}>
      {palette.map(color=><option key={color} value={color}>{t((`companiesAdmin.colorNames.${color}`) as TranslationKey)}</option>)}
     </select>
    </div>
     </div>
     </div>
     <footer className="smn-company-cockpit-footer d-flex justify-content-end flex-wrap gap-2">
      <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={closeEditor}>{t("companiesAdmin.cancel")}</button>
      <button type="submit" className="btn btn-primary" disabled={busy||!draft.name.trim()||!dirty}>{t(busy?"companiesAdmin.saving":"companiesAdmin.save")}</button>
     </footer>
    </form>
   </div>
  </dialog>,document.body)}
 </div>;
}
