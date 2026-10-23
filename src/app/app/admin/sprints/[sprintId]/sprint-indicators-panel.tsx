"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../../bootstrap-icon";
import {
 deriveSprintIndicators,parseIndicatorDraft,emptyPoints,emptyTickets,emptyScores,
 type SprintPoints,type SprintTickets,type SprintScores
} from "@/lib/sprint-indicator-values";
import type {SprintDetailIndicators} from "@/server/sprints/indicators-read";

type Group="points"|"tickets"|"scores";
type Field="initial"|"added"|"removed"|"done"|"confidence"|"clarity";
type Draft=Record<string,string>;
type FieldDef={key:Field;label:string;code:string;kind:"count"|"score"};
const pointFields:readonly FieldDef[]=[
 {key:"initial",label:"storyPoints.initial",code:"F01",kind:"count"},
 {key:"added",label:"storyPoints.added",code:"F02",kind:"count"},
 {key:"removed",label:"storyPoints.removed",code:"F03",kind:"count"},
 {key:"done",label:"storyPoints.done",code:"F04",kind:"count"}
];
const ticketFields:readonly FieldDef[]=[
 {key:"initial",label:"sprintTickets.initial",code:"F10",kind:"count"},
 {key:"done",label:"sprintTickets.done",code:"F11",kind:"count"}
];
const scoreFields:readonly FieldDef[]=[
 {key:"confidence",label:"sprintDetail.indicatorConfidence",code:"I01",kind:"score"},
 {key:"clarity",label:"sprintDetail.indicatorClarity",code:"I02",kind:"score"}
];
const groupFields=(group:Group)=>group==="points"?pointFields:
 group==="tickets"?ticketFields:scoreFields;
const serialize=(value:Record<string,number|null>):Draft=>
 Object.fromEntries(Object.entries(value).map(([key,n])=>[key,n===null?"":String(n)]));
