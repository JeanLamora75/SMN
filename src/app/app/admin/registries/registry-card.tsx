"use client";

import Link from "next/link";
import {useTranslation} from "@/i18n/client";
import type {RegistryType} from "@/lib/registry-types";
import BootstrapIcon from "../../bootstrap-icon";
import type {RegistryListItem,RegistrySignal} from "./registry-list-row";

const icons={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",
 highlight:"bell-fill"
} as const satisfies Record<RegistryType,string>;

/** Same persisted item and verified SMN-104 signals as the List rendering. */
export default function RegistryCard({item,canManage,signals,highlight=false}:{
 item:RegistryListItem;canManage:boolean;signals:readonly RegistrySignal[];highlight?:boolean;
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("registryList."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const href="/app/admin/registries/"+encodeURIComponent(item.id);
 return <article className={"smn-registry-card"+(highlight?" smn-registry-just-created":"")}>
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
     <Link className="smn-registry-row-menu-link" href={href}>{tr("openRecord")}</Link>
     {canManage&&<Link className="smn-registry-row-menu-link" href={href}>
      {tr("editRecord")}
     </Link>}
    </div>
   </details>
  </header>
  <Link href={href} className="smn-registry-row-title">{item.title}</Link>
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
    <time dateTime={item.occurredOn}>{item.occurredOn}</time>
   </span>
   {item.dueOn&&<span><span className="smn-registry-card-meta-label">{tr("due")}: </span>
    <time dateTime={item.dueOn}>{item.dueOn}</time>
   </span>}
   {canManage&&<span><span className="smn-registry-card-meta-label">{tr("owner")}: </span>
    {item.owner??tr("notProvided")}
   </span>}
  </div>
 </article>;
}
