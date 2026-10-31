"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation,useLocale} from "@/i18n/client";
import {parseSummaryCycles,parseSummaryRelations,validRegistryActivityTime,
 type SummaryRelation,type SummaryCycle,type SummaryContext} from "@/lib/registry-summary-context";
import BootstrapIcon from "../../bootstrap-icon";
import {registryDetailHref,type RegistryNavigation} from "@/lib/registry-navigation";

export type RegistrySummaryItem={
 id:string;type:string;title:string;description:string|null;
 comment?:string|null;revision?:number;
 createdAt?:string;updatedAt?:string;
};
type Props={item:RegistrySummaryItem;teamId:string;canManage:boolean;
 navigation:RegistryNavigation;onEditDescription?:()=>void};
const initialRelations:SummaryContext<SummaryRelation>={state:"loading"};
const initialCycles:SummaryContext<SummaryCycle>={state:"loading"};

export default function RegistrySummary({item,teamId,canManage,navigation,onEditDescription}:Props){
 const t=useTranslation(),locale=useLocale(),tr=(key:string)=>t(("registrySummary."+key) as Parameters<typeof t>[0]);
 const [relations,setRelations]=useState<SummaryContext<SummaryRelation>>(initialRelations);
 const [cycles,setCycles]=useState<SummaryContext<SummaryCycle>>(initialCycles);
 const [reload,setReload]=useState(0);
 const cyclesApplicable=item.type==="risk"||item.type==="obstacle"||item.type==="dependency";
 useEffect(()=>{
  const controller=new AbortController();
  const url="/api/admin/registries/"+encodeURIComponent(item.id)+"/relations";
  void fetch(url,{cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error("relations-unavailable");
    const parsed=parseSummaryRelations(await response.json() as unknown,item.id);
    if(parsed===null)throw Error("relations-invalid");
    return parsed;
   }).then(result=>{if(!controller.signal.aborted)setRelations({state:"ready",items:result});})
   .catch(()=>{if(!controller.signal.aborted)setRelations({state:"unavailable"});});
  return()=>controller.abort();
 },[item.id,reload]);
 useEffect(()=>{
  if(!cyclesApplicable)return;
  const controller=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(item.id)+"/cycles",{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("cycles-unavailable");
   const parsed=parseSummaryCycles(await response.json() as unknown);
   if(parsed===null)throw Error("cycles-invalid");
   return parsed;
  }).then(result=>{if(!controller.signal.aborted)setCycles({state:"ready",items:result});})
   .catch(()=>{if(!controller.signal.aborted)setCycles({state:"unavailable"});});
  return()=>controller.abort();
 },[item.id,cyclesApplicable,reload]);
 const reloadContext=()=>{
  setRelations(initialRelations);setCycles(initialCycles);
  setReload(n=>n+1);
 };
 const dateTime=new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"
 });
 const created=canManage?validRegistryActivityTime(item.createdAt):null;
 const updated=canManage&&typeof item.revision==="number"&&item.revision>1?
  validRegistryActivityTime(item.updatedAt):null;
 const displayDate=(iso:string)=>dateTime.format(new Date(iso));
 const linkedRecord=(relation:SummaryRelation):{id:string;title:string}|null=>
  relation.sourceId===item.id?
   relation.targetKind==="record"?{id:relation.targetId,title:relation.targetTitle}:null:
   {id:relation.sourceId,title:relation.sourceTitle};
 return <div className="smn-registry-summary-grid" aria-label={tr("heading")}>
  <div className="smn-registry-summary-main">
   <section className="smn-registry-summary-panel" aria-labelledby="registry-summary-description-title">
    <header className="smn-registry-summary-panel-head">
     <h2 className="h5 mb-0" id="registry-summary-description-title">{tr("description")}</h2>
     {canManage&&onEditDescription&&<button type="button" className="btn btn-outline-secondary btn-sm"
      onClick={onEditDescription} aria-label={tr("editDescription")}>
      <BootstrapIcon name="pencil-square"/>
     </button>}
    </header>
    {item.description?<p className="smn-registry-detail-description">{item.description}</p>:
     <p className="text-body-secondary mb-0">{tr("noDescription")}</p>}
   </section>
   <section className="smn-registry-summary-panel" aria-labelledby="registry-summary-journal-title">
    <h2 className="h5" id="registry-summary-journal-title">{tr("journal")}</h2>
    <RegistryJournal key={item.id} itemId={item.id} itemTitle={item.title}
     teamId={teamId} canManage={canManage} navigation={navigation}/>
   </section>
  </div>
  <aside className="smn-registry-summary-side" aria-label={tr("context")}>
   <section className="smn-registry-summary-panel">
    <h2 className="h6">{tr("cycles")}</h2>
    {!cyclesApplicable?<p className="text-body-secondary small mb-0">{tr("cyclesUnsupported")}</p>:
     cycles.state==="loading"?<p role="status" className="small mb-0">{tr("loading")}</p>:
     cycles.state==="unavailable"?<div role="alert" className="small">{tr("unavailable")}{" "}
      <button type="button" className="btn btn-sm btn-outline-secondary"
       onClick={reloadContext}>{tr("retry")}</button></div>:
     cycles.items.length===0?<p className="text-body-secondary small mb-0">{tr("noCycles")}</p>:
     <ul className="smn-registry-summary-links">{cycles.items.map(c=><li key={c.id}>
      {c.name}
     </li>)}</ul>}
   </section>
   <section className="smn-registry-summary-panel">
    <h2 className="h6">{tr("related")}</h2>
    {relations.state==="loading"?<p role="status" className="small mb-0">{tr("loading")}</p>:
     relations.state==="unavailable"?<div role="alert" className="small">{tr("unavailable")}{" "}
      <button type="button" className="btn btn-sm btn-outline-secondary"
       onClick={reloadContext}>{tr("retry")}</button></div>:
     relations.items.length===0?<p className="text-body-secondary small mb-0">{tr("noRelations")}</p>:
     <ul className="smn-registry-summary-links">{relations.items.map(r=>{
      const record=linkedRecord(r);
      return <li key={r.id}>{record?
       <Link href={registryDetailHref(record.id,navigation)}>{record.title}</Link>:
       <span>{tr("goal")}: {r.targetTitle}</span>}</li>;
     })}</ul>}
   </section>
   <section className="smn-registry-summary-panel">
    <h2 className="h6">{tr("recentActivity")}</h2>
    {!canManage?<p className="small text-body-secondary mb-0">{tr("activityRestricted")}</p>:
     !created&&!updated?<p className="small text-body-secondary mb-0">{tr("activityUnavailable")}</p>:
     <ul className="smn-registry-summary-activity">
      {updated&&<li><span>{tr("lastUpdated")}</span>
       <time dateTime={updated}>{displayDate(updated)}</time></li>}
      {created&&<li><span>{tr("created")}</span>
       <time dateTime={created}>{displayDate(created)}</time></li>}
     </ul>}
   </section>
  </aside>
 </div>;
}
