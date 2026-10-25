"use client";

import Link from "next/link";
import {useEffect,useId,useRef,useState,type KeyboardEvent,type ReactNode} from "react";
import {useTranslation} from "@/i18n/client";
import {registryStatuses,registryTypes,type RegistryType} from "@/lib/registry-types";
import {registryDetailTabs,registryBusinessTabKeys,type RegistryDetailTab} from "@/lib/registry-detail-tabs";
import BootstrapIcon from "../../bootstrap-icon";
import RegistrySectionDialog from "./registry-section-dialog";
import RegistryCoreEditor,{type RegistryCoreSection} from "./registry-core-editor";
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

type BusinessSection="riskAssessment"|"riskRoam"|"dependencyParties"|"dependencyVigilance"|
 "decisionDetail"|"registryRelations"|"registryCycles"|"actionLinks";
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
 const [coreEditing,setCoreEditing]=useState<RegistryCoreSection|null>(null);
 const [businessEditing,setBusinessEditing]=useState<BusinessSection|null>(null);
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
 const coreUpdated=()=>{setCoreEditing(null);retry();};
 const businessUpdated=()=>{setBusinessEditing(null);retry();};
 const descriptionUpdated=()=>{setDescriptionEditing(false);retry();};
 const sectionView=(section:BusinessSection,name:string,content:ReactNode)=><div
  className="smn-registry-business-section" key={section}>
  {canManage&&<div className="smn-registry-business-edit-bar">
   <button type="button" className="btn btn-sm btn-outline-secondary"
    aria-label={t("registryEdit.editNamed",{name})}
    onClick={()=>setBusinessEditing(section)}>
    <BootstrapIcon name="pencil-square"/><span>{t("registryEdit.edit")}</span>
   </button>
  </div>}
  {content}
 </div>;
 const businessEditor=()=>{
  switch(businessEditing){
   case "riskAssessment":return <RiskAssessment id={id} canManage={true} onSaved={businessUpdated}/>;
   case "riskRoam":return <RiskRoam id={id} canManage={true} onSaved={businessUpdated}/>;
   case "dependencyParties":return <DependencyParties id={id} canManage={true} onSaved={businessUpdated}/>;
   case "dependencyVigilance":return <DependencyVigilance id={id} canManage={true} onSaved={businessUpdated}/>;
   case "decisionDetail":return <DecisionDetail id={id} canManage={true} onSaved={businessUpdated}/>;
   case "registryRelations":return <RegistryRelations id={id} type={item?.type??"risk"}
    canManage={true} onSaved={businessUpdated}/>;
   case "registryCycles":return <RegistryCycles id={id} canManage={true} onSaved={businessUpdated}/>;
   case "actionLinks":return <ActionLinks id={id} canManage={true} onSaved={businessUpdated}/>;
   default:return null;
  }
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
     <div className="smn-registry-detail-heading-row">
      <h1>{item.title}</h1>
      {canManage&&<button type="button" className="btn btn-sm btn-outline-secondary"
       aria-label={t("registryEdit.editNamed",{name:t("registryEdit.general")})}
       onClick={()=>setCoreEditing("general")}>
       <BootstrapIcon name="pencil-square"/>
      </button>}
     </div>
     <div className="smn-registry-detail-meta">
      <span className="badge bg-body-secondary text-body-emphasis border">{label(item.status)}</span>
      {canManage&&<button type="button" className="btn btn-sm btn-outline-secondary"
       aria-label={t("registryEdit.editNamed",{name:t("registryEdit.status")})}
       onClick={()=>setCoreEditing("status")}>
       <BootstrapIcon name="pencil-square"/>
      </button>}
      <span>{tr("businessDate")}: <time dateTime={item.occurredOn}>{item.occurredOn}</time></span>
      {item.dueOn&&<span>{tr("due")}: <time dateTime={item.dueOn}>{item.dueOn}</time></span>}
      {canManage&&item.owner&&<span>{tr("owner")}: {item.owner}</span>}
     </div>
    </div>
    {!canManage&&<span className="small text-body-secondary">{tr("readOnly")}</span>}
   </header>
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
     {tab==="summary"&&<RegistrySummary key={item.id} item={item} canManage={canManage}
      onEditDescription={canManage&&typeof item.revision==="number"&&Number.isSafeInteger(item.revision)?
       ()=>setDescriptionEditing(true):undefined}/>}
     {tab==="relations"&&<>
      {sectionView("registryRelations",t("registryRelations.heading"),
       <RegistryRelations id={id} type={item.type} canManage={false}/>)}
      {(item.type==="risk"||item.type==="obstacle"||item.type==="dependency")&&
       sectionView("registryCycles",t("registryCycles.heading"),
        <RegistryCycles id={id} canManage={false}/>)}
     </>}
     {tab==="history"&&(!canManage?
      <p role="status" className="alert alert-secondary">{tr("historyRestricted")}</p>:
      canManage&&<RegistryHistory id={id}/>)}
     {tab==="business"&&<>
      {item.type==="risk"&&<>
       {sectionView("riskAssessment",t("registryAssessment.heading"),
        <RiskAssessment id={id} canManage={false}/>)}
       {sectionView("riskRoam",t("registryRoam.heading"),
        <RiskRoam id={id} canManage={false}/>)}
       {canManage&&<MaterializeRisk id={id} teamId={teamId} title={item.title}
        description={item.description??""} canManage={canManage}/>}
      </>}
      {item.type==="obstacle"&&<section className="card p-3">
       <h2 className="h5">{tr("obstacle")}</h2>
       <p className="mb-0">{tr("currentState")}: <strong>{label(item.status)}</strong></p>
      </section>}
      {item.type==="dependency"&&<>
       {sectionView("dependencyParties",t("dependencyParties.heading"),
        <DependencyParties id={id} canManage={false}/>)}
       {sectionView("dependencyVigilance",t("dependencyVigilance.heading"),
        <DependencyVigilance id={id} canManage={false}/>)}
      </>}
      {item.type==="decision"&&<>
       {sectionView("decisionDetail",t("decisionDetail.heading"),
        <DecisionDetail id={id} canManage={false}/>)}
       {canManage&&<DecisionActions id={id} teamId={teamId} title={item.title}
        description={item.description??""} canManage={canManage}/>}
      </>}
      {item.type==="action"&&<>
       <section className="card p-3">
        <h2 className="h5">{tr("action")}</h2>
        <p className="mb-0">{tr("currentState")}: <strong>{label(item.status)}</strong></p>
        {item.dueOn&&<p className="mb-0">{tr("due")}: <time dateTime={item.dueOn}>{item.dueOn}</time></p>}
       </section>
       {sectionView("actionLinks",t("actionLinks.heading"),
        <ActionLinks id={id} canManage={false}/>)}
      </>}
     </>}
     </>}
    </div>)}
    {canManage&&descriptionEditing&&typeof item.revision==="number"&&
     Number.isSafeInteger(item.revision)&&
     <RegistryDescriptionEditor item={item} onSaved={descriptionUpdated}
      onDismiss={()=>setDescriptionEditing(false)}/>}
    {canManage&&coreEditing&&typeof item.revision==="number"&&
     Number.isSafeInteger(item.revision)&&
     <RegistrySectionDialog title={t(("registryEdit."+coreEditing) as Parameters<typeof t>[0])}
      onDismiss={()=>setCoreEditing(null)}>
      <RegistryCoreEditor item={item} section={coreEditing} onSaved={coreUpdated}/>
     </RegistrySectionDialog>}
    {canManage&&businessEditing&&<RegistrySectionDialog
     title={t(("registryEdit."+businessEditing) as Parameters<typeof t>[0])}
     onDismiss={()=>setBusinessEditing(null)}>
      {businessEditor()}
     </RegistrySectionDialog>}
  </>}
 </section>;
}
