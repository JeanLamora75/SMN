"use client";
import {useRef,useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import type {BriefMode} from "@/lib/ai-brief-templates";
import type {BriefFact} from "@/server/ai-briefs/facts";
import {resolveBriefPrompt} from "@/lib/ai-brief-tag-resolver";
import {canApproveBrief} from "@/lib/ai-brief-review";
import OfficeTagConfigurator from "../../../reports/office-tag-configurator";
import {insertPromptTag} from "@/lib/ai-brief-tag-insertion";
import {useLocale} from "@/i18n/client";
import {aiBriefText,type AiBriefKey} from "@/lib/ai-brief-messages";
import {localizedNativeBrief} from "@/lib/ai-brief-native-locales";
import {useTranslation} from "@/i18n/client";
import BriefAiSendPanel from "./brief-ai-send-panel";

type Historic={id:string;type:"human"|"ai";origin:string;createdAt:string;content:string;cycleId:string};
type Cycle={id:string;teamId:string;name:string;team:string;product:string|null;status:string;startAt:string;endAt:string;timeZone:string};
const sanitize=(text:string)=>text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");
export default function BriefOverrides({template,mode,context,facts,preparedAt,historical,indicators}:{
 template:ManagedBriefTemplate;mode:BriefMode;context:Cycle;facts:Record<string,BriefFact>;preparedAt:string;historical:Historic[];
 indicators:readonly {tag:string;value:string|null;unit:string;source:string;available:boolean;reason:string|null}[];
}){
 const locale=useLocale();
 const ui=useTranslation();
 const t=(key:AiBriefKey)=>aiBriefText(locale,key);
 const [base,setBase]=useState(template);
 const [prompt,setPrompt]=useState(template.promptText);
 const [observations,setObservations]=useState("");
 const [selectedHistory,setSelectedHistory]=useState<string[]>([]);
 const [activeView,setActiveView]=useState<"edit"|"preview">("edit");
 const [preview,setPreview]=useState<string|null>(null);
 const [reviewedText,setReviewedText]=useState<string|null>(null);
 const [privacyReviewed,setPrivacyReviewed]=useState(false);
 const [revisionChecked,setRevisionChecked]=useState(false);
 const [conflict,setConflict]=useState(false);
 const [saving,setSaving]=useState(false);
 const [finalizedId,setFinalizedId]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const input=useRef<HTMLTextAreaElement>(null);
 const cursor=useRef({start:0,end:0});
 const resolved=resolveBriefPrompt({promptText:prompt,mode,context,facts,preparedAt,indicators,locale});
 const chosen=historical.filter(x=>selectedHistory.includes(x.type+":"+x.id));
 const historyText=chosen.length?"\n"+t("historyIncluded")+"\n"+chosen.map(x=>
  "- "+x.type+" | "+x.createdAt+" | "+x.origin+" | cycle "+x.cycleId+"\n"+sanitize(x.content)).join("\n"):"";
 const observationsText=observations.trim()?"\n"+t("notesIncluded")+"\n"+sanitize(observations.trim()):"";
 const currentTxt=[
  t("txtHeader"),
  t("team")+" : "+context.team,t("product")+" : "+(context.product??t("unknown")),
  "Mode : "+mode,t("cycle")+" : "+context.name,"Identifiant du cycle : "+context.id,
  t("dates")+" : "+context.startAt+" — "+context.endAt+" ("+context.timeZone+")",
  t("status")+" : "+context.status,t("preparedAt")+" : "+preparedAt,
  t("templateName")+" : "+base.title+" ("+t("revision")+" "+base.revision+")",
  context.status==="closed"?"":t("contextWarning"),
  "",resolved.text,observationsText,historyText,
  t("manualTxt")
 ].filter(x=>x!==null).join("\n").replace(/\n{3,}/g,"\n\n").trimEnd()+"\n";
 const txtBytes=new TextEncoder().encode(currentTxt).length;
 const sizeAllowed=txtBytes>0&&txtBytes<=200000;
 const approved=resolved.safe&&sizeAllowed&&canApproveBrief({preview,currentTxt,reviewedText,privacyReviewed,revisionChecked,conflict});
 function invalidate(){setPreview(null);setPrivacyReviewed(false);setReviewedText(null);setRevisionChecked(false);setFinalizedId(null);}
 async function latest(){
  const result=await fetch("/api/admin/ai-briefs/templates",{cache:"no-store"});
  if(!result.ok)throw Error(t("catalogError"));
  const json=await result.json() as {templates:ManagedBriefTemplate[]};
  return json.templates.find(x=>x.id===base.id);
 }
 async function checkRevision(){
  try{
   const last=await latest();
   if(!last||!last.active||last.revision!==base.revision){
    setConflict(true);setRevisionChecked(false);setPrivacyReviewed(false);setReviewedText(null);
    setMessage(t("changed"));
    return false;
   }
   setRevisionChecked(true);
   return true;
  }catch{
   setRevisionChecked(false);setPrivacyReviewed(false);setReviewedText(null);
   setMessage(t("revisionError"));
   return false;
  }
 }
 async function loadLatest(){
  try{
   const last=await latest();
   if(!last||!last.active)throw Error(t("unavailable"));
   const shown=localizedNativeBrief(last,locale);
   setBase(shown);setPrompt(shown.promptText);setObservations("");setSelectedHistory([]);
   invalidate();setConflict(false);setActiveView("edit");setMessage(t("reloaded"));
  }catch(e){setMessage(e instanceof Error?e.message:"Rechargement impossible.");}
 }
 async function generatePreview(){
  if(!await checkRevision())return;
  setPreview(currentTxt);setPrivacyReviewed(false);setReviewedText(null);setActiveView("preview");
  setMessage(resolved.safe?t("previewReady"):t("previewInvalid"));
 }
 async function finalize(){
  if(!approved||preview===null||finalizedId!==null)return;
  setSaving(true);
  try{
   if(!await checkRevision()||!resolved.safe||preview!==currentTxt||reviewedText!==preview||!privacyReviewed)
    throw Error(t("reviewStale"));
   const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(preview));
   const approvedSha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
   const res=await fetch("/api/admin/ai-briefs/finalize",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,cycleId:context.id,templateId:base.id,templateRevision:base.revision,txt:preview,approvedSha256,reviewConfirmed:true})});
   const data=await res.json() as {ok?:boolean;id?:string;error?:string};
   if(!res.ok||!data.ok||!data.id)throw Error(data.error??t("archiveUnconfirmed"));
   setFinalizedId(data.id);setMessage(t("archived")+data.id);
  }catch(e){setMessage(e instanceof Error?e.message:t("archiveFailed"));}
  finally{setSaving(false);}
 }
 function insertTag(tag:string){
  const {start,end}=cursor.current;
  const result=insertPromptTag(prompt,tag,start,end);
  setPrompt(result.text);
  const n=result.cursor;cursor.current={start:n,end:n};invalidate();
  requestAnimationFrame(()=>{input.current?.focus();input.current?.setSelectionRange(n,n);});
 }
 return <section className="border rounded-3 p-3 mt-3" aria-label="Préparation du prompt IA">
  <h3 className="h5">{t("prepareEditor")}</h3>
  <p className="small text-secondary">{t("templateName")} {base.title} · {t("revision")} {base.revision}. {t("localChanges")}</p>
  {conflict&&<p role="alert" className="alert alert-warning">{t("changed")}</p>}
  <div className="btn-group d-lg-none mb-3" role="group" aria-label="Mode de travail">
   <button type="button" className={"btn btn-sm "+(activeView==="edit"?"btn-primary":"btn-outline-primary")} onClick={()=>setActiveView("edit")} aria-pressed={activeView==="edit"}>{t("edit")}</button>
   <button type="button" className={"btn btn-sm "+(activeView==="preview"?"btn-primary":"btn-outline-primary")} onClick={()=>setActiveView("preview")} aria-pressed={activeView==="preview"}>{t("preview")}</button>
  </div>
  <div className="row g-3">
   <div className={"col-12 col-lg-6 "+(activeView==="preview"?"d-none d-lg-block":"")}>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
     <label htmlFor="brief-prompt" className="form-label fw-semibold mb-0">{t("promptLabel")}</label>
     <OfficeTagConfigurator locale={locale} teamId={context.teamId} onInsert={insertTag}/>
    </div>
    <textarea ref={input} id="brief-prompt" rows={20} maxLength={100000} className="form-control font-monospace"
     value={prompt} disabled={conflict||saving}
     onSelect={e=>{cursor.current={start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd};}}
     onChange={e=>{setPrompt(e.target.value);cursor.current={start:e.target.selectionStart,end:e.target.selectionEnd};invalidate();}}/>
    <label htmlFor="brief-observations" className="form-label fw-semibold mt-3">{t("notes")}</label>
    <textarea id="brief-observations" className="form-control" rows={3} maxLength={12000} value={observations}
     disabled={conflict||saving} onChange={e=>{setObservations(e.target.value);invalidate();}}/>
    <details className="border rounded-3 p-3 mt-3">
     <summary className="fw-semibold">{t("historical")}</summary>
     <p className="small text-secondary mt-2">{t("historicalHelp")}</p>
     {historical.map(x=><label className="d-block small my-2" key={x.type+":"+x.id}>
      <input className="form-check-input me-2" type="checkbox" disabled={conflict||saving}
       checked={selectedHistory.includes(x.type+":"+x.id)}
       onChange={e=>{const k=x.type+":"+x.id;setSelectedHistory(old=>e.target.checked?[...old,k]:old.filter(v=>v!==k));invalidate();}}/>
      {x.type==="ai"?t("aiResponse"):t("humanAnalysis")} · {x.createdAt} · {x.origin} · {x.content.slice(0,100)}
     </label>)}
     {historical.length===0&&<p className="small text-secondary">{t("noHistory")}</p>}
    </details>
   </div>
   <div className={"col-12 col-lg-6 "+(activeView==="edit"?"d-none d-lg-block":"")}>
    <label htmlFor="brief-txt-preview" className="form-label fw-semibold">{t("txtPreview")}</label>
    <textarea id="brief-txt-preview" className="form-control font-monospace" rows={20} readOnly value={preview??""} placeholder={t("previewPlaceholder")}/>
    {!sizeAllowed&&<p className="alert alert-warning mt-3" role="alert">{t("tooLarge")}</p>}
    {resolved.diagnostics.length>0&&<div className="alert alert-warning mt-3" role="alert">
     <strong>{t("diagnostics")}</strong>
     <ul className="mb-0">{resolved.diagnostics.map((x,i)=><li key={i}><code>{x.tag}</code> : {x.reason}</li>)}</ul>
    </div>}
    {preview!==null&&<div className="border rounded p-3 mt-3">
     <label className="form-check-label" htmlFor="brief-privacy-reviewed">
      <input id="brief-privacy-reviewed" className="form-check-input me-2" type="checkbox"
       disabled={saving||conflict||!revisionChecked||!resolved.safe||!sizeAllowed||preview!==currentTxt}
       checked={approved} onChange={e=>{setPrivacyReviewed(e.target.checked);setReviewedText(e.target.checked?preview:null);}}/>
      {t("privacyConfirm")}
     </label>
    </div>}
   </div>
  </div>
  <div className="d-flex flex-wrap gap-2 mt-3">
   <button type="button" className="btn btn-primary" disabled={saving||conflict||!prompt.trim()} onClick={()=>void generatePreview()}>{t("generate")}</button>
   <button type="button" className="btn btn-outline-secondary" disabled={saving} onClick={()=>void loadLatest()}>{t("reload")}</button>
   <button type="button" className="btn btn-outline-primary" disabled={saving||!approved} onClick={async()=>{
    if(!approved||!await checkRevision()||!preview||preview!==currentTxt)return;
    try{await navigator.clipboard.writeText(preview);setMessage(t("copyDone"));}
    catch{setMessage(t("copyFailed"));}
   }}>{t("copy")}</button>
   <button type="button" className="btn btn-primary" disabled={saving||!approved||finalizedId!==null} onClick={()=>void finalize()}>{t("finalize")}</button>
  </div>
  <p className="alert alert-info mt-3 mb-2"><strong>{t("manualOnly")}</strong> {t("manualHelp")}</p>
  {!finalizedId&&<p className="small text-secondary mt-3">{ui("aiSend.finalizeFirst")}</p>}
  {finalizedId&&preview&&<BriefAiSendPanel key={finalizedId}
   archiveId={finalizedId} reviewedText={preview} cycleName={context.name} teamName={context.team}/> }
  {finalizedId&&<p role="status" className="alert alert-success">{t("archived")}{finalizedId}</p>}
  {message&&<p role="status" className="small mb-0">{message}</p>}
 </section>;
}
