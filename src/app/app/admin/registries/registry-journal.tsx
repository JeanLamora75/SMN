"use client";

import Link from "next/link";
import RegistryCreateModal from "./registry-create-modal";
import RegistrySectionDialog from "./registry-section-dialog";
import RegistryEditModal from "./registry-edit-modal";
import BootstrapIcon from "../../bootstrap-icon";
import {linkedJournalTypes,type LinkedJournalType} from "@/lib/registry-linked-creation";
import {useEffect,useId,useMemo,useState,type FormEvent} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import {validRegistryActivityTime} from "@/lib/registry-summary-context";
import {registryDetailHref,type RegistryNavigation} from "@/lib/registry-navigation";
import {
 buildJournalEntries,filterJournalEntries,journalFilters,parseJournalPayload,
 type JournalComment,type JournalFilter,type JournalPayload
} from "@/lib/registry-journal";

type Version={revision:number;action:string;beforeText:string|null;afterText:string|null;
 actorName:string;changedAt:string};
type VersionState={state:"loading"|"unavailable"|"ready";items:Version[]};
const recordIdRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RegistryJournal({itemId,itemTitle,teamId,canManage,navigation}:{
 itemId:string;itemTitle:string;teamId:string;canManage:boolean;
 navigation:RegistryNavigation;
}){
 const t=useTranslation(),locale=useLocale();
 const tr=(key:string)=>t(("registryJournal."+key) as Parameters<typeof t>[0]);
 const commentsText=(key:string)=>t(("registryComments."+key) as Parameters<typeof t>[0]);
 const recordType=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const editorId=useId();
 const [state,setState]=useState<"loading"|"unavailable"|"ready">("loading");
 const [data,setData]=useState<JournalPayload|null>(null);
 const [reload,setReload]=useState(0);
 const [filter,setFilter]=useState<JournalFilter>("all");
 const [query,setQuery]=useState("");
 const [order,setOrder]=useState<"newest"|"oldest">("newest");
 const [draft,setDraft]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState<"conflict"|"unavailable"|"invalid"|null>(null);
 const [success,setSuccess]=useState(false);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [editingText,setEditingText]=useState("");
 const [editSaving,setEditSaving]=useState(false);
 const [actionError,setActionError]=useState<string|null>(null);
 const [versions,setVersions]=useState<Record<string,VersionState>>({});
 const [versionsOpen,setVersionsOpen]=useState<string|null>(null);
 const [commentOpen,setCommentOpen]=useState(false);
 const [linkedEditId,setLinkedEditId]=useState<string|null>(null);
 const [chooseLinked,setChooseLinked]=useState(false);
 const [linkedType,setLinkedType]=useState<LinkedJournalType|null>(null);
 const [linkedCreated,setLinkedCreated]=useState<{id:string;type:LinkedJournalType}|null>(null);

 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(itemId)+"/journal",{
   cache:"no-store",signal:ctrl.signal
  }).then(async response=>{
   if(!response.ok)throw Error("journal-unavailable");
   const parsed=parseJournalPayload(await response.json() as unknown);
   if(!parsed)throw Error("invalid-journal-payload");
   return parsed;
  }).then(parsed=>{
   if(ctrl.signal.aborted)return;
   setData(parsed);setState("ready");setActionError(null);
  }).catch(()=>{
   if(ctrl.signal.aborted)return;
   setData(null);setState("unavailable");
  });
  return()=>ctrl.abort();
 },[itemId,reload]);
 const refresh=()=>{setState("loading");setReload(n=>n+1);};
 const discardEdit=()=>{
  const initial=data?.comments.find(c=>c.id===editingId)?.text??"";
  return editingId===null||editingText===initial||
   window.confirm(tr("discardEdit"));
 };
 useEffect(()=>{
  const original=editingId?data?.comments.find(c=>c.id===editingId)?.text??"":null;
  if(draft.length===0&&(original===null||editingText===original))return;
  const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",guard);
  return()=>window.removeEventListener("beforeunload",guard);
 },[draft,editingId,editingText,data]);
 const entries=useMemo(()=>data?buildJournalEntries(data):[],[data]);
 const visible=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase(locale==="fr"?"fr":"en");
  const filtered=filterJournalEntries(entries,filter).filter(entry=>!term||
   (entry.kind==="comment"?[entry.comment.text,entry.comment.authorName]:
    [entry.title,entry.authorName,recordType(entry.type)]).some(value=>
     (value??"").toLocaleLowerCase(locale==="fr"?"fr":"en").includes(term)));
  return order==="newest"?filtered:filtered.reverse();
 },[entries,filter,query,order,locale]);
 const formatter=useMemo(()=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"
 }),[locale]);
 const when=(iso:string)=>formatter.format(new Date(iso));
 const dateOnly=useMemo(()=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"Europe/Paris"}),[locale]);
 const timeOnly=useMemo(()=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Europe/Paris"}),[locale]);
 const url="/api/admin/registries/"+encodeURIComponent(itemId)+"/comments";
 const createUrl=url+"?teamId="+encodeURIComponent(teamId);
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!canManage||saving||!draft.trim()||draft.length>4000)return;
  setSaving(true);setError(null);setSuccess(false);
  try{
   const response=await fetch(createUrl,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:draft})
   });
   if(response.status===409){setError("conflict");return;}
   if(response.status===400){setError("invalid");return;}
   if(!response.ok)throw Error("unavailable");
   const result=await response.json() as {ok?:boolean;id?:string;revision?:number};
   if(response.status!==201||!result.ok||typeof result.id!=="string"||
    !recordIdRx.test(result.id)||result.revision!==1)throw Error("unconfirmed");
   setDraft("");setSuccess(true);setCommentOpen(false);
   refresh();
  }catch{setError("unavailable");}
  finally{setSaving(false);}
 };
 const edit=async(comment:JournalComment)=>{
  if(!canManage||editSaving||editingId!==comment.id||!editingText.trim()||
   editingText.length>4000||editingText.trim()===comment.text)return;
  setEditSaving(true);setError(null);setActionError(null);setSuccess(false);
  try{
   const response=await fetch(url+"/"+encodeURIComponent(comment.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:editingText,revision:comment.revision})
   });
   if(response.status===409){setActionError("conflict");return;}
   if(response.status===400){setActionError("invalid");return;}
   if(!response.ok)throw Error("unavailable");
   const result=await response.json() as {ok?:boolean;revision?:number};
   if(!result.ok||result.revision!==comment.revision+1)throw Error("unconfirmed");
   setEditingId(null);setEditingText("");setVersions({});setVersionsOpen(null);setSuccess(true);
   refresh();
  }catch{setActionError("unavailable");}
  finally{setEditSaving(false);}
 };
 const withdraw=async(comment:JournalComment)=>{
  if(!canManage||editSaving||comment.withdrawn||
   !window.confirm(commentsText("confirmWithdraw")))return;
  setEditSaving(true);setActionError(null);setSuccess(false);
  try{
   const response=await fetch(url+"/"+encodeURIComponent(comment.id),{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({revision:comment.revision})
   });
   if(response.status===409){setActionError("conflict");return;}
   if(response.status===400){setActionError("invalid");return;}
   if(!response.ok)throw Error("unavailable");
   const result=await response.json() as {ok?:boolean;revision?:number};
   if(!result.ok||result.revision!==comment.revision+1)throw Error("unconfirmed");
   setVersions({});setVersionsOpen(null);setSuccess(true);refresh();
  }catch{setActionError("unavailable");}
  finally{setEditSaving(false);}
 };
 const readVersions=async(commentId:string,force=false)=>{
  if(!canManage)return;
  if(versionsOpen===commentId&&!force){setVersionsOpen(null);return;}
  setVersionsOpen(commentId);
  if(versions[commentId]?.state==="ready"&&!force)return;
  setVersions(old=>({...old,[commentId]:{state:"loading",items:[]}}));
  try{
   const response=await fetch(url+"/"+encodeURIComponent(commentId)+"/revisions",{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const payload=await response.json() as {versions?:Version[]};
   if(!Array.isArray(payload.versions)||!payload.versions.every(v=>
    Number.isSafeInteger(v.revision)&&v.revision>=1&&
    ["created","edited","withdrawn"].includes(v.action)&&typeof v.actorName==="string"&&
    validRegistryActivityTime(v.changedAt)!==null&&
    (v.beforeText===null||typeof v.beforeText==="string")&&
    (v.afterText===null||typeof v.afterText==="string")))throw Error("invalid");
   setVersions(old=>({...old,[commentId]:{state:"ready",items:payload.versions!}}));
  }catch{setVersions(old=>({...old,[commentId]:{state:"unavailable",items:[]}}));}
 };
 return <section className="smn-registry-journal" aria-label={tr("heading")}
  data-registry-dirty={Boolean(commentOpen&&draft.length>0||editingId&&editingText!==(data?.comments.find(c=>c.id===editingId)?.text??""))}>
  {success&&<p role="status" className="small text-success mb-0">{tr("saved")}</p>}
   {linkedCreated&&<div role="status" className="smn-registry-linked-success">
    <span>{tr("createdLinked")}</span>
    <Link href={registryDetailHref(linkedCreated.id,navigation)}
     className="btn btn-sm btn-outline-success">{tr("viewLinked")}</Link>
    <button type="button" className="btn btn-sm btn-outline-success"
     onClick={()=>{setLinkedCreated(null);setChooseLinked(true);}}>
     {tr("createAnotherLinked")}
    </button>
    <Link href={registryDetailHref(itemId,{origin:navigation.origin,trail:navigation.trail.slice(0,-1)})}
     className="btn btn-sm btn-link">{tr("backToSource")}</Link>
   </div>}
  {canManage&&commentOpen&&<RegistrySectionDialog title={t("registryJournal.addComment")}
   onDismiss={()=>setCommentOpen(false)} wide>
   <div className="smn-registry-journal-compose-dialog">
  {canManage&&<form className="smn-registry-journal-compose" onSubmit={save}>
   <label className="form-label" htmlFor={editorId}>{tr("writeComment")}</label>
   <textarea className="form-control" id={editorId} rows={3} maxLength={4000}
    value={draft} disabled={saving} onChange={e=>{setDraft(e.target.value);setSuccess(false);}}
    placeholder={tr("placeholder")}/>
   <div className="smn-registry-journal-compose-bottom">
    <span className="small text-body-secondary" aria-live="polite">{draft.length}/4000</span>
    <button type="submit" className="btn btn-primary btn-sm"
     disabled={saving||!draft.trim()}>{saving?commentsText("saving"):tr("submit")}</button>
   </div>
   {error&&<p role="alert" className="small text-danger mb-0">{commentsText(error)}</p>}
  </form>}


   </div>
  </RegistrySectionDialog>}
  {canManage&&chooseLinked&&<RegistrySectionDialog title={tr("chooseLinked")}
   onDismiss={()=>setChooseLinked(false)}>
   <div className="d-flex flex-wrap gap-2">
    {linkedJournalTypes.map(type=><button key={type} type="button"
     className="btn btn-outline-primary" onClick={()=>{setLinkedType(type);setChooseLinked(false);}}>
     {tr(type)}</button>)}
   </div>
  </RegistrySectionDialog>}
  <div className="smn-registry-journal-toolbar">
   <input type="search" className="form-control form-control-sm smn-registry-journal-search"
    aria-label={t("registryJournal.search")} placeholder={t("registryJournal.search")}
    value={query} onChange={event=>setQuery(event.target.value)}/>
   <div className="smn-registry-journal-filters" role="group" aria-label={tr("filters")}>
    {journalFilters.map(kind=><button type="button" key={kind}
     className={"btn btn-sm "+(filter===kind?"btn-primary":"btn-outline-secondary")}
     aria-pressed={filter===kind} onClick={()=>setFilter(kind)}>
     {tr(kind)} ({filterJournalEntries(entries,kind).length})</button>)}
   </div>
   <select className="form-select form-select-sm smn-registry-journal-sort"
    aria-label={t("registryJournal.sort")} value={order}
    onChange={event=>setOrder(event.target.value as "newest"|"oldest")}>
    <option value="newest">{t("registryJournal.newest")}</option>
    <option value="oldest">{t("registryJournal.oldest")}</option>
   </select>
   {canManage&&<div className="smn-registry-journal-toolbar-actions">
    <button type="button" className="btn btn-outline-primary btn-sm"
     onClick={()=>setCommentOpen(true)}>{t("registryJournal.addComment")}</button>
    <button type="button" className="btn btn-primary btn-sm"
     onClick={()=>setChooseLinked(true)}>{t("registryJournal.addJournalRecord")}</button>
   </div>}
  </div>
  {state==="loading"?<p role="status" className="small text-body-secondary mb-0">{tr("loading")}</p>:
   state==="unavailable"?<div role="alert" className="d-flex flex-wrap align-items-center gap-2">
    <span>{tr("unavailable")}</span>
    <button type="button" className="btn btn-outline-secondary btn-sm"
     onClick={refresh}>{tr("retry")}</button>
   </div>:
   <>
    {actionError&&<p role="alert" className="small text-danger">{commentsText(actionError)}</p>}
    {visible.length===0?<div className="smn-registry-journal-empty">
     <p className="mb-2">{entries.length===0?tr("empty"):tr("emptyFiltered")}</p>
     {(filter!=="all"||query)&&<button type="button" className="btn btn-outline-secondary btn-sm"
      onClick={()=>{setFilter("all");setQuery("");}}>{tr("reset")}</button>}
    </div>:
    <ol className="smn-registry-journal-list">
     {visible.map(entry=><li key={entry.id} className={"smn-registry-journal-entry smn-registry-journal-entry-"+(entry.kind==="comment"?"comment":entry.type)}>
      <time className="smn-registry-journal-entry-date" dateTime={entry.at}><span>{dateOnly.format(new Date(entry.at))}</span><span>{timeOnly.format(new Date(entry.at))}</span></time>
      <div className="smn-registry-journal-entry-type">
       <span className={"smn-registry-journal-kind smn-registry-journal-kind-"+(entry.kind==="comment"?"comment":entry.type)}>
        {entry.kind==="comment"?tr("comment"):recordType(entry.type)}
       </span>
      </div>
      <div className="smn-registry-journal-entry-main">
       <div className="smn-registry-journal-entry-author small text-body-secondary">
        {entry.kind==="comment"?(entry.comment.authorName??commentsText("unknownAuthor")):
         (entry.authorName??commentsText("unknownAuthor"))}
        {entry.kind==="comment"&&entry.comment.edited&&
         <span className="smn-registry-journal-meta"> · {commentsText("edited")}</span>}
       </div>
      {entry.kind==="link"?
       <div className="smn-registry-journal-linked-title">
        <Link href={registryDetailHref(entry.recordId,navigation)}>{entry.title}</Link>
        <div className="small text-body-secondary">{tr(entry.eventKind==="created"?"linkedCreatedEvent":"link")}</div>
       </div>:
       <>
        {entry.comment.withdrawn?<p className="smn-registry-journal-withdrawn mb-0">
         {commentsText("withdrawn")}</p>:
         <p className="smn-registry-journal-content"><strong className="smn-registry-journal-comment-title">{tr("comment")}</strong><span>{entry.comment.text}</span></p>}
        {canManage&&editingId===entry.comment.id&&!entry.comment.withdrawn&&
         <div className="smn-registry-journal-editor">
          <label className="form-label" htmlFor={editorId+"-"+entry.comment.id}>
           {commentsText("edit")}
          </label>
          <textarea id={editorId+"-"+entry.comment.id} className="form-control"
           rows={3} maxLength={4000} value={editingText} disabled={editSaving}
           onChange={e=>setEditingText(e.target.value)}/>
          <div className="d-flex flex-wrap justify-content-end gap-2 mt-2">
           <button type="button" className="btn btn-outline-secondary btn-sm"
            disabled={editSaving} onClick={()=>{
             if(!discardEdit())return;
             setEditingId(null);setActionError(null);
            }}>
            {commentsText("cancel")}
           </button>
           <button type="button" className="btn btn-primary btn-sm"
            disabled={editSaving||!editingText.trim()||editingText.trim()===entry.comment.text}
            onClick={()=>void edit(entry.comment)}>{editSaving?commentsText("saving"):commentsText("save")}</button>
          </div>
         </div>}
        {canManage&&versionsOpen===entry.comment.id&&
         <div className="smn-registry-journal-versions" id={editorId+"-versions-"+entry.comment.id} aria-label={commentsText("versions")}>
          {versions[entry.comment.id]?.state==="loading"?<p role="status">{tr("loading")}</p>:
           versions[entry.comment.id]?.state==="unavailable"?
            <div role="alert">{tr("unavailable")}
             <button type="button" className="btn btn-sm btn-outline-secondary ms-2"
              onClick={()=>void readVersions(entry.comment.id,true)}>{tr("retry")}</button>
            </div>:
           <ul className="list-unstyled mb-0">
            {(versions[entry.comment.id]?.items??[]).map(v=><li key={v.revision}
             className="smn-registry-journal-version">
             <strong>{commentsText("versions")} {v.revision} · {commentsText(v.action)}</strong>
             <div className="small text-body-secondary">
              {v.actorName} · <time dateTime={v.changedAt}>{when(v.changedAt)}</time>
             </div>
             {v.beforeText!==null&&<p className="mb-1">{tr("before")}: {v.beforeText}</p>}
             {v.afterText!==null&&<p className="mb-0">{tr("after")}: {v.afterText}</p>}
            </li>)}
           </ul>}
         </div>}
       </>}
      </div>
      {canManage&&<div className="smn-registry-journal-actions">
       {entry.kind==="comment"?!entry.comment.withdrawn&&<>
        <button type="button" className="btn btn-outline-secondary btn-sm"
         title={commentsText("edit")} aria-label={commentsText("edit")} disabled={editSaving}
         onClick={()=>{if(!discardEdit())return;setEditingId(entry.comment.id);setEditingText(entry.comment.text??"");setActionError(null);}}>
         <BootstrapIcon name="pencil-square"/>
        </button>
        <button type="button" className="btn btn-outline-danger btn-sm"
         title={commentsText("withdraw")} aria-label={commentsText("withdraw")} disabled={editSaving}
         onClick={()=>void withdraw(entry.comment)}>
         <BootstrapIcon name="trash"/>
        </button>
       </>:<button type="button" className="btn btn-outline-secondary btn-sm"
        title={commentsText("edit")} aria-label={commentsText("edit")}
        onClick={()=>setLinkedEditId(entry.recordId)}><BootstrapIcon name="pencil-square"/></button>}
      </div>}
     </li>)}
    </ol>}
    {canManage&&data?.legacy&&<aside className="smn-registry-journal-legacy">
     <h3 className="h6">{commentsText("legacy")}</h3>
     <p className="smn-registry-journal-content mb-1">{data.legacy.text}</p>
     <p className="small text-body-secondary mb-0">{commentsText("legacyUndated")}</p>
    </aside>}
   </>}
  {canManage&&linkedEditId&&<RegistryEditModal id={linkedEditId} teamId={teamId}
   onSaved={()=>{setLinkedEditId(null);refresh();}}
   onDismiss={()=>setLinkedEditId(null)}/>}
  {canManage&&linkedType&&<RegistryCreateModal key={linkedType} teamId={teamId}
   initialType={linkedType} sourceId={itemId} sourceTitle={itemTitle}
   linkedFromJournal
   onCreated={id=>{
    const type=linkedType;
    setLinkedCreated({id,type});
    setLinkedType(null);
    setChooseLinked(false);
    setFilter(type);
    refresh();
   }}
   onDismiss={()=>setLinkedType(null)}/>}
 </section>;
}
