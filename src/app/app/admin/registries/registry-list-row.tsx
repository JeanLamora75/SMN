"use client";

import Link from "next/link";
import {useLocale,useTranslation} from "@/i18n/client";
import {formatRegistryDate} from "@/lib/registry-date";
import type {RegistryType} from "@/lib/registry-types";
import BootstrapIcon from "../../bootstrap-icon";
import {registryDetailHref,type RegistryNavigation} from "@/lib/registry-navigation";

export type RegistryListItem={
 id:string;type:RegistryType;title:string;description:string|null;
 status:string;occurredOn:string;dueOn:string|null;recordedAt:string;
 owner?:string|null;
};
export type RegistrySignal={
 id:string;reason:"highRisk"|"obstacle"|"atRisk"|"upcoming"|"overdue";
};

// The same Bootstrap Icons are used in the contextual Sprint register.
const icons={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",
 highlight:"bell-fill"
} as const satisfies Record<RegistryType,string>;

export default function RegistryListRow({item,canManage,signals,highlight=false,navigation,onNavigate,onEdit}:{
 item:RegistryListItem;canManage:boolean;signals:readonly RegistrySignal[];highlight?:boolean;
 navigation:RegistryNavigation;onNavigate:()=>void;onEdit:()=>void;
}){
 const t=useTranslation(),locale=useLocale();
 const tr=(key:string)=>t(("registryList."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const href=registryDetailHref(item.id,navigation);
 return <tr data-registry-type={item.type} className={"smn-registry-list-row"+(highlight?" smn-registry-just-created":"")}>
  <td className="smn-registry-cell-date">
   <span className="smn-registry-mobile-label">{tr("date")}: </span>
   <time dateTime={item.occurredOn}>{formatRegistryDate(item.occurredOn,locale)}</time>
  </td>
  <td className="smn-registry-cell-status">
   <span className="smn-registry-mobile-label">{tr("status")}: </span>
   <span className={"smn-registry-row-status badge "+(["open","in_progress","todo","active"].includes(item.status)?"smn-registry-status-active":["resolved","satisfied","completed"].includes(item.status)?"smn-registry-status-resolved":"smn-registry-status-neutral")}>
    {label(item.status)}
   </span>
   {signals.length>0&&<div className="smn-registry-row-attentions">
    {signals.map(signal=><span className="smn-registry-row-attention" key={signal.reason}>
     <span className="visually-hidden">{tr("attentionLabel")}: </span>
     {t(("registryAttention."+signal.reason) as Parameters<typeof t>[0])}
    </span>)}
   </div>}
  </td>
  <td className="smn-registry-cell-type">
   <span className="smn-registry-row-type">
    <span className="smn-registry-row-type-icon" aria-hidden="true">
     <BootstrapIcon name={icons[item.type]}/>
    </span>
    <span>{label(item.type)}</span>
   </span>
  </td>
  <td className="smn-registry-cell-title">
   <Link href={href} onClick={onNavigate} className="smn-registry-row-title">{item.title}</Link>
   {item.description&&<p className="smn-registry-row-description" title={item.description}>
    {item.description}
   </p>}
  </td>
  {canManage&&<td className="smn-registry-cell-owner">
   <span className="smn-registry-mobile-label">{tr("owner")}: </span>
   {item.owner??tr("notProvided")}
  </td>}
  <td className="smn-registry-cell-due">
   {item.dueOn&&<>
    <span className="smn-registry-mobile-label">{tr("due")}: </span>
    <time dateTime={item.dueOn}>{formatRegistryDate(item.dueOn,locale)}</time>
   </>}
  </td>
  <td className="smn-registry-cell-actions">
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
  </td>
 </tr>;
}
