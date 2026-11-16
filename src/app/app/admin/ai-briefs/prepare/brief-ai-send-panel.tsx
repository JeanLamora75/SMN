"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState,type MouseEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Provider="gemini"|"groq"|"openrouter";
type Connection={id:string;label:string;providerId:Provider;modelId:string|null;
 enabled:boolean;credentialState:string;lastTestStatus:string};
type Candidate={providerId:Provider;modelId:string};
type Preview={ok:true;preview:string;sha256:string;approval:string;expiresAt:string;
 archiveId:string;connectionId:string;provider:Provider;model:string;cycleId:string;mode:string};
type ApiFailure={ok?:false;error:string};
type Answer={ok:true;response:string;provider:Provider;model:string;archiveId:string;stored:false};
const sameDestination=(c:Connection,p:Preview|null)=>Boolean(p&&
 p.connectionId===c.id&&p.provider===c.providerId&&p.model===c.modelId);
const friendlyKey=(code:string)=>{
 if(code==="approval-expired-or-reused")return "aiSend.expired" as const;
 if(code==="local-quota-exhausted"||code==="provider-rate-limit")return "aiSend.quota" as const;
 if(code==="authentication-failed"||code==="credential-unavailable")return "aiSend.auth" as const;
 if(code==="model-unverified"||code==="model-expired"||code==="model-routing-untrusted"||
    code==="model-ambiguous")return "aiSend.noFree" as const;
 if(code==="provider-network-or-response-error"||code==="provider-unavailable")return "aiSend.network" as const;
 if(code==="connection-unavailable")return "aiSend.notReady" as const;
 if(code==="integrity-error")return "aiSend.integrity" as const;
 return "aiSend.failure" as const;
};

