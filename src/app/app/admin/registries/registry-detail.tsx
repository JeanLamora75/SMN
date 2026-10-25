"use client";

import Link from "next/link";
import {useEffect,useId,useRef,useState,type KeyboardEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {registryStatuses,registryTypes,type RegistryType} from "@/lib/registry-types";
import {registryDetailTabs,registryBusinessTabKeys,type RegistryDetailTab} from "@/lib/registry-detail-tabs";
import BootstrapIcon from "../../bootstrap-icon";
import RegistryCreate from "./registry-create";
import RegistrySummary from "./registry-summary";
import RegistryDescriptionEditor from "./registry-description-editor";
import RegistryHistory from "./registry-history";
import RegistryRelations from "./registry-relations";
import RegistryCycles from "./registry-cycles";
import RiskRoam from "./risk-roam";
import RiskAssessment from "./risk-assessment";
import MaterializeRisk from "./materialize-risk";
import DependencyParties from "./dependency-parties";
import DependencyVigilance from "./dependency-vigilance";
import DecisionDetail from "./decision-detail";
import DecisionActions from "./decision-actions";
import ActionLinks from "./action-links";

type DetailItem={
 id:string;teamId:string;type:RegistryType;title:string;status:string;
 occurredOn:string;description:string|null;dueOn:string|null;
 owner?:string|null;comment?:string|null;revision?:number;
 createdAt?:string;updatedAt?:string;
};
const icons={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",
 highlight:"bell-fill"
} as const satisfies Record<RegistryType,string>;
const dateRx=/^\d{4}-\d{2}-\d{2}$/;
function parseDetailItem(raw:unknown,teamId:string,requestedId:string):DetailItem|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const item=raw as Record<string,unknown>;
 if(typeof item.id!=="string"||item.id!==requestedId||item.teamId!==teamId||
  typeof item.type!=="string"||!registryTypes.some(type=>type===item.type)||
  typeof item.title!=="string"||!item.title.trim()||
  typeof item.status!=="string"||
  !(registryStatuses[item.type as RegistryType] as readonly string[]).includes(item.status)||
  typeof item.occurredOn!=="string"||!dateRx.test(item.occurredOn)||
  !(item.dueOn===null||typeof item.dueOn==="string"&&dateRx.test(item.dueOn))||
  !(item.description===null||typeof item.description==="string"))return null;
 return item as DetailItem;
}

