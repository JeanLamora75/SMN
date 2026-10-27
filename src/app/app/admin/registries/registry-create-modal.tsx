"use client";

import {useEffect,useId,useRef,useState,type FormEvent,type SyntheticEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
import {roamValues} from "@/lib/roam-values";
import {levels} from "@/lib/risk-criticality";
import type {Party} from "@/server/registries/dependency-parties";
import {linkedJournalTypes} from "@/lib/registry-linked-creation";
import RegistryDialogPortal,{useRegistryPortalReady} from "./registry-dialog-portal";

type Kind=""|"local"|"external";
const nowInParis=()=>{
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(new Date());
 const get=(part:string)=>parts.find(x=>x.type===part)?.value??"";
 return [get("year"),get("month"),get("day")].join("-");
};
const uuidRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RegistryCreateModal({teamId,initialType="risk",sourceId,cycleId,linkedFromJournal=false,sourceTitle,onDismiss,onCreated}:{
 teamId:string;initialType?:RegistryType;sourceId?:string;cycleId?:string;
 linkedFromJournal?:boolean;sourceTitle?:string;
 onDismiss:()=>void;onCreated:(id:string)=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registryCreateModal."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const portalReady=useRegistryPortalReady();
 const dialog=useRef<HTMLDialogElement>(null);
 const requestId=useRef<string|null>(null);
 const allowedTypes:readonly RegistryType[]=linkedFromJournal?linkedJournalTypes:registryTypes;
 const previousFocus=useRef<HTMLElement|null>(null);
 const firstInput=useRef<HTMLInputElement>(null);
 const titleId=useId();
 const [type,setType]=useState<RegistryType>(initialType);
 const [title,setTitle]=useState("");
 const [occurredOn,setOccurredOn]=useState(nowInParis);
 const [status,setStatus]=useState<string>(registryStatuses[initialType][0]);
 const [description,setDescription]=useState("");
 const [owner,setOwner]=useState("");
 const [dueOn,setDueOn]=useState("");
 const [comment,setComment]=useState("");
 const [probability,setProbability]=useState("");
 const [impact,setImpact]=useState("");
 const [roam,setRoam]=useState("");
 const [requesterKind,setRequesterKind]=useState<Kind>("");
 const [requesterName,setRequesterName]=useState("");
 const [contributorKind,setContributorKind]=useState<Kind>("");
 const [contributorName,setContributorName]=useState("");
 const [atRisk,setAtRisk]=useState(false);
 const [rationale,setRationale]=useState("");
 const [replacesId,setReplacesId]=useState("");
 const [decisionSearch,setDecisionSearch]=useState("");
 const [decisionChoices,setDecisionChoices]=useState<{id:string;title:string;occurredOn:string}[]>([]);
 const [decisionUnavailable,setDecisionUnavailable]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<"error"|"invalid"|"conflict"|"unavailable"|null>(null);
 const currentType=(next:RegistryType)=>{
  if(!allowedTypes.includes(next))return;
  requestId.current=null;
  setType(next);setStatus(registryStatuses[next][0]);
  setError(null);
 };
 useEffect(()=>{
  const element=dialog.current;
  if(!element)return;
  if(!previousFocus.current||!element.contains(document.activeElement))
   previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(!element.open)element.showModal();
  firstInput.current?.focus();
  return()=>{
   // StrictMode réexécute les effets : ne jamais déclencher onClose lors du cleanup.
  };
 },[portalReady]);
 useEffect(()=>{
  if(!dirty)return;
  const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",guard);
  return()=>window.removeEventListener("beforeunload",guard);
 },[dirty]);
 const close=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(tr("discard")))return;
  dialog.current?.close();
 };
 const cancel=(event:SyntheticEvent<HTMLDialogElement>)=>{
  event.preventDefault();close();
 };
 useEffect(()=>{
  if(type!=="decision")return;
  const ctrl=new AbortController();
  const params=new URLSearchParams({
   type:"decision",search:decisionSearch.trim(),status:"",lifecycle:"all",
   sort:"dateDesc",page:"1"
  });
  void fetch("/api/admin/registries?"+params.toString(),{
   cache:"no-store",signal:ctrl.signal
  }).then(async response=>{
   if(!response.ok)throw Error("unavailable");
   return response.json() as Promise<{
    state:string;items?:{id:string;type:string;title:string;occurredOn:string}[]
   }>;
  }).then(data=>{
   if(ctrl.signal.aborted)return;
   if(data.state!=="available"||!Array.isArray(data.items))throw Error("invalid");
   const choices=data.items.filter(item=>uuidRx.test(item.id)&&item.type==="decision"&&
    typeof item.title==="string"&&typeof item.occurredOn==="string");
   if(choices.length!==data.items.length)throw Error("invalid");
   setDecisionChoices(choices);setDecisionUnavailable(false);
  }).catch(()=>{if(!ctrl.signal.aborted){setDecisionChoices([]);setDecisionUnavailable(true);}});
  return()=>ctrl.abort();
 },[type,decisionSearch]);
 const party=(kind:Kind,name:string):Party|null=>
  kind==="local"?{kind:"local",teamId}:
  kind==="external"&&name.trim()?{kind:"external",name:name.trim()}:null;
 const details=()=>{
  if(type==="risk")return {
   ...(probability?{probability:Number(probability)}:{}),
   ...(impact?{impact:Number(impact)}:{}),
   ...(roam?{roam}:{})
  };
  if(type==="dependency"){
   const requester=party(requesterKind,requesterName);
   const contributor=party(contributorKind,contributorName);
   return {...(requester&&contributor?{requester,contributor}:{}),atRisk};
  }
  if(type==="decision")return {
   ...(rationale?{rationale}:{}),
   ...(replacesId?{replacesId}:{})
  }; 
  return {};
 };
 const partyIncomplete=type==="dependency"&&(
  (requesterKind==="")!==(contributorKind==="")||
  requesterKind==="external"&&!requesterName.trim()||
  contributorKind==="external"&&!contributorName.trim()
 );
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy||!title.trim()||partyIncomplete||!allowedTypes.includes(type)||
   linkedFromJournal&&!sourceId)return;
  setBusy(true);setError(null);
  try{
   if(linkedFromJournal&&!requestId.current)requestId.current=window.crypto.randomUUID();
   const payload={
    teamId,type,title:title.trim(),occurredOn,status,description:description||null,
    owner:owner||null,dueOn:dueOn||null,comment:comment||null,
    details:details(),
    ...(linkedFromJournal?{requestId:requestId.current}:{}),
    ...((type==="risk"||type==="obstacle")&&cycleId?{cycleId}:{}),
    ...(!linkedFromJournal&&sourceId?{sourceId}:{})
   };
   const endpoint=linkedFromJournal?
    "/api/admin/registries/"+encodeURIComponent(sourceId!)+"/linked":
    "/api/admin/registries";
   const response=await fetch(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   if(response.status===409){setError("conflict");return;}
   if(response.status===503){setError("unavailable");return;}
   if(!response.ok){setError("invalid");return;}
   const result=await response.json() as {ok?:boolean;id?:string};
   if(response.status!==201||!result.ok||typeof result.id!=="string"||
    !uuidRx.test(result.id))throw Error("unconfirmed");
   setDirty(false);
   onCreated(result.id);
  }catch{setError("error");}
  finally{setBusy(false);}
 };
 const pickParty=(value:Kind,setter:(value:Kind)=>void)=>{
  setter(value);setError(null);
 };
 return <RegistryDialogPortal><dialog ref={dialog} className="smn-registry-create-dialog smn-cockpit-modal" data-registry-dirty={dirty}
  aria-labelledby={titleId} onCancel={cancel} onClose={()=>{previousFocus.current?.focus();onDismiss();}}>
  <form className="smn-registry-create-form" onSubmit={save}
   onChangeCapture={()=>{setDirty(true);requestId.current=null;}}
   onInputCapture={()=>{setDirty(true);requestId.current=null;}}>
   <header className="smn-registry-create-header smn-cockpit-modal-header">
    <h2 className="h5 mb-0" id={titleId}>{tr("heading")}</h2>
    <button className="btn-close" type="button" disabled={busy}
     aria-label={tr("cancel")} onClick={close}/>
   </header>
   <div className="smn-registry-create-body smn-cockpit-modal-body">
    {sourceId&&<p className="small text-body-secondary">{tr("source")}
     {sourceTitle&&<strong className="ms-1">{sourceTitle}</strong>}</p>}
    <div className="row g-2">
     <div className="col-sm-6">
      <label className="form-label" htmlFor={titleId+"-type"}>{label("type")}</label>
      <select id={titleId+"-type"}
       className="form-select" value={type} disabled={busy}
       onChange={e=>currentType(e.target.value as RegistryType)}>
       {allowedTypes.map(x=><option key={x} value={x}>{label(x)}</option>)}
      </select>
     </div>
     <div className="col-sm-6">
      <label className="form-label" htmlFor={titleId+"-date"}>{label("date")}</label>
      <input id={titleId+"-date"} type="date" required className="form-control"
       value={occurredOn} disabled={busy} onChange={e=>setOccurredOn(e.target.value)}/>
     </div>
     <div className="col-sm-8">
      <label className="form-label" htmlFor={titleId+"-title"}>{label("titleField")}</label>
      <input ref={firstInput} id={titleId+"-title"} type="text" required
       maxLength={240} className="form-control" value={title} disabled={busy}
       onChange={e=>setTitle(e.target.value)}/>
     </div>
     <div className="col-sm-4">
      <label className="form-label" htmlFor={titleId+"-status"}>{label("status")}</label>
      <select id={titleId+"-status"} className="form-select" value={status} disabled={busy}
       onChange={e=>setStatus(e.target.value)}>
       {registryStatuses[type].map(s=><option value={s} key={s}>{label(s)}</option>)}
      </select>
     </div>
     <div className="col-12">
      <label className="form-label" htmlFor={titleId+"-description"}>{label("description")}</label>
      <textarea id={titleId+"-description"} className="form-control" rows={3} maxLength={4000}
       value={description} disabled={busy} onChange={e=>setDescription(e.target.value)}/>
     </div>
     <div className="col-sm-6">
      <label className="form-label" htmlFor={titleId+"-owner"}>{label("owner")}</label>
      <input id={titleId+"-owner"} className="form-control" maxLength={200}
       value={owner} disabled={busy} onChange={e=>setOwner(e.target.value)}/>
     </div>
     <div className="col-sm-6">
      <label className="form-label" htmlFor={titleId+"-due"}>{label("due")}</label>
      <input id={titleId+"-due"} className="form-control" type="date"
       value={dueOn} disabled={busy} onChange={e=>setDueOn(e.target.value)}/>
     </div>
     <div className="col-12">
      <label className="form-label" htmlFor={titleId+"-comment"}>{label("comment")}</label>
      <textarea id={titleId+"-comment"} className="form-control" rows={2} maxLength={2000}
       value={comment} disabled={busy} onChange={e=>setComment(e.target.value)}/>
     </div>
    </div>
    {type==="risk"&&<fieldset className="smn-registry-create-group">
     <legend>{tr("risk")}</legend>
     <div className="row g-2">
      {([{key:"probability",value:probability,set:setProbability},
        {key:"impact",value:impact,set:setImpact}] as const).map(x=>
       <div key={x.key} className="col-sm-6">
        <label className="form-label" htmlFor={titleId+"-"+x.key}>{tr(x.key)}</label>
        <select className="form-select" id={titleId+"-"+x.key} value={x.value} disabled={busy}
         onChange={e=>x.set(e.target.value)}>
         <option value="">{tr("notAssessed")}</option>
         {levels.map(level=><option key={level} value={level}>{tr("level"+level)}</option>)}
        </select>
       </div>)}
      <div className="col-12">
       <label className="form-label" htmlFor={titleId+"-roam"}>{tr("roam")}</label>
       <select id={titleId+"-roam"} className="form-select" value={roam} disabled={busy}
        onChange={e=>setRoam(e.target.value)}>
        <option value="">{tr("notProvided")}</option>
        {roamValues.map(value=><option key={value} value={value}>
         {t(("registryRoam."+value) as Parameters<typeof t>[0])}</option>)}
       </select>
      </div>
     </div>
    </fieldset>}
    {type==="dependency"&&<fieldset className="smn-registry-create-group">
     <legend>{tr("dependency")}</legend>
     <div className="row g-2">
      {([{key:"requester",kind:requesterKind,setKind:setRequesterKind,name:requesterName,setName:setRequesterName},
         {key:"contributor",kind:contributorKind,setKind:setContributorKind,name:contributorName,setName:setContributorName}] as const)
       .map(x=><div key={x.key} className="col-sm-6">
        <label className="form-label" htmlFor={titleId+"-"+x.key}>{tr(x.key)}</label>
        <select id={titleId+"-"+x.key} className="form-select" value={x.kind} disabled={busy}
         onChange={e=>pickParty(e.target.value as Kind,x.setKind)}>
         <option value="">{tr("notProvided")}</option>
         <option value="local">{tr("localTeam")}</option>
         <option value="external">{tr("externalTeam")}</option>
        </select>
        {x.kind==="external"&&<input className="form-control mt-2" maxLength={120}
         aria-label={tr(x.key+"Name")} placeholder={tr(x.key+"Name")} required
         value={x.name} disabled={busy} onChange={e=>x.setName(e.target.value)}/>}
       </div>)}
      <div className="col-12 form-check ms-2 mt-3">
       <input id={titleId+"-atRisk"} className="form-check-input" type="checkbox"
        checked={atRisk} disabled={busy} onChange={e=>setAtRisk(e.target.checked)}/>
       <label htmlFor={titleId+"-atRisk"} className="form-check-label">{tr("atRisk")}</label>
      </div>
     </div>
     {partyIncomplete&&<p className="small text-danger" role="alert">{tr("partiesPair")}</p>}
    </fieldset>}
    {type==="decision"&&<fieldset className="smn-registry-create-group">
     <legend>{tr("decision")}</legend>
     <label className="form-label" htmlFor={titleId+"-rationale"}>{tr("rationale")}</label>
     <textarea className="form-control" id={titleId+"-rationale"} rows={3}
      value={rationale} maxLength={4000} disabled={busy} onChange={e=>setRationale(e.target.value)}/>
     <label className="form-label mt-2" htmlFor={titleId+"-decision-search"}>{tr("replacesSearch")}</label>
     <input id={titleId+"-decision-search"} className="form-control" maxLength={120}
      value={decisionSearch} disabled={busy} placeholder={tr("replacesSearchHint")}
      onChange={e=>setDecisionSearch(e.target.value)}/>
     <label className="form-label mt-2" htmlFor={titleId+"-replaces"}>{tr("replaces")}</label>
     <select id={titleId+"-replaces"} className="form-select" value={replacesId}
      disabled={busy||decisionUnavailable} onChange={e=>setReplacesId(e.target.value)}>
      <option value="">{tr("noReplacement")}</option>
      {decisionChoices.map(candidate=><option key={candidate.id} value={candidate.id}>
       {candidate.title} ({candidate.occurredOn})
      </option>)}
      {replacesId&&!decisionChoices.some(candidate=>candidate.id===replacesId)&&
       <option value={replacesId}>{tr("selectedReplacement")}</option>}
     </select>
     {decisionUnavailable&&<p role="alert" className="small text-danger">{tr("decisionsUnavailable")}</p>}
    </fieldset>}
    {cycleId&&(type==="risk"||type==="obstacle")&&
     <p className="small text-body-secondary">{tr("linkedCycle")}</p>}
    {error&&<p role="alert" className="alert alert-danger mb-0">{tr(error)}</p>}
   </div>
   <footer className="smn-registry-create-footer smn-cockpit-modal-footer">
    <button className="btn btn-outline-secondary" type="button" disabled={busy}
     onClick={close}>{tr("cancel")}</button>
    <button className="btn btn-primary" type="submit"
     disabled={busy||!title.trim()||partyIncomplete}>
     {busy?tr("saving"):tr("submit")}
    </button>
   </footer>
  </form>
 </dialog></RegistryDialogPortal>;
}
