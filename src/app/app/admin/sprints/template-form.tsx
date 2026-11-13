"use client";
import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {filterSettingsCeremonies} from "@/lib/settings-collection-filter";
import {OPEN_CEREMONY_TEMPLATE} from "../settings/ceremonies/template-create-button";
import {IconPicker} from "../../icon-picker";
import {SMNIcon} from "../../smn-icon";
import {ceremonyIconColorHex,type CeremonyIconColor} from "@/lib/ceremony-appearance";
import type {DashboardIconName} from "@/lib/dashboard-builder/icon-catalog";
type Frequency="daily"|"weekly"|"sprint";
type Input={name:string;frequency:Frequency;weekday:number|null;position:"start"|"end"|null;time:string;duration:number;icon?:DashboardIconName|null;iconColor?:CeremonyIconColor|null};
type Row=Input&{id:string;active:boolean;revision:number};
const empty:Input={name:"",frequency:"daily",weekday:null,position:null,time:"09:00",duration:30,icon:null,iconColor:null};
const inputFrom=(x:Row):Input=>({name:x.name,frequency:x.frequency,weekday:x.weekday,position:x.position,time:x.time.slice(0,5),duration:x.duration,icon:x.icon??null,iconColor:x.iconColor??null});
export default function TemplateForm(){
 const t=useTranslation();
 const [rows,setRows]=useState<Row[]>([]);
 const [teamId,setTeamId]=useState<string|null>(null);
 const [id,setId]=useState("");
 const [editorOpen,setEditorOpen]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const [form,setForm]=useState<Input>(empty);
 const [active,setActive]=useState(true);
 const [revision,setRevision]=useState(1);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [query,setQuery]=useState("");
 const [stateFilter,setStateFilter]=useState<"all"|"active"|"inactive">("all");
 const current=rows.find(row=>row.id===id);
 const dirty=JSON.stringify(form)!==JSON.stringify(current?inputFrom(current):empty)||active!==(current?.active??true);
 useUnsavedChanges(editorOpen&&(dirty||busy),t("draft.leaveWarning"));
 const filtered=useMemo(()=>filterSettingsCeremonies(rows,query,stateFilter,""),[rows,query,stateFilter]);
 const matchCount=filtered.length;
 async function load(){const r=await fetch("/api/admin/sprints/templates",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setRows(j.templates);setTeamId(j.teamId??null);}
 useEffect(()=>{void Promise.resolve().then(load).catch(()=>setError(t("ceremonyTemplates.error")));},[t]);
 function choose(key:string){
  if(busy)return;
  if(editorOpen&&dirty&&!window.confirm(t("draft.discardWarning")))return;
  openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const x=rows.find(v=>v.id===key);
  setId(x?.id??"");setForm(x?inputFrom(x):empty);setActive(x?.active??true);setRevision(x?.revision??1);
  setError("");setMessage("");setEditorOpen(true);
 }
 function closeEditor(){
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  setEditorOpen(false);setId("");setForm(empty);setActive(true);setRevision(1);setError("");
 }
 useEffect(()=>{
  const listener=()=>choose("");
  window.addEventListener(OPEN_CEREMONY_TEMPLATE,listener);
  return()=>window.removeEventListener(OPEN_CEREMONY_TEMPLATE,listener);
 });
 useEffect(()=>{
  if(!editorOpen)return;
  const dialog=dialogRef.current;
  if(!dialog)return;
  dialog.showModal();
  dialog.querySelector<HTMLInputElement>("#template-name")?.focus();
  return()=>{if(dialog.open)dialog.close();openerRef.current?.focus();};
 },[editorOpen]);
 async function remove(row:Row){
  if(busy)return;
  if(!window.confirm(t("ceremonyTemplates.confirmDelete",{name:row.name})))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/sprints/templates",{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:row.id,revision:row.revision,...(teamId?{teamId}:{})})
   });
   if(!response.ok){
    const result=await response.json().catch(()=>({})) as {error?:string};
    setError(t(result.error==="has-occurrences"?"ceremonyTemplates.hasOccurrences":
     result.error==="conflict"?"ceremonyTemplates.conflict":"ceremonyTemplates.deleteError"));
    return;
   }
   await load();setMessage(t("ceremonyTemplates.deleted"));
  }catch{setError(t("ceremonyTemplates.deleteError"));}
  finally{setBusy(false);}
 }
 async function save(e:FormEvent){
  e.preventDefault();if(busy||!dirty)return;
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/sprints/templates",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...(id?{id,revision}:{}),...(teamId?{teamId}:{}),active,template:form})});
   if(!r.ok)throw Error("save");
   await load();
   setId("");setForm(empty);setActive(true);setRevision(1);setEditorOpen(false);
   setMessage(t("ceremonyTemplates.saved"));
  }catch{setError(t("ceremonyTemplates.error"))}finally{setBusy(false)}
 }

 return <section className="smn-panel p-4 smn-ceremony-templates-panel">
  <h2 className="h4">{t("ceremonyTemplates.title")}</h2>
  <p>{t("ceremonyTemplates.intro")}</p>
  <div className="row g-3 mb-3">
   <div className="col-md-7"><label className="form-label" htmlFor="template-search">{t("settingsCollections.searchTemplates")}</label>
    <input type="search" id="template-search" className="form-control" value={query} onChange={event=>setQuery(event.target.value)}/></div>
   <div className="col-md-5"><label className="form-label" htmlFor="template-status">{t("settingsCollections.filterStatus")}</label>
    <select id="template-status" className="form-select" value={stateFilter} onChange={event=>setStateFilter(event.target.value as "all"|"active"|"inactive")}>
     <option value="all">{t("settingsCollections.all")}</option>
     <option value="active">{t("settingsCollections.active")}</option>
     <option value="inactive">{t("settingsCollections.inactive")}</option>
    </select></div>
  </div>
  <p role="status" aria-live="polite" className="small text-secondary">{t("settingsCollections.results",{count:matchCount,total:rows.length})}</p>
  {matchCount===0&&<p className="small text-secondary" role="status">{t("settingsCollections.noMatches")} <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setQuery("");setStateFilter("all");}}>{t("settingsCollections.reset")}</button></p>}
  <div className="table-responsive">
   <table className="table table-hover align-middle smn-ceremony-templates-table">
    <thead><tr>
     <th scope="col">{t("ceremonyTemplates.icon")}</th>
     <th scope="col">{t("ceremonyTemplates.name")}</th>
     <th scope="col">{t("ceremonyTemplates.frequency")}</th>
     <th scope="col">{t("ceremonyTemplates.time")}</th>
     <th scope="col">{t("ceremonyTemplates.duration")}</th>
     <th scope="col">{t("ceremonyTemplates.status")}</th>
     <th scope="col" className="text-end">{t("ceremonyTemplates.actions")}</th>
    </tr></thead>
    <tbody>{filtered.map(row=><tr key={row.id}>
     <td><span className="smn-ceremony-template-icon" style={{color:ceremonyIconColorHex(row.iconColor)??"var(--smn-brand)"}}>
      {row.icon?<SMNIcon name={row.icon} size="1.35rem"/>:<span aria-hidden="true">◷</span>}
     </span></td>
     <td className="fw-semibold">{row.name}</td>
     <td>{t(("ceremonyTemplates."+row.frequency) as "ceremonyTemplates.daily")}</td>
     <td>{row.time.slice(0,5)}</td>
     <td>{row.duration} min</td>
     <td>{t(row.active?"ceremonyTemplates.enabled":"ceremonyTemplates.disabled")}</td>
     <td className="text-end"><div className="d-inline-flex gap-2">
      <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy}
       aria-label={t("ceremonyTemplates.edit")+": "+row.name} title={t("ceremonyTemplates.edit")}
       onClick={()=>choose(row.id)}><i className="bi bi-pencil-square" aria-hidden="true"/></button>
      <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
       aria-label={t("ceremonyTemplates.delete")+": "+row.name} title={t("ceremonyTemplates.delete")}
       onClick={()=>void remove(row)}><i className="bi bi-trash3" aria-hidden="true"/></button>
     </div></td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small text-secondary mt-3">{t("ceremonyTemplates.capacity")}</p>
  {error&&!editorOpen&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&!editorOpen&&<p role="status" className="alert alert-success">{message}</p>}
  {editorOpen&&<dialog ref={dialogRef} className="smn-ceremony-template-dialog"
   aria-labelledby="smn-ceremony-template-title"
   onCancel={event=>{event.preventDefault();closeEditor();}}>
   <div className="smn-ceremony-template-modal">
    <header className="smn-ceremony-template-header">
     <div className="smn-ceremony-template-identity">
      <span className="smn-ceremony-template-header-icon" aria-hidden="true">◷</span>
      <div><span className="smn-ceremony-template-eyebrow">COCKPIT AGILE</span>
       <h2 id="smn-ceremony-template-title" className="h5 mb-0">{t(id?"ceremonyTemplates.edit":"ceremonyTemplates.new")}</h2>
      </div>
     </div>
     <button type="button" className="btn-close" disabled={busy} aria-label={t("ceremonyTemplates.cancel")} onClick={closeEditor}/>
    </header>
    <div className="smn-ceremony-template-body">
     {dirty&&<p role="status" className="small text-secondary">{t("draft.pending")}</p>}
     {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 <form id="smn-ceremony-template-editor" className="row g-3" onSubmit={save}>
 <div className="col-md-6"><label className="form-label" htmlFor="template-name">{t("ceremonyTemplates.name")}</label><input id="template-name" className="form-control" value={form.name} disabled={busy} required maxLength={120} onChange={e=>setForm({...form,name:e.target.value})}/></div>
 <div className="col-md-6"><label className="form-label" htmlFor="template-frequency">{t("ceremonyTemplates.frequency")}</label><select id="template-frequency" className="form-select" disabled={busy} value={form.frequency} onChange={e=>{const frequency=e.target.value as Frequency;setForm({...form,frequency,weekday:frequency==="weekly"?1:null,position:frequency==="sprint"?"start":null});}}><option value="daily">{t("ceremonyTemplates.daily")}</option><option value="weekly">{t("ceremonyTemplates.weekly")}</option><option value="sprint">{t("ceremonyTemplates.sprint")}</option></select></div>
 {form.frequency==="weekly"&&<div className="col-md-6"><label htmlFor="template-day" className="form-label">{t("ceremonyTemplates.weekday")}</label><select id="template-day" className="form-select" disabled={busy} value={form.weekday??1} onChange={e=>setForm({...form,weekday:Number(e.target.value)})}>{Array.from({length:7},(_,i)=><option key={i+1} value={i+1}>{t("ceremonyTemplates.day",{number:i+1})}</option>)}</select></div>}
 {form.frequency==="sprint"&&<div className="col-md-6"><label htmlFor="template-position" className="form-label">{t("ceremonyTemplates.position")}</label><select id="template-position" className="form-select" disabled={busy} value={form.position??"start"} onChange={e=>setForm({...form,position:e.target.value as "start"|"end"})}><option value="start">{t("ceremonyTemplates.start")}</option><option value="end">{t("ceremonyTemplates.end")}</option></select></div>}
 <div className="col-md-4"><label htmlFor="template-time" className="form-label">{t("ceremonyTemplates.time")}</label><input id="template-time" type="time" className="form-control" required disabled={busy} value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
 <div className="col-md-4"><label htmlFor="template-duration" className="form-label">{t("ceremonyTemplates.duration")}</label><input id="template-duration" type="number" min={1} max={480} required disabled={busy} className="form-control" value={form.duration} onChange={e=>setForm({...form,duration:Number(e.target.value)})}/></div>
 <div className="col-12"><div className="border rounded-3 p-3">
  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
   <div>
    <div className="form-label fw-semibold mb-1">{t("settingsCollections.ceremonyIcon")}</div>
    <p className="small text-body-secondary mb-2">{t("settingsCollections.ceremonyIconHelp")}</p>
    <IconPicker value={form.icon??undefined} onChange={icon=>setForm(current=>({...current,icon:icon??null}))} color={form.iconColor} onColorChange={iconColor=>setForm(current=>({...current,iconColor:iconColor??null}))} disabled={busy} label={t("settingsCollections.ceremonyIconPicker")}/>
   </div>
   <div className="d-inline-flex align-items-center gap-2 rounded-3 border px-3 py-2" role="status" aria-label={t("settingsCollections.ceremonyPreview")}>
    {form.icon&&<span style={{color:ceremonyIconColorHex(form.iconColor)??"var(--smn-foreground)"}}>
     <SMNIcon name={form.icon} size="1.5rem"/>
    </span>}
    <span className="small">{form.name.trim()||t("settingsCollections.ceremonyPreview")}</span>
   </div>
  </div>
 </div></div>
 <div className="col-md-4"><label htmlFor="template-active" className="form-check-label">{t("ceremonyTemplates.enabled")}</label><input id="template-active" type="checkbox" className="form-check-input ms-2" disabled={busy} checked={active} onChange={e=>setActive(e.target.checked)}/></div>
</form>

    </div>
    <footer className="smn-ceremony-template-footer d-flex justify-content-end gap-2">
     <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={closeEditor}>{t("ceremonyTemplates.cancel")}</button>
     <button form="smn-ceremony-template-editor" className="btn btn-primary" type="submit" disabled={busy||!dirty||!form.name.trim()}>{t("ceremonyTemplates.save")}</button>
    </footer>
   </div>
  </dialog>}
 </section>;
}
