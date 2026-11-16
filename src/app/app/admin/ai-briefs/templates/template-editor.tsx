"use client";
import {useRef,useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import OfficeTagConfigurator from "../../../reports/office-tag-configurator";
import {insertPromptTag} from "@/lib/ai-brief-tag-insertion";
import {useLocale} from "@/i18n/client";
import {aiBriefText,type AiBriefKey} from "@/lib/ai-brief-messages";

type Draft={title:string;description:string;promptText:string};
const blank=():Draft=>({title:"",description:"",promptText:""});
const from=(t:ManagedBriefTemplate):Draft=>({title:t.title,description:t.description,promptText:t.promptText});
export default function TemplateEditor({original}:{original:ManagedBriefTemplate[]}){
 const [templates,setTemplates]=useState(original);
 const [selected,setSelected]=useState("new");
 const current=templates.find(t=>t.id===selected);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const locale=useLocale();
 const t=(key:AiBriefKey)=>aiBriefText(locale,key);
 const textarea=useRef<HTMLTextAreaElement>(null);
 const cursor=useRef({start:0,end:0});
 const baseline=current?from(current):blank();
 const dirty=JSON.stringify(draft)!==JSON.stringify(baseline);
 function choose(id:string,force=false){
  if(!force&&dirty&&!window.confirm(t("discard")))return;
  const found=templates.find(t=>t.id===id);
  setSelected(id);
  setDraft(found?from(found):blank());
  setMessage("");
  cursor.current={start:0,end:0};
 }
 function duplicate(){
  if(!current)return;
  const copy={...draft,title:draft.title+t("duplicateSuffix")};
  setSelected("new");setDraft(copy);setMessage(t("duplicateNotice"));
 }
 function insert(tag:string){
  const {start,end}=cursor.current;
  const result=insertPromptTag(draft.promptText,tag,start,end);
  setDraft(old=>({...old,promptText:result.text}));
  const next=result.cursor;
  cursor.current={start:next,end:next};
  requestAnimationFrame(()=>{textarea.current?.focus();textarea.current?.setSelectionRange(next,next);});
 }
 async function send(action:"create"|"update"|"activate"|"deactivate"){
  if((action==="create"||action==="update")&&(!draft.title.trim()||!draft.promptText.trim())){
   setMessage(t("required"));return;
  }
  if(action==="deactivate"&&!window.confirm(t("deactivateConfirm")))return;
  setBusy(true);setMessage("");
  try{
   const body=action==="create"?{action,template:draft}:{action,id:current?.id,revision:current?.revision,...(action==="update"?{template:draft}:{})};
   const response=await fetch("/api/admin/ai-briefs/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json() as {error?:string;id?:string;revision?:number};
   if(!response.ok||result.error)throw Error(result.error==="migration-required"?t("migrationRequired"):result.error??t("saveFailed"));
   const loaded=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
   if(!loaded.ok)throw Error(t("refreshFailed"));
   const json=await loaded.json() as {templates:ManagedBriefTemplate[]};
   setTemplates(json.templates);
   const id=action==="create"?result.id:current?.id;
   const latest=json.templates.find(t=>t.id===id);
   setSelected(latest?.id??"new");setDraft(latest?from(latest):blank());
   setMessage(t("saved"));
  }catch(e){setMessage(e instanceof Error?e.message:"Enregistrement impossible.");}
  finally{setBusy(false);}
 }
 return <div className="d-grid gap-3">
  <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between">
   <label className="form-label flex-grow-1 mb-0" htmlFor="brief-template-choice">{t("template")}
    <select className="form-select mt-1" id="brief-template-choice" value={selected} onChange={e=>choose(e.target.value)}>
     <option value="new">{t("newTemplate")}</option>
     {templates.map(t=><option key={t.id} value={t.id}>{t.title}{t.builtin?aiBriefText(locale,"nativeSuffix"):""}{t.active?"":aiBriefText(locale,"inactiveSuffix")}</option>)}
    </select>
   </label>
   <div className="d-flex gap-2">
    {current&&<button className="btn btn-outline-primary" type="button" onClick={duplicate} disabled={busy}>{t("duplicate")}</button>}
    <button className="btn btn-outline-secondary" type="button" onClick={()=>choose("new")} disabled={busy}>{t("new")}</button>
   </div>
  </div>
  {current?.builtin&&<p className="alert alert-info mb-0" role="status">{t("nativeProtected")}</p>}
  <fieldset disabled={busy||Boolean(current?.builtin)} className="d-grid gap-3">
   <label className="form-label" htmlFor="brief-name">{t("title")}
    <input id="brief-name" className="form-control mt-1" maxLength={120} value={draft.title} onChange={e=>setDraft(x=>({...x,title:e.target.value}))}/>
   </label>
   <label className="form-label" htmlFor="brief-description">{t("description")}
    <input id="brief-description" className="form-control mt-1" maxLength={500} value={draft.description} onChange={e=>setDraft(x=>({...x,description:e.target.value}))}/>
   </label>
   <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
    <strong>{t("freePrompt")}</strong>
    <div className="d-flex gap-2 align-items-center">
     
     {!current?.builtin&&<OfficeTagConfigurator locale={locale} teamId={null} onInsert={insert}/> }
    </div>
   </div>
   <label className="form-label" htmlFor="brief-prompt">{t("prompt")}
    <textarea ref={textarea} id="brief-prompt" rows={20} maxLength={100000}
     className="form-control font-monospace mt-1" style={{minHeight:380,resize:"vertical"}} value={draft.promptText}
     onSelect={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onClick={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onChange={e=>{setDraft(x=>({...x,promptText:e.target.value}));cursor.current={start:e.target.selectionStart,end:e.target.selectionEnd};}}/>
   </label>
   <p className="small text-secondary">{t("insertHelp")}</p>
  </fieldset>
  <div className="d-flex gap-2 flex-wrap">
   {!current&&<button type="button" className="btn btn-primary" disabled={busy||!draft.title.trim()||!draft.promptText.trim()} onClick={()=>void send("create")}>{t("create")}</button>}
   {current&&!current.builtin&&<>
    <button type="button" className="btn btn-primary" disabled={busy||!dirty||!draft.title.trim()||!draft.promptText.trim()} onClick={()=>void send("update")}>{t("save")}</button>
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>void send(current.active?"deactivate":"activate")}>{current.active?t("deactivate"):t("reactivate")}</button>
   </>}
  </div>
  {dirty&&<p className="small text-warning-emphasis mb-0" role="status">{t("dirty")}</p>}
  {message&&<p role="status" className="mb-0">{message}</p>}
 </div>;
}
