"use client";

import Link from "next/link";
import {useEffect,useId,useMemo,useState,type FormEvent} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import {validRegistryActivityTime} from "@/lib/registry-summary-context";
import {
 buildJournalEntries,filterJournalEntries,journalFilters,parseJournalPayload,
 type JournalComment,type JournalFilter,type JournalPayload
} from "@/lib/registry-journal";

type Version={revision:number;action:string;beforeText:string|null;afterText:string|null;
 actorName:string;changedAt:string};
type VersionState={state:"loading"|"unavailable"|"ready";items:Version[]};
const recordIdRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RegistryJournal({itemId,canManage}:{
 itemId:string;canManage:boolean;
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
 const [draft,setDraft]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState<"conflict"|"unavailable"|"invalid"|null>(null);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [editingText,setEditingText]=useState("");
 const [editSaving,setEditSaving]=useState(false);
 const [actionError,setActionError]=useState<string|null>(null);
 const [versions,setVersions]=useState<Record<string,VersionState>>({});
 const [versionsOpen,setVersionsOpen]=useState<string|null>(null);

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
 const entries=useMemo(()=>data?buildJournalEntries(data):[],[data]);
 const visible=useMemo(()=>filterJournalEntries(entries,filter),[entries,filter]);
 const formatter=useMemo(()=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"
 }),[locale]);
 const when=(iso:string)=>formatter.format(new Date(iso));
 const url="/api/admin/registries/"+encodeURIComponent(itemId)+"/comments";
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!canManage||saving||!draft.trim()||draft.length>4000)return;
  setSaving(true);setError(null);
  try{
   const response=await fetch(url,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:draft})
   });
   if(response.status===409){setError("conflict");return;}
   if(response.status===400){setError("invalid");return;}
   if(!response.ok)throw Error("unavailable");
   const result=await response.json() as {ok?:boolean;id?:string;revision?:number};
   if(response.status!==201||!result.ok||typeof result.id!=="string"||
    !recordIdRx.test(result.id)||result.revision!==1)throw Error("unconfirmed");
   setDraft("");
   refresh();
  }catch{setError("unavailable");}
  finally{setSaving(false);}
 };
 const edit=async(comment:JournalComment)=>{
  if(!canManage||editSaving||editingId!==comment.id||!editingText.trim()||
   editingText.length>4000||editingText.trim()===comment.text)return;
  setEditSaving(true);setError(null);setActionError(null);
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
   setEditingId(null);setEditingText("");setVersions({});
   refresh();
  }catch{setActionError("unavailable");}
  finally{setEditSaving(false);}
 };
 const withdraw=async(comment:JournalComment)=>{
  if(!canManage||editSaving||comment.withdrawn||
   !window.confirm(commentsText("confirmWithdraw")))return;
  setEditSaving(true);setActionError(null);
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
   setVersions({});refresh();
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
 return <section className="smn-registry-journal" aria-label={tr("heading")}>
  {canManage&&<form className="smn-registry-journal-compose" onSubmit={save}>
   <label className="form-label" htmlFor={editorId}>{tr("writeComment")}</label>
   <textarea className="form-control" id={editorId} rows={3} maxLength={4000}
    value={draft} disabled={saving} onChange={e=>setDraft(e.target.value)}
    placeholder={tr("placeholder")}/>
   <div className="smn-registry-journal-compose-bottom">
    <span className="small text-body-secondary" aria-live="polite">{draft.length}/4000</span>
    <button type="submit" className="btn btn-primary btn-sm"
     disabled={saving||!draft.trim()}>{saving?commentsText("saving"):tr("submit")}</button>
   </div>
   {error&&<p role="alert" className="small text-danger mb-0">{commentsText(error)}</p>}
  </form>}
  <div className="smn-registry-journal-filters" role="group" aria-label={tr("filters")}>
   {journalFilters.map(kind=><button type="button" key={kind}
    className={"btn btn-sm "+(filter===kind?"btn-primary":"btn-outline-secondary")}
    aria-pressed={filter===kind} onClick={()=>setFilter(kind)}>{tr(kind)}</button>)}
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
     {filter!=="all"&&<button type="button" className="btn btn-outline-secondary btn-sm"
      onClick={()=>setFilter("all")}>{tr("reset")}</button>}
    </div>:
    <ol className="smn-registry-journal-list">
     {visible.map(entry=><li key={entry.id} className="smn-registry-journal-entry">
      <div className="smn-registry-journal-entry-top">
       <strong>{entry.kind==="comment"?tr("comment"):tr("link")+
        " · "+recordType(entry.type)}</strong>
       <time dateTime={entry.at}>{when(entry.at)}</time>
      </div>
      <div className="small text-body-secondary">
       {entry.kind==="comment"?
        (entry.comment.authorName??commentsText("unknownAuthor")):
        (entry.authorName??commentsText("unknownAuthor"))}
       {entry.kind==="comment"&&entry.comment.edited&&
        <span className="smn-registry-journal-meta"> · {commentsText("edited")}</span>}
      </div>
      {entry.kind==="link"?
       <Link href={"/app/admin/registries/"+encodeURIComponent(entry.recordId)}>
        {entry.title}
       </Link>:
       <>
        {entry.comment.withdrawn?<p className="smn-registry-journal-withdrawn mb-0">
         {commentsText("withdrawn")}</p>:
         <p className="smn-registry-journal-content">{entry.comment.text}</p>}
        {canManage&&<div className="smn-registry-journal-actions">
         {!entry.comment.withdrawn&&<>
          <button type="button" className="btn btn-outline-secondary btn-sm"
           disabled={editSaving} onClick={()=>{
            if(editingId===entry.comment.id){setEditingId(null);setEditingText("");}
            else{setEditingId(entry.comment.id);setEditingText(entry.comment.text??"");}
            setActionError(null);
           }}>{commentsText("edit")}</button>
          <button type="button" className="btn btn-outline-secondary btn-sm"
           disabled={editSaving} onClick={()=>void withdraw(entry.comment)}>
           {commentsText("withdraw")}
          </button>
         </>}
         <button type="button" className="btn btn-outline-secondary btn-sm"
          aria-expanded={versionsOpen===entry.comment.id}
          onClick={()=>void readVersions(entry.comment.id)}>{commentsText("versions")}</button>
        </div>}
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
            disabled={editSaving} onClick={()=>{setEditingId(null);setActionError(null);}}>
            {commentsText("cancel")}
           </button>
           <button type="button" className="btn btn-primary btn-sm"
            disabled={editSaving||!editingText.trim()||editingText.trim()===entry.comment.text}
            onClick={()=>void edit(entry.comment)}>{editSaving?commentsText("saving"):commentsText("save")}</button>
          </div>
         </div>}
        {canManage&&versionsOpen===entry.comment.id&&
         <div className="smn-registry-journal-versions" aria-label={commentsText("versions")}>
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
     </li>)}
    </ol>}
    {canManage&&data?.legacy&&<aside className="smn-registry-journal-legacy">
     <h3 className="h6">{commentsText("legacy")}</h3>
     <p className="smn-registry-journal-content mb-1">{data.legacy.text}</p>
     <p className="small text-body-secondary mb-0">{commentsText("legacyUndated")}</p>
    </aside>}
   </>}
 </section>;
}
