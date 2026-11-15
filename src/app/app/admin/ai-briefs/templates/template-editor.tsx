"use client";

import {useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {validatePromptModelDraft,type PromptModelDraft,PROMPT_TEXT_LIMIT} from "@/lib/ai-brief-prompt-model";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";

const empty:PromptModelDraft={title:"",description:"",promptText:""};
type Feedback={type:"success"|"error";message:string};
function fromTemplate(template:ManagedBriefTemplate):PromptModelDraft{
 return {title:template.title,description:template.description,promptText:template.promptText??""};
}
function equals(a:PromptModelDraft,b:PromptModelDraft):boolean{
 return a.title===b.title&&a.description===b.description&&a.promptText===b.promptText;
}
export default function TemplateEditor({original}:{original:ManagedBriefTemplate[]}){
 const t=useTranslation();
 const tr=(key:string)=>t(("briefPromptEditor."+key) as Parameters<typeof t>[0]);
 const [templates,setTemplates]=useState(original);
 const [selected,setSelected]=useState("new");
 const [draft,setDraft]=useState<PromptModelDraft>(empty);
 const [baseline,setBaseline]=useState<PromptModelDraft>(empty);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState<Feedback|null>(null);
 const [preview,setPreview]=useState(false);
 const [copied,setCopied]=useState(false);
 const current=templates.find(x=>x.id===selected);
 const legacy=!!current&&!current.builtin&&!current.promptText;
 const locked=!!current?.builtin||legacy;
 const dirty=!equals(draft,baseline);
 useUnsavedChanges(dirty||busy,tr("leave"));
 function switchTo(id:string,force=false,collection=templates){
  if(!force&&dirty&&!window.confirm(tr("leave")))return;
  const chosen=collection.find(x=>x.id===id);
  const next=chosen?fromTemplate(chosen):empty;
  setSelected(id);setDraft({...next});setBaseline({...next});
  setFeedback(null);setCopied(false);setPreview(false);
 }
 function duplicate(){
  if(!current)return;
  if(dirty&&!window.confirm(tr("leave")))return;
  const next={...fromTemplate(current),title:t("briefPromptEditor.newCopy",{name:current.title})};
  setSelected("new");setBaseline({...empty});setDraft(next);
  setFeedback(null);setPreview(false);
  document.getElementById("brief-template-name")?.focus();
 }
 async function reload(pick=selected){
  const response=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
  if(!response.ok)throw Error("reload");
  const json=await response.json() as {templates?:ManagedBriefTemplate[]};
  if(!Array.isArray(json.templates))throw Error("reload");
  setTemplates(json.templates);
  switchTo(pick,true,json.templates);
 }
 async function mutate(action:"create"|"update"|"activate"|"deactivate"){
  if(busy)return;
  if(action==="deactivate"&&!window.confirm(tr("confirmDisable")))return;
  if((action==="activate"||action==="deactivate")&&dirty&&!window.confirm(tr("leave")))return;
  if((action==="create"||action==="update")&&!validatePromptModelDraft(draft)){
   setFeedback({type:"error",message:tr("invalid")});return;
  }
  setBusy(true);setFeedback(null);
  try{
   const payload=action==="create"?{action,template:draft}:
    {action,id:current?.id,revision:current?.revision,...(action==="update"?{template:draft}:{})};
   const response=await fetch("/api/admin/ai-briefs/templates",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
   });
   const result=await response.json() as {ok?:boolean;id?:string;error?:string};
   if(!response.ok||!result.ok){
    const message=result.error==="conflict"?tr("conflict"):
     result.error==="schema-upgrade-required"?tr("schema"):
     result.error==="invalid-input"?tr("invalid"):tr("error");
    setFeedback({type:"error",message});return;
   }
   await reload(result.id??"new");
   setFeedback({type:"success",message:tr(action==="create"?"saved":action==="update"?"updated":action==="activate"?"activated":"deactivated")});
  }catch{setFeedback({type:"error",message:tr("error")});}
  finally{setBusy(false);}
 }
 async function copy(){
  try{await navigator.clipboard.writeText(draft.promptText);setCopied(true);}
  catch{setFeedback({type:"error",message:tr("copyFailed")});}
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(locked)return;
  void mutate(current?"update":"create");
 }
 return <div className="smn-brief-template-workspace d-grid gap-4">
  <section className="smn-panel rounded-4 p-3 p-lg-4" aria-labelledby="brief-template-library">
   <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
    <h2 className="h5 mb-0" id="brief-template-library">{tr("list")}</h2>
    <div className="d-flex gap-2">
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy}
      onClick={()=>{if(dirty&&!window.confirm(tr("leave")))return;void reload().catch(()=>setFeedback({type:"error",message:tr("error")}));}}>{tr("reload")}</button>
     <button type="button" className="btn btn-primary btn-sm" disabled={busy}
      onClick={()=>switchTo("new")}>{tr("new")}</button>
    </div>
   </div>
   <div className="table-responsive">
    <table className="table table-hover align-middle mb-0">
     <thead><tr><th scope="col">{tr("modelName")}</th><th scope="col">{tr("description")}</th><th scope="col">{tr("status")}</th><th scope="col"><span className="visually-hidden">{tr("selectModel")}</span></th></tr></thead>
     <tbody>{templates.map(model=><tr key={model.id} className={selected===model.id?"smn-brief-selected":""}>
      <th scope="row"><span className="d-block">{model.title}</span><span className="small text-secondary">{tr(model.builtin?"native":"custom")}</span></th>
      <td className="text-secondary small">{model.description||"—"}</td>
      <td><span className={"badge "+(model.active?"text-bg-light":"text-bg-secondary")}>{tr(model.active?"active":"inactive")}</span></td>
      <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary" disabled={busy}
       aria-current={selected===model.id?"true":undefined} onClick={()=>switchTo(model.id)}>{tr("select")}</button></td>
     </tr>)}</tbody>
    </table>
   </div>
  </section>
  <form className="smn-panel rounded-4 p-3 p-lg-4 d-grid gap-3" onSubmit={submit} aria-labelledby="brief-editor-heading">
   <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
    <div><h2 className="h5 mb-1" id="brief-editor-heading">{tr("editor")}</h2>
     <p className="text-secondary small mb-0">{tr("descriptionPanel")}</p></div>
    <div className="d-flex gap-2 flex-wrap">
     {current&&<button type="button" className="btn btn-outline-secondary" disabled={busy||legacy}
      onClick={duplicate}>{tr("duplicate")}</button>}
     {!locked&&<button type="submit" className="btn btn-primary" disabled={busy||!dirty||!validatePromptModelDraft(draft)}>
      {busy?tr("saving"):current?tr("save"):tr("create")}</button>}
    </div>
   </div>
   {current?.builtin&&<p role="status" className="alert alert-info mb-0">{tr("protected")}</p>}
   {legacy&&<p role="alert" className="alert alert-warning mb-0">{tr("legacy")}</p>}
   {dirty&&<p role="status" className="alert alert-warning mb-0">{tr("pending")}</p>}
   <div className="row g-3">
    <div className="col-12 col-lg-6"><label className="form-label" htmlFor="brief-template-name">{tr("modelName")}</label>
     <input id="brief-template-name" className="form-control" required maxLength={120} value={draft.title}
      disabled={busy||locked} onChange={e=>{setDraft(x=>({...x,title:e.target.value}));setCopied(false);}}/></div>
    <div className="col-12 col-lg-6"><label className="form-label" htmlFor="brief-template-description">{tr("description")}</label>
     <input id="brief-template-description" className="form-control" maxLength={500} value={draft.description}
      disabled={busy||locked} onChange={e=>setDraft(x=>({...x,description:e.target.value}))}/>
     <p className="form-text">{tr("descriptionHint")}</p></div>
   </div>
   <div className="d-flex justify-content-between flex-wrap align-items-end gap-2">
    <label className="form-label mb-0" htmlFor="brief-template-prompt">{tr("prompt")}</label>
    <div className="d-flex gap-2">
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!draft.promptText}
      onClick={()=>setPreview(x=>!x)} aria-expanded={preview} aria-controls="brief-template-preview">{tr("preview")}</button>
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!draft.promptText}
      onClick={()=>void copy()}>{tr("copy")}</button>
    </div>
   </div>
   <textarea id="brief-template-prompt" className="form-control smn-brief-prompt-editor" rows={17}
    maxLength={PROMPT_TEXT_LIMIT} required value={draft.promptText} disabled={busy||locked}
    spellCheck aria-describedby="brief-template-prompt-hint"
    placeholder={tr("placeholder")} onChange={e=>{setDraft(x=>({...x,promptText:e.target.value}));setCopied(false);}}/>
   <div className="d-flex flex-wrap justify-content-between gap-2">
    <p id="brief-template-prompt-hint" className="form-text mb-0">{tr("promptHint")}</p>
    <span className="small text-secondary" aria-live="off">{t("briefPromptEditor.chars",{count:draft.promptText.length})}</span>
   </div>
   {preview&&<section id="brief-template-preview" className="smn-brief-source-preview" aria-label={tr("preview")}>
    <p className="text-secondary small mb-2">{tr("sourceOnly")}</p>
    <pre className="mb-0">{draft.promptText}</pre>
   </section>}
   <p className="small text-secondary mb-0">{tr("privacy")}</p>
   <div className="d-flex gap-2 flex-wrap align-items-center">
    {!locked&&<button type="submit" className="btn btn-primary" disabled={busy||!dirty||!validatePromptModelDraft(draft)}>
     {busy?tr("saving"):current?tr("save"):tr("create")}</button>}
    {current&&!current.builtin&&!legacy&&<button type="button" className="btn btn-outline-secondary" disabled={busy||dirty}
     onClick={()=>void mutate(current.active?"deactivate":"activate")}>{tr(current.active?"disable":"enable")}</button>}
    {dirty&&<button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>{
     if(!window.confirm(tr("leave")))return;
     setDraft({...baseline});setFeedback(null);
    }}>{tr("discard")}</button>}
   </div>
   {copied&&<p role="status" className="alert alert-success mb-0">{tr("copied")}</p>}
   {feedback&&<p role={feedback.type==="error"?"alert":"status"}
    className={"alert mb-0 "+(feedback.type==="error"?"alert-danger":"alert-success")}>{feedback.message}</p>}
  </form>
 </div>;
}