const display=(n:number|null)=>n===null?"—":String(n);
export default function SprintIndicatorsPanel({sprintId,status,canManage,data}:{
 sprintId:string;status:string;canManage:boolean;data:SprintDetailIndicators;
}){
 const t=useTranslation(),router=useRouter(),modal=useRef<HTMLDialogElement>(null);
 const action=useRef<HTMLButtonElement|null>(null),first=useRef<HTMLInputElement>(null);
 const [group,setGroup]=useState<Group|null>(null);
 const [focusField,setFocusField]=useState<Field|null>(null);
 const [draft,setDraft]=useState<Draft>({}),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const source=data.state==="available"?data:null;
 const points=source?.points.state==="available"?source.points.values:emptyPoints;
 const tickets=source?.tickets.state==="available"?source.tickets.values:emptyTickets;
 const scores=source?.scores.state==="available"?source.scores.values:emptyScores;
 const calculated=deriveSprintIndicators(points,tickets);
 const editable=canManage&&status!=="closed"&&source!==null;
 const current=group&&source?source[group]:null;
 const validDraft=group!==null&&groupFields(group).every(field=>
  parseIndicatorDraft(draft[field.key]??"",field.kind).ok);
 const previewValues=(g:Group):Record<string,number|null>=>{
  const values:Record<string,number|null>={};
  for(const field of groupFields(g)){
   const parsed=parseIndicatorDraft(draft[field.key]??"",field.kind);
   values[field.key]=parsed.ok?parsed.value:null;
  }
  return values;
 };
 const draftPoints: SprintPoints=group==="points"?previewValues("points") as SprintPoints:points;
 const draftTickets: SprintTickets=group==="tickets"?previewValues("tickets") as SprintTickets:tickets;
 const draftCalculated=deriveSprintIndicators(draftPoints,draftTickets);
 const dirty=group!==null&&current?.state==="available"&&
  groupFields(group).some(field=>
   draft[field.key]!==((current.values as unknown as Record<string,number|null>)[field.key]===null?
    "":String((current.values as unknown as Record<string,number|null>)[field.key])));
 useEffect(()=>{
  const dialog=modal.current;
  if(group!==null&&dialog&&!dialog.open){dialog.showModal();first.current?.focus();}
  return()=>{if(dialog?.open)dialog.close();};
 },[group]);
 useEffect(()=>{
  if(group===null)action.current?.focus();
 },[group]);
 useEffect(()=>{
  if(!dirty)return;
  const prevent=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",prevent);
  return()=>window.removeEventListener("beforeunload",prevent);
 },[dirty]);
 function begin(g:Group,field:Field,button:HTMLButtonElement){
  if(!editable||source?.[g].state!=="available")return;
  const item=source[g];
  if(item.state!=="available")return;
  action.current=button;setFocusField(field);
  setDraft(serialize(item.values));setGroup(g);setError("");setNotice("");
 }
 function dismiss(){
  if(busy)return;
  if(dirty&&!window.confirm(t("sprintReview.discard")))return;
  setError("");setGroup(null);
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy||!editable||!group||current?.state!=="available"||!validDraft||!dirty)return;
  const values=previewValues(group);
  const path=group==="points"?"story-points":group==="tickets"?"tickets":"scores";
  const payload=group==="points"?
   {sprintId,revision:current.revision,points:values}:
   group==="tickets"?{sprintId,revision:current.revision,counts:values}:
   {sprintId,revision:current.revision,scores:values};
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/sprints/"+path,{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
   });
   const result=await r.json();
   if(!r.ok||!result.ok){
    if(result.error==="conflict"){setError(t("sprintDetail.indicatorConflict"));return;}
    if(result.error==="closed-period"){setError(t("sprintDetail.indicatorClosed"));return;}
    setError(t("sprintDetail.indicatorSaveError"));return;
   }
   setNotice(t("sprintDetail.indicatorSaved"));
   setGroup(null);router.refresh();
  }catch{setError(t("sprintDetail.indicatorSaveError"));}
  finally{setBusy(false);}
 }
 const shown=(kind:Group)=>source?.[kind].state==="available"?source[kind].values:null;
 function section(title:string,groupName:Group,fields:readonly FieldDef[]){
  const item=shown(groupName);
  return <section className="mb-4" aria-label={title}>
   <h2 className="h6 mb-3">{title}</h2>
   <div className="row g-3">
    {fields.map(field=>{
     const val=item?(item as unknown as Record<string,number|null>)[field.key]:null;
     return <div key={field.code} className="col-12 col-sm-6 col-xl-3">
      <div className="border rounded-3 p-3 h-100">
       <p className="small text-secondary mb-2">{field.code} · {t(field.label as "storyPoints.initial")}</p>
       <div className="d-flex align-items-center justify-content-between gap-2">
        <strong className="fs-5">{item?display(val):t("dashboard.cockpit.notAvailable")}</strong>
        {editable&&item&&<button className="btn btn-link btn-sm p-1" type="button"
         aria-label={t("sprintDetail.indicatorEdit",{name:t(field.label as "storyPoints.initial")})}
         title={t("sprintDetail.indicatorEdit",{name:t(field.label as "storyPoints.initial")})}
         onClick={e=>begin(groupName,field.key,e.currentTarget)}>
         <BootstrapIcon name="pencil-square"/>
        </button>}
       </div>
      </div>
     </div>;
    })}
   </div>
  </section>;
 }
 const formatDerived=(v:number|null,percent=false)=>
  v===null?t("storyPoints.notCalculable"):
  percent?new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v)+" %":String(v);
 return <div>
  <h2 className="h5 mb-3">{t("sprintDetail.tabs.indicators")}</h2>
  {data.state==="unavailable"&&<p role="alert">{t("dashboard.cockpit.notAvailable")}</p>}
  {source?.snapshotVersion!==null&&source?.snapshotVersion!==undefined&&
   <p className="small text-secondary">{t("sprintDetail.indicatorSnapshot",{version:source.snapshotVersion})}</p>}
  {section(t("storyPoints.title"),"points",pointFields)}
  {section(t("sprintTickets.title"),"tickets",ticketFields)}
  {section(t("sprintDetail.indicatorScoresTitle"),"scores",scoreFields)}
  <section aria-label={t("sprintDetail.indicatorDerivedTitle")}>
   <h2 className="h6 mb-3">{t("sprintDetail.indicatorDerivedTitle")}</h2>
   <dl className="row g-3">
    {([
     ["F05","storyPoints.final",calculated.final,false],
     ["F06","storyPoints.remaining",calculated.remaining,false],
     ["F07","storyPoints.rate",calculated.rate,true],
     ["F12","sprintDetail.indicatorTicketRate",calculated.ticketRate,true]
    ] as const).map(([code,label,val,pct])=><div className="col-12 col-sm-6 col-xl-3" key={code}>
      <div className="border rounded-3 p-3 h-100">
       <dt className="small text-secondary mb-2">{code} · {t(label)}</dt>
       <dd className="fs-5 fw-semibold mb-0">{source?formatDerived(val,pct):
        t("dashboard.cockpit.notAvailable")}</dd>
      </div>
     </div>)}
   </dl>
   {calculated.overrun&&source&&
    <p role="status" className="alert alert-warning">{t("storyPoints.overrun")}</p>}
  </section>
  <p className="small text-secondary">{t("sprintTickets.noSource")}</p>
  {notice&&<p role="status" className="alert alert-success">{notice}</p>}
  {group!==null&&editable&&<dialog ref={modal} className="smn-sprint-edit-dialog"
   aria-labelledby="smn-indicator-dialog-title"
   onCancel={e=>{e.preventDefault();dismiss();}}>
   <div className="modal-content bg-body border rounded-4 shadow p-3 p-md-4">
    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
     <h3 className="h5" id="smn-indicator-dialog-title">
      {t("sprintDetail.indicatorEditGroup")}
     </h3>
     <button type="button" className="btn-close" aria-label={t("sprintDetail.close")}
      disabled={busy} onClick={dismiss}/>
    </div>
    <form onSubmit={save} className="d-grid gap-3">
     {groupFields(group).map((field,index)=>{
      const entered=draft[field.key]??"";
      const good=parseIndicatorDraft(entered,field.kind).ok;
      return <div key={field.code}>
       <label className="form-label" htmlFor={"smn-d3-"+field.code}>
        {field.code} · {t(field.label as "storyPoints.initial")}
       </label>
       <input ref={field.key===focusField?first:null}
        id={"smn-d3-"+field.code} type="number"
        className={"form-control"+(!good?" is-invalid":"")}
        min={field.kind==="score"?1:0} max={field.kind==="score"?5:1000000000}
        step={1} value={entered} disabled={busy}
        onChange={e=>setDraft(prev=>({...prev,[field.key]:e.target.value}))}/>
       {!good&&<p role="alert" className="small text-danger mt-1 mb-0">
        {t(field.kind==="score"?"sprintDetail.indicatorInvalidScore":
         "sprintDetail.indicatorInvalidCount")}
       </p>}
      </div>;
     })}
     {(group==="points"||group==="tickets")&&<div aria-live="polite"
      className="border rounded-3 p-3">
      <p className="small fw-semibold">{t("sprintDetail.indicatorLive")}</p>
      {group==="points"?<dl className="mb-0">
       <dt>F05 · {t("storyPoints.final")}</dt><dd>{formatDerived(draftCalculated.final)}</dd>
       <dt>F06 · {t("storyPoints.remaining")}</dt><dd>{formatDerived(draftCalculated.remaining)}</dd>
       <dt>F07 · {t("storyPoints.rate")}</dt><dd>{formatDerived(draftCalculated.rate,true)}</dd>
      </dl>:<dl className="mb-0">
       <dt>F12 · {t("sprintDetail.indicatorTicketRate")}</dt>
       <dd>{formatDerived(draftCalculated.ticketRate,true)}</dd>
      </dl>}
      {draftCalculated.overrun&&<p role="status" className="alert alert-warning">
       {t("storyPoints.overrun")}</p>}
     </div>}
     <p className="small text-secondary">{t("sprintDetail.indicatorProvisional")}</p>
     {error&&<p role="alert" className="alert alert-danger">{error}</p>}
     <div className="d-flex justify-content-end gap-2 flex-wrap">
      <button type="button" className="btn btn-outline-secondary"
       onClick={dismiss} disabled={busy}>{t("sprintDetail.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={busy||!validDraft||!dirty}>{t("sprintDetail.save")}</button>
     </div>
    </form>
   </div>
  </dialog>}
 </div>;
}
