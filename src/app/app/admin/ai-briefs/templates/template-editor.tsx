"use client";
import {useRef,useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import OfficeTagConfigurator from "../../../reports/office-tag-configurator";

type Draft={title:string;description:string;promptText:string};
const blank=():Draft=>({title:"",description:"",promptText:""});
const from=(t:ManagedBriefTemplate):Draft=>({title:t.title,description:t.description,promptText:t.promptText});
export default function TemplateEditor({original}:{original:ManagedBriefTemplate[]}){
 const [templates,setTemplates]=useState(original);
 const [selected,setSelected]=useState("new");
 const current=templates.find(t=>t.id===selected);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [locale,setLocale]=useState<"fr"|"en">("fr");
 const textarea=useRef<HTMLTextAreaElement>(null);
 const cursor=useRef({start:0,end:0});
 const baseline=current?from(current):blank();
 const dirty=JSON.stringify(draft)!==JSON.stringify(baseline);
 function choose(id:string,force=false){
  if(!force&&dirty&&!window.confirm("Abandonner les modifications non enregistrées ?"))return;
  const found=templates.find(t=>t.id===id);
  setSelected(id);
  setDraft(found?from(found):blank());
  setMessage("");
  cursor.current={start:0,end:0};
 }
 function duplicate(){
  if(!current)return;
  const copy={...draft,title:draft.title+" — copie"};
  setSelected("new");setDraft(copy);setMessage("Copie locale : enregistrez pour créer un nouveau modèle.");
 }
 function insert(tag:string){
  const {start,end}=cursor.current;
  const left=draft.promptText.slice(0,start);
  const right=draft.promptText.slice(end);
  setDraft(old=>({...old,promptText:left+tag+right}));
  const next=start+tag.length;
  cursor.current={start:next,end:next};
  requestAnimationFrame(()=>{textarea.current?.focus();textarea.current?.setSelectionRange(next,next);});
 }
 async function send(action:"create"|"update"|"activate"|"deactivate"){
  if((action==="create"||action==="update")&&(!draft.title.trim()||!draft.promptText.trim())){
   setMessage("Le nom et le prompt sont obligatoires.");return;
  }
  if(action==="deactivate"&&!window.confirm("Désactiver ce modèle ? Les archives restent accessibles."))return;
  setBusy(true);setMessage("");
  try{
   const body=action==="create"?{action,template:draft}:{action,id:current?.id,revision:current?.revision,...(action==="update"?{template:draft}:{})};
   const response=await fetch("/api/admin/ai-briefs/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json() as {error?:string;id?:string;revision?:number};
   if(!response.ok||result.error)throw Error(result.error==="migration-required"?"Migration SMN-472 requise avant tout enregistrement.":result.error??"Enregistrement impossible.");
   const loaded=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
   if(!loaded.ok)throw Error("Enregistré, mais actualisation impossible.");
   const json=await loaded.json() as {templates:ManagedBriefTemplate[]};
   setTemplates(json.templates);
   const id=action==="create"?result.id:current?.id;
   const latest=json.templates.find(t=>t.id===id);
   setSelected(latest?.id??"new");setDraft(latest?from(latest):blank());
   setMessage("Modèle enregistré. Les archives historiques restent inchangées.");
  }catch(e){setMessage(e instanceof Error?e.message:"Enregistrement impossible.");}
  finally{setBusy(false);}
 }
 return <div className="d-grid gap-3">
  <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between">
   <label className="form-label flex-grow-1 mb-0" htmlFor="brief-template-choice">Modèle
    <select className="form-select mt-1" id="brief-template-choice" value={selected} onChange={e=>choose(e.target.value)}>
     <option value="new">+ Nouveau modèle</option>
     {templates.map(t=><option key={t.id} value={t.id}>{t.title}{t.builtin?" · natif":""}{t.active?"":" · désactivé"}</option>)}
    </select>
   </label>
   <div className="d-flex gap-2">
    {current&&<button className="btn btn-outline-primary" type="button" onClick={duplicate} disabled={busy}>Dupliquer</button>}
    <button className="btn btn-outline-secondary" type="button" onClick={()=>choose("new")} disabled={busy}>Nouveau modèle</button>
   </div>
  </div>
  {current?.builtin&&<p className="alert alert-info mb-0" role="status">Modèle natif protégé : utilisez « Dupliquer » pour le personnaliser.</p>}
  <fieldset disabled={busy||Boolean(current?.builtin)} className="d-grid gap-3">
   <label className="form-label" htmlFor="brief-name">Nom du modèle *
    <input id="brief-name" className="form-control mt-1" maxLength={120} value={draft.title} onChange={e=>setDraft(x=>({...x,title:e.target.value}))}/>
   </label>
   <label className="form-label" htmlFor="brief-description">Description facultative
    <input id="brief-description" className="form-control mt-1" maxLength={500} value={draft.description} onChange={e=>setDraft(x=>({...x,description:e.target.value}))}/>
   </label>
   <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
    <strong>Prompt libre</strong>
    <div className="d-flex gap-2 align-items-center">
     <label htmlFor="brief-lang">Catalogue</label>
     <select id="brief-lang" className="form-select form-select-sm w-auto" value={locale} onChange={e=>setLocale(e.target.value as "fr"|"en")}>
      <option value="fr">Français</option><option value="en">English</option>
     </select>
     <OfficeTagConfigurator locale={locale} teamId={null} onInsert={insert}/>
    </div>
   </div>
   <label className="form-label" htmlFor="brief-prompt">Texte du prompt *
    <textarea ref={textarea} id="brief-prompt" rows={20} maxLength={100000}
     className="form-control font-monospace mt-1" style={{minHeight:380,resize:"vertical"}} value={draft.promptText}
     onSelect={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onClick={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onChange={e=>{setDraft(x=>({...x,promptText:e.target.value}));cursor.current={start:e.target.selectionStart,end:e.target.selectionEnd};}}/>
   </label>
   <p className="small text-secondary">Les tags sont insérés au curseur ; les graphiques et données personnelles ne peuvent pas être insérés dans un prompt transmissible à une IA.</p>
  </fieldset>
  <div className="d-flex gap-2 flex-wrap">
   {!current&&<button type="button" className="btn btn-primary" disabled={busy||!draft.title.trim()||!draft.promptText.trim()} onClick={()=>void send("create")}>Créer le modèle</button>}
   {current&&!current.builtin&&<>
    <button type="button" className="btn btn-primary" disabled={busy||!dirty||!draft.title.trim()||!draft.promptText.trim()} onClick={()=>void send("update")}>Enregistrer</button>
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>void send(current.active?"deactivate":"activate")}>{current.active?"Désactiver":"Réactiver"}</button>
   </>}
  </div>
  {dirty&&<p className="small text-warning-emphasis mb-0" role="status">Modifications non enregistrées.</p>}
  {message&&<p role="status" className="mb-0">{message}</p>}
 </div>;
}
