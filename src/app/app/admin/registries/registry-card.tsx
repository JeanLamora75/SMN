"use client";

import Link from "next/link";
import {useLocale,useTranslation} from "@/i18n/client";
import {formatRegistryDate} from "@/lib/registry-date";
import type {RegistryType} from "@/lib/registry-types";
import BootstrapIcon from "../../bootstrap-icon";
import {registryDetailHref,type RegistryNavigation} from "@/lib/registry-navigation";
import type {RegistryListItem,RegistrySignal} from "./registry-list-row";

const icons={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",
 highlight:"bell-fill"
} as const satisfies Record<RegistryType,string>;

/** Same persisted item and verified SMN-104 signals as the List rendering. */
export default function RegistryCard({item,canManage,signals,highlight=false,navigation,onNavigate,onEdit}:{
 item:RegistryListItem;canManage:boolean;signals:readonly RegistrySignal[];highlight?:boolean;
 navigation:RegistryNavigation;onNavigate:()=>void;onEdit:()=>void;
}){
 const t=useTranslation(),locale=useLocale();
 const tr=(key:string)=>t(("registryList."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const href=registryDetailHref(item.id,navigation);
 return <article data-registry-type={item.type} className={"smn-registry-card"+(highlight?" smn-registry-just-created":"")}>
  <header className="smn-registry-card-head">
   <span className="smn-registry-row-type">
    <span className="smn-registry-row-type-icon" aria-hidden="true">
     <BootstrapIcon name={icons[item.type]}/>
    </span>
    <span>{label(item.type)}</span>
   </span>
   <details className="smn-registry-row-actions">
    <summary className="btn btn-sm btn-outline-secondary"
     aria-label={t("registryList.actionsFor",{title:item.title})}
     title={tr("actions")}>⋯</summary>
    <div className="smn-registry-row-menu">
     <Link className="smn-registry-row-menu-link" href={href} onClick={onNavigate}>{tr("openRecord")}</Link>
     {canManage&&<button type="button" className="smn-registry-row-menu-link w-100 text-start border-0 bg-transparent"
      onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");onEdit();}}>
      {tr("editRecord")}
     </button>}
    </div>
   </details>
  </header>
  <Link href={href} onClick={onNavigate} className="smn-registry-row-title">{item.title}</Link>
  {item.description&&<p className="smn-registry-row-description" title={item.description}>
   {item.description}
  </p>}
  <div className="smn-registry-card-status">
   <span className="smn-registry-row-status badge border text-body-emphasis bg-body-secondary">
    {label(item.status)}
   </span>
   {signals.length>0&&<div className="smn-registry-row-attentions">
    {signals.map(signal=><span className="smn-registry-row-attention" key={signal.reason}>
     <span className="visually-hidden">{tr("attentionLabel")}: </span>
     {t(("registryAttention."+signal.reason) as Parameters<typeof t>[0])}
    </span>)}
   </div>}
  </div>
  <div className="smn-registry-card-meta">
   <span><span className="smn-registry-card-meta-label">{tr("date")}: </span>
    <time dateTime={item.occurredOn}>{formatRegistryDate(item.occurredOn,locale)}</time>
   </span>
   {item.dueOn&&<span><span className="smn-registry-card-meta-label">{tr("due")}: </span>
    <time dateTime={item.dueOn}>{formatRegistryDate(item.dueOn,locale)}</time>
   </span>}
   {canManage&&<span><span className="smn-registry-card-meta-label">{tr("owner")}: </span>
    {item.owner??tr("notProvided")}
   </span>}
  </div>
 </article>;
}
