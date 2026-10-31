"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryStatuses,registryTypes,type RegistryType} from "@/lib/registry-types";
import RiskRoam from "./risk-roam";
import RiskAssessment from "./risk-assessment";
import MaterializeRisk from "./materialize-risk";
import DependencyParties from "./dependency-parties";
import DependencyVigilance from "./dependency-vigilance";
import RegistryCycles from "./registry-cycles";
import DecisionDetail from "./decision-detail";
import DecisionActions from "./decision-actions";
import ActionLinks from "./action-links";
import RegistryRelations from "./registry-relations";
import {obstacleTransition,obstacleNeedsAttention} from "@/lib/obstacle-lifecycle";
type Response={ok:boolean;id?:string;revision?:number;error?:string};
const today=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
};
export default function RegistryCreate({teamId,canManage,itemId,initialType="risk",modalMode=false,onCreated,onSaved,cycleId,lockDescription=false}:{
 teamId:string|null;canManage:boolean;itemId?:string;
 initialType?:"risk"|"obstacle";modalMode?:boolean;onCreated?:()=>void;onSaved?:()=>void;cycleId?:string;lockDescription?:boolean;
}){
 const t=useTranslation();
 const [type,setType]=useState<RegistryType>(initialType);
 const [title,setTitle]=useState("");
 const [date,setDate]=useState(today);
 const [status,setStatus]=useState<string>(registryStatuses[initialType][0]);
 const [description,setDescription]=useState("");
 const [owner,setOwner]=useState("");
 const [due,setDue]=useState("");
 const [comment,setComment]=useState("");
 const [revision,setRevision]=useState<number|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [createdId,setCreatedId]=useState<string|null>(null);
 const [baseline,setBaseline]=useState<string|null>(null);
 const [originalStatus,setOriginalStatus]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<{ok:boolean;message:string}|null>(null);
 useEffect(()=>{
  if(!itemId)return;
  let active=true;
  void fetch("/api/admin/registries/"+encodeURIComponent(itemId)+"?teamId="+encodeURIComponent(teamId??""),{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{item:Record<string,unknown>}>;})
   .then(({item})=>{if(!active)return;
    if(item.teamId!==teamId)throw Error("mismatch");
    setType(item.type as RegistryType);setTitle(item.title as string);setDate(item.occurredOn as string);
    setStatus(item.status as string);setDescription((item.description as string|null)??"");
    setOwner((item.owner as string|null)??"");setDue((item.dueOn as string|null)??"");
    setComment((item.comment as string|null)??"");setRevision(typeof item.revision==="number"?item.revision:null);setLoaded(true);
    setOriginalStatus(item.status as string);
    setBaseline(JSON.stringify([item.title,item.occurredOn,item.status,item.description??"",item.owner??"",item.dueOn??"",item.comment??""]));
   }).catch(()=>{if(active)setNotice({ok:false,message:t("registryCreate.unavailableRecord")});});
  return()=>{active=false;};
 },[itemId,teamId,t]);
 const dirty=!!itemId&&loaded&&baseline!==JSON.stringify([title,date,status,description,owner,due,comment]);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 const translate=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const changeType=(next:RegistryType)=>{setType(next);setStatus(registryStatuses[next][0]);setNotice(null);};
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!teamId||!canManage||busy)return;
  setBusy(true);setNotice(null);setCreatedId(null);
  try{
   if(itemId&&revision===null)throw Error("not-loaded");
   const response=await fetch(itemId?"/api/admin/registries/"+encodeURIComponent(itemId):"/api/admin/registries",{method:itemId?"PATCH":"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...(itemId?{revision}:cycleId?{cycleId}:{}),teamId,type,title,occurredOn:date,status,
      description:description||null,owner:owner||null,dueOn:due||null,comment:comment||null})});
   const result=await response.json() as Response;
   if(response.status===409){setNotice({ok:false,message:translate("conflict")});return;}
   if(!response.ok||!result.ok||!result.id)throw Error(result.error??"failed");
   setNotice({ok:true,message:translate("success").replace("{id}",result.id)});
   if(!itemId)setCreatedId(result.id);
   if(itemId){setRevision(result.revision??(revision??0)+1);setOriginalStatus(status);setBaseline(JSON.stringify([title,date,status,description,owner,due,comment]));onSaved?.();}
   else {setTitle("");setDescription("");setOwner("");setDue("");setComment("");onCreated?.();}
  }catch{setNotice({ok:false,message:translate("failed")});}
  finally{setBusy(false);}
 };
 if(itemId&&!loaded)return <div role={notice?"alert":"status"} className={notice?"alert alert-warning":"p-3 text-body-secondary"}>
  {notice?.message??t("registryList.loading")}
 </div>;
 return <div className="d-grid gap-3">
  {!modalMode&&<header><h1>{translate("title")}</h1><p className="text-body-secondary">{translate("intro")}</p></header>}
  {!teamId?<div role="alert" className="alert alert-warning">{translate("unavailable")}</div>:
   !canManage?<div className="card p-3 d-grid gap-2"><div role="status" className="alert alert-info">{translate("readonly")}</div>{loaded&&<><h2>{title}</h2><p>{translate("date")}: {date}</p><p>{translate("status")}: {translate(status)}</p><p>{description}</p></>}</div>:
  <form id={modalMode&&itemId?"registry-main-edit":undefined} className={modalMode?"d-grid gap-3":"card p-3 p-lg-4 d-grid gap-3"} onSubmit={save}>
   {dirty&&<div className="alert alert-warning" role="status">{translate("unsaved")}</div>}
   {type==="obstacle"&&<p className="small text-body-secondary" role="status">{itemId&&obstacleTransition(originalStatus,status).valid&&obstacleTransition(originalStatus,status).reopened?t("obstacleLifecycle.reopening"):status==="resolved"?t("obstacleLifecycle.resolved"):status==="abandoned"?t("obstacleLifecycle.abandoned"):obstacleNeedsAttention(status)?t("obstacleLifecycle.active"):""}</p>}
   <div className="row g-3">
    {!modalMode&&<div className="col-md-6"><label className="form-label" htmlFor="registry-type">{translate("type")}</label>
     <select id="registry-type" className="form-select" value={type} onChange={e=>changeType(e.target.value as RegistryType)}>
      {registryTypes.map(item=><option key={item} value={item}>{translate(item)}</option>)}
     </select></div>}
    <div className="col-md-4"><label className="form-label" htmlFor="registry-date">{translate("date")}</label>
     <input id="registry-date" type="date" className="form-control" value={date} required onChange={e=>setDate(e.target.value)}/></div>
    <div className="col-md-4"><label className="form-label" htmlFor="registry-due">{translate("due")}</label>
     <input id="registry-due" type="date" className="form-control" value={due} onChange={e=>setDue(e.target.value)}/></div>
    <div className="col-md-4"><label className="form-label" htmlFor="registry-status">{translate("status")}</label>
     <select id="registry-status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
      {registryStatuses[type].map(s=><option key={s} value={s}>{translate(s)}</option>)}
     </select></div>
    <div className="col-12"><label className="form-label" htmlFor="registry-title">{translate("titleField")}</label>
     <input id="registry-title" className="form-control" maxLength={240} required value={title} onChange={e=>setTitle(e.target.value)}/></div>
    <div className="col-12"><label className="form-label" htmlFor="registry-owner">{translate("owner")}</label>
     <input id="registry-owner" className="form-control" maxLength={200} value={owner} onChange={e=>setOwner(e.target.value)}/></div>
    <div className="col-12"><label className="form-label" htmlFor="registry-description">{translate("description")}</label>
     <textarea id="registry-description" className="form-control" rows={3} maxLength={4000} value={description} disabled={lockDescription} onChange={e=>setDescription(e.target.value)}/></div>   </div>
   {!(modalMode&&itemId)&&<div className="d-flex justify-content-end">
    <button type="submit" className="btn btn-primary" disabled={busy||!title.trim()||(!!itemId&&revision===null)}>{busy?translate("creating"):itemId?t("common.save"):translate("create")}</button>
   </div>}
   {notice&&<div role={notice.ok?"status":"alert"} className={notice.ok?"alert alert-success":"alert alert-danger"}>{notice.message}{createdId&&<a className="ms-2" href={"/app/admin/registries/"+encodeURIComponent(createdId)}>{translate("edit")}</a>}</div>}
  </form>}
  {itemId&&loaded&&<details className="smn-registry-fold"><summary>Relations entre fiches et objectifs</summary><div className="smn-registry-fold-body"><RegistryRelations id={itemId} type={type} canManage={canManage} onSaved={onSaved}/></div></details>}
  {itemId&&loaded&&type==="action"&&<ActionLinks id={itemId} canManage={canManage} onSaved={onSaved}/>}
  {itemId&&loaded&&type==="decision"&&<><DecisionDetail id={itemId} canManage={canManage} onSaved={onSaved}/>{teamId&&<DecisionActions id={itemId} teamId={teamId} title={title} description={description} canManage={canManage} onSaved={onSaved}/>}</>}
  {itemId&&loaded&&(type==="risk"||type==="dependency"||type==="obstacle")&&<details className="smn-registry-fold"><summary>{t("registryCycles.heading")}</summary><div className="smn-registry-fold-body"><RegistryCycles embedded teamId={teamId??undefined} id={itemId} canManage={canManage} onSaved={onSaved}/></div></details>}
  {itemId&&loaded&&type==="dependency"&&<><DependencyParties id={itemId} canManage={canManage} onSaved={onSaved}/><DependencyVigilance id={itemId} canManage={canManage} onSaved={onSaved}/></>}
  {itemId&&loaded&&type==="risk"&&<><details className="smn-registry-fold"><summary>Classification ROAM</summary><div className="smn-registry-fold-body"><RiskRoam id={itemId} canManage={canManage} onSaved={onSaved}/></div></details><details className="smn-registry-fold"><summary>Évaluation du risque</summary><div className="smn-registry-fold-body"><RiskAssessment id={itemId} canManage={canManage} onSaved={onSaved}/></div></details>{teamId&&<details className="smn-registry-fold"><summary>Créer un obstacle à partir du risque</summary><div className="smn-registry-fold-body"><MaterializeRisk id={itemId} teamId={teamId} title={title} description={description} canManage={canManage} onSaved={onSaved}/></div></details>}</>}
 </div>;
}