/** Deliberately volatile response and consent. Never localStorage/sessionStorage. */
export default function BriefAiSendPanel({archiveId,reviewedText,cycleName,teamName}:{
 archiveId:string;reviewedText:string;cycleName:string;teamName:string;
}){
 const t=useTranslation();
 const [connections,setConnections]=useState<Connection[]>([]);
 const [free,setFree]=useState<Candidate[]>([]);
 const [selected,setSelected]=useState("");
 const [loading,setLoading]=useState(true);
 const [phase,setPhase]=useState<"idle"|"previewing"|"sending">("idle");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [consent,setConsent]=useState(false);
 const [answer,setAnswer]=useState<Answer|null>(null);
 const [responseKey,setResponseKey]=useState<string|null>(null);
 const [savedId,setSavedId]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const [feedback,setFeedback]=useState("");
 const busy=useRef(false);
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const [a,b]=await Promise.all([
    fetch("/api/admin/ai-connections",{cache:"no-store"}),
    fetch("/api/admin/ai-connections/free-models",{cache:"no-store"})
   ]);
   if(!a.ok||!b.ok)throw Error("unavailable");
   const rows=await a.json() as {connections?:Connection[]};
   const catalog=await b.json() as {qualified?:Candidate[]};
   if(!Array.isArray(rows.connections)||!Array.isArray(catalog.qualified))
    throw Error("invalid");
   setConnections(rows.connections);
   setFree(catalog.qualified);
  }catch{setFeedback(t("aiSend.loadError"));}
  finally{setLoading(false);}
 },[t]);
 useEffect(()=>{void Promise.resolve().then(load);},[load]);
 useEffect(()=>{
  if(!answer||savedId)return;
  const warn=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue="";
  };
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[answer,savedId]);
 const eligible=connections.filter(c=>c.enabled&&c.credentialState==="configured"&&
  c.lastTestStatus==="passed"&&c.modelId!==null&&
  free.some(m=>m.providerId===c.providerId&&m.modelId===c.modelId));
 const chosen=eligible.find(c=>c.id===selected)??null;
 const invalidate=()=>{setPreview(null);setConsent(false);setFeedback("");};
 const choose=(id:string)=>{setSelected(id);invalidate();};
 async function getPreview(){
  if(!chosen||busy.current)return;
  busy.current=true;setPhase("previewing");invalidate();
  try{
   const result=await fetch("/api/admin/ai-connections/preview",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({archiveId,connectionId:chosen.id})});
   const data=await result.json() as Preview|ApiFailure;
   if(!result.ok||!data.ok)throw Error("error" in data?data.error:"unavailable");
   // The entire text transmitted by the backend must match the exact text
   // the person reviewed before finalizing this archive.
   if(data.archiveId!==archiveId||data.preview!==reviewedText||
      !sameDestination(chosen,data)){
    setFeedback(t("aiSend.changed"));return;
   }
   setPreview(data);setConsent(false);
  }catch(error){setFeedback(t(friendlyKey(error instanceof Error?error.message:"unavailable")));}
  finally{busy.current=false;setPhase("idle");}
 }
 async function send(){
  if(!chosen||!preview||!consent||!sameDestination(chosen,preview)||
     preview.preview!==reviewedText||busy.current||answer)return;
  busy.current=true;setPhase("sending");setConsent(false);setFeedback("");
  // Reusing the approval is forbidden by the backend even if the network fails.
  const approval=preview.approval;setPreview(null);
  try{
   const response=await fetch("/api/admin/ai-connections/send",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({archiveId,connectionId:chosen.id,approval})});
   const result=await response.json() as Answer|ApiFailure;
   if(!response.ok||!result.ok)throw Error("error" in result?result.error:"unavailable");
   if(result.stored!==false||result.archiveId!==archiveId)throw Error("invalid");
   setAnswer(result);
   setResponseKey(crypto.randomUUID());
   setSavedId(null);
   setFeedback(t("aiSend.unsaved"));
  }catch(error){setFeedback(t(friendlyKey(error instanceof Error?error.message:"unavailable")));}
  finally{busy.current=false;setPhase("idle");}
 }
 async function copy(){
  if(!answer)return;
  try{await navigator.clipboard.writeText(answer.response);setFeedback(t("aiSend.copied"));}
  catch{setFeedback(t("aiSend.copyFailed"));}
 }
 async function saveResponse(){
  if(!answer||!responseKey||busy.current||savedId||saving)return;
  busy.current=true;setSaving(true);setFeedback("");
  try{
   const response=await fetch("/api/ai-briefs/archives/"+encodeURIComponent(archiveId)+"/responses",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:answer.response,provider:answer.provider,model:answer.model,
     idempotencyKey:responseKey})
   });
   const result=await response.json() as {ok?:boolean;id?:string;error?:string;alreadySaved?:boolean};
   if(!response.ok||!result.ok||result.id!==responseKey)
    throw Error(result.error??"unavailable");
   // Confirmation only after the server has committed the response.
   setSavedId(result.id);
   setFeedback(t(result.alreadySaved?"aiSend.alreadySaved":"aiSend.saveSuccess"));
  }catch(error){
   const code=error instanceof Error?error.message:"unavailable";
   setFeedback(t(code==="idempotency-conflict"?"aiSend.saveConflict":"aiSend.saveFailed"));
  }finally{busy.current=false;setSaving(false);}
 }
 function discard(){
  if(!answer||savedId||window.confirm(t("aiSend.discardConfirm"))){
   setAnswer(null);setResponseKey(null);setSavedId(null);invalidate();
  }
 }
 function confirmLeaving(event:MouseEvent<HTMLAnchorElement>){
  if(answer&&!savedId&&!window.confirm(t("aiSend.leaveConfirm")))event.preventDefault();
 }
 return <section className="smn-panel rounded-3 p-3 p-md-4 mt-4" aria-labelledby="ai-send-heading">
  <div className="d-flex flex-wrap justify-content-between gap-2">
   <div><h3 id="ai-send-heading" className="h5 mb-1">{t("aiSend.title")}</h3>
    <p className="text-secondary small mb-2">{t("aiSend.intro")}</p></div>
   <Link href="/app/admin/settings/ai" onClick={confirmLeaving}
    className="btn btn-outline-secondary btn-sm align-self-start">
    {t("aiSend.configure")}
   </Link>
  </div>
  <p className="small text-secondary">{t("aiSend.scope")}: {teamName} · {cycleName}</p>
  <div className="mb-3">
   <label className="form-label" htmlFor="ai-send-connection">{t("aiSend.connection")}</label>
   <select id="ai-send-connection" className="form-select" value={selected} disabled={loading||phase!=="idle"||!!answer}
    onChange={event=>choose(event.target.value)}>
    <option value="">{t("aiSend.choose")}</option>
    {eligible.map(c=><option key={c.id} value={c.id}>{c.label} · {c.providerId} · {c.modelId}</option>)}
   </select>
   {loading?<p className="small text-secondary mt-2" role="status">{t("aiSend.loading")}</p>:
    eligible.length===0?<p className="alert alert-info mt-2 mb-1" role="status">{t("aiSend.noFree")}</p>:null}
  </div>
  <p className="small text-secondary">{t("aiSend.privacy")}</p>
  <div className="d-flex flex-wrap gap-2">
   <button type="button" className="btn btn-outline-primary" disabled={!chosen||phase!=="idle"||!!answer}
    onClick={()=>void getPreview()}>{phase==="previewing"?t("aiSend.previewing"):t("aiSend.preview")}</button>
   {answer&&<button type="button" className="btn btn-outline-secondary" disabled={saving} onClick={discard}>
    {t("aiSend.newRequest")}</button>}
  </div>
  {preview&&chosen&&sameDestination(chosen,preview)&&<div className="border rounded-3 p-3 mt-3">
   <h4 className="h6">{t("aiSend.exactText")}</h4>
   <p className="small mb-2">{t("aiSend.destination")}: <strong>{preview.provider} · {preview.model}</strong></p>
   <p className="small">{t("aiSend.scope")}: {teamName} · {cycleName}</p>
   <textarea className="form-control font-monospace" aria-label={t("aiSend.exactText")}
    rows={12} readOnly value={preview.preview}/>
   <p className="small text-secondary mt-2">{t("aiSend.expiry")}: {new Date(preview.expiresAt).toLocaleTimeString()}</p>
   <label htmlFor="ai-send-consent" className="d-flex gap-2 align-items-start">
    <input id="ai-send-consent" className="form-check-input mt-1" type="checkbox" checked={consent}
     disabled={phase!=="idle"} onChange={e=>setConsent(e.target.checked)}/>
    <span>{t("aiSend.consent")}</span>
   </label>
   <button type="button" className="btn btn-primary mt-3" disabled={!consent||phase!=="idle"}
    onClick={()=>void send()}>{t("aiSend.send")}</button>
  </div>}
  {phase==="sending"&&<p role="status" className="mt-3">{t("aiSend.sending")}</p>}
  {answer&&<div className="border rounded-3 p-3 mt-3">
   <h4 className="h6">{t("aiSend.response")}</h4>
   <p className="small text-secondary">{answer.provider} · {answer.model} · {t(savedId?"aiSend.saved":"aiSend.unsaved")}</p>
   <textarea className="form-control font-monospace" aria-label={t("aiSend.response")}
    rows={12} readOnly value={answer.response}/>
   <div className="d-flex flex-wrap gap-2 mt-3">
    <button type="button" className="btn btn-outline-primary" onClick={()=>void copy()}>
     {t("aiSend.copy")}</button>
    <button type="button" className="btn btn-primary" disabled={saving||!!savedId||!responseKey}
     onClick={()=>void saveResponse()}>{saving?t("aiSend.saving"):t(savedId?"aiSend.saved":"aiSend.saveResponse")}</button>
    <Link href={"/app/ai-briefs/archives/"+archiveId} onClick={confirmLeaving}
     className="btn btn-outline-secondary">{t("aiSend.viewArchive")}</Link>
   </div>
   <p className="small text-secondary mt-2 mb-0">{t(savedId?"aiSend.savedDetail":"aiSend.saveExplanation")}</p>
  </div>}
  {feedback&&<p role="status" className="small mt-3 mb-0">{feedback}</p>}
 </section>;
}