/** Global live-record page only; never used for a frozen Sprint Vn snapshot. */
export default function RegistryDetail({id,teamId,canManage}:{
 id:string;teamId:string;canManage:boolean;
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("registryDetail."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const [item,setItem]=useState<DetailItem|null>(null);
 const [loading,setLoading]=useState(true);
 const [problem,setProblem]=useState<"missing"|"unavailable"|null>(null);
 const [reload,setReload]=useState(0);
 const [tab,setTab]=useState<RegistryDetailTab>("summary");
 const [editing,setEditing]=useState(false);
 const [descriptionEditing,setDescriptionEditing]=useState(false);
 const prefix=useId();
 const buttons=useRef<Partial<Record<RegistryDetailTab,HTMLButtonElement|null>>>({});
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id),{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(response.status===404)return {state:"missing" as const};
   if(!response.ok)throw Error("source-unavailable");
   return {state:"available" as const,
    payload:await response.json() as {item:unknown}};
  }).then(result=>{
   if(controller.signal.aborted)return;
   if(result.state==="missing"){setItem(null);setProblem("missing");return;}
   const next=parseDetailItem(result.payload.item,teamId,id);
   if(!next){setItem(null);setProblem("unavailable");return;}
   setItem(next);setProblem(null);
  }).catch(()=>{
   if(controller.signal.aborted)return;
   setItem(null);setProblem("unavailable");
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[id,teamId,reload]);
 const retry=()=>{setLoading(true);setProblem(null);setReload(n=>n+1);};
 const tabs=item?registryDetailTabs(item.type):[];
 const onTabKeyDown=(event:KeyboardEvent<HTMLButtonElement>,current:RegistryDetailTab)=>{
  const index=tabs.indexOf(current);
  let next=index;
  if(event.key==="ArrowRight")next=(index+1)%tabs.length;
  else if(event.key==="ArrowLeft")next=(index-1+tabs.length)%tabs.length;
  else if(event.key==="Home")next=0;
  else if(event.key==="End")next=tabs.length-1;
  else return;
  event.preventDefault();
  const target=tabs[next];
  setTab(target);
  buttons.current[target]?.focus();
 };
 const updated=()=>{setEditing(false);retry();};
 const descriptionUpdated=()=>{setDescriptionEditing(false);retry();};
 const cancelEdit=()=>{
  if(window.confirm(tr("leaveEditWarning"))){setEditing(false);retry();}
 };
 return <section className="smn-registry-detail">
  <nav aria-label={tr("back")} className="mb-3">
   <Link href="/app/admin/registries">{tr("back")}</Link>
  </nav>
  {loading?<p role="status">{tr("loading")}</p>:
   problem||!item||item.id!==id?<div className="alert alert-warning" role="alert">
    {tr(problem==="missing"?"notFound":"unavailable")}
    {problem!=="missing"&&<button className="btn btn-sm btn-outline-secondary ms-2"
     type="button" onClick={retry}>{tr("retry")}</button>}
   </div>:<>
   <header className="smn-registry-detail-header">
    <div className="smn-registry-detail-icon" aria-hidden="true">
     <BootstrapIcon name={icons[item.type]}/>
    </div>
    <div className="smn-registry-detail-identity">
     <span className="smn-registry-detail-kind">{label(item.type)}</span>
     <h1>{item.title}</h1>
     <div className="smn-registry-detail-meta">
      <span className="badge bg-body-secondary text-body-emphasis border">{label(item.status)}</span>
      <span>{tr("businessDate")}: <time dateTime={item.occurredOn}>{item.occurredOn}</time></span>
      {item.dueOn&&<span>{tr("due")}: <time dateTime={item.dueOn}>{item.dueOn}</time></span>}
      {canManage&&item.owner&&<span>{tr("owner")}: {item.owner}</span>}
     </div>
    </div>
    {canManage&&<button type="button" className="btn btn-outline-primary btn-sm smn-registry-detail-edit"
     onClick={()=>setEditing(true)} disabled={editing}>{tr("edit")}</button>}
    {!canManage&&<span className="small text-body-secondary">{tr("readOnly")}</span>}
   </header>
   {editing&&canManage?<div className="smn-registry-legacy-editor">
    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
     <h2 className="h5 mb-0">{tr("edit")}</h2>
     <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelEdit}>
      {tr("cancelEdit")}
     </button>
    </div>
    <RegistryCreate itemId={id} teamId={teamId} canManage={canManage}
     modalMode lockDescription onSaved={updated}/>
   </div>:<>
    <div className="smn-registry-detail-tabs" role="tablist" aria-label={tr("tabs")}>
     {tabs.map((name)=>{
      const text=name==="business"?tr(registryBusinessTabKeys[item.type]!):tr(name);
      return <button key={name} ref={node=>{buttons.current[name]=node;}}
       type="button" role="tab" id={prefix+"-tab-"+name}
       aria-controls={prefix+"-panel-"+name} aria-selected={tab===name}
       tabIndex={tab===name?0:-1} className={"smn-registry-detail-tab"+(tab===name?" active":"")}
       onClick={()=>setTab(name)} onKeyDown={e=>onTabKeyDown(e,name)}>{text}</button>;
     })}
    </div>
    {tabs.map(panel=><div key={panel} className="smn-registry-detail-body" role="tabpanel"
     id={prefix+"-panel-"+panel} aria-labelledby={prefix+"-tab-"+panel}
     tabIndex={tab===panel?0:-1} hidden={tab!==panel}>
     {tab===panel&&<>
     {tab==="summary"&&<RegistrySummary item={item} canManage={canManage}
      onEditDescription={canManage&&Number.isSafeInteger(item.revision)?
       ()=>setDescriptionEditing(true):undefined}/>}
     {tab==="relations"&&<>
      <RegistryRelations id={id} type={item.type} canManage={false}/>
      {(item.type==="risk"||item.type==="obstacle"||item.type==="dependency")&&
       <RegistryCycles id={id} canManage={false}/>}
     </>}
     {tab==="history"&&(!canManage?
      <p role="status" className="alert alert-secondary">{tr("historyRestricted")}</p>:
      canManage&&<RegistryHistory id={id}/>)}
     {tab==="business"&&<>
      {item.type==="risk"&&<>
       <RiskAssessment id={id} canManage={false}/>
       <RiskRoam id={id} canManage={false}/>
       {canManage&&<MaterializeRisk id={id} teamId={teamId} title={item.title}
        description={item.description??""} canManage={canManage}/>}
      </>}
      {item.type==="obstacle"&&<section className="card p-3">
       <h2 className="h5">{tr("obstacle")}</h2>
       <p className="mb-0">{tr("currentState")}: <strong>{label(item.status)}</strong></p>
      </section>}
      {item.type==="dependency"&&<>
       <DependencyParties id={id} canManage={false}/>
       <DependencyVigilance id={id} canManage={false}/>
      </>}
      {item.type==="decision"&&<>
       <DecisionDetail id={id} canManage={false}/>
       {canManage&&<DecisionActions id={id} teamId={teamId} title={item.title}
        description={item.description??""} canManage={canManage}/>}
      </>}
      {item.type==="action"&&<>
       <section className="card p-3">
        <h2 className="h5">{tr("action")}</h2>
        <p className="mb-0">{tr("currentState")}: <strong>{label(item.status)}</strong></p>
        {item.dueOn&&<p className="mb-0">{tr("due")}: <time dateTime={item.dueOn}>{item.dueOn}</time></p>}
       </section>
       <ActionLinks id={id} canManage={false}/>
      </>}
     </>}
     </>}
    </div>)}
    {canManage&&descriptionEditing&&Number.isSafeInteger(item.revision)&&
     <RegistryDescriptionEditor item={item} onSaved={descriptionUpdated}
      onDismiss={()=>setDescriptionEditing(false)}/>}
   </>}
  </>}
 </section>;
}
