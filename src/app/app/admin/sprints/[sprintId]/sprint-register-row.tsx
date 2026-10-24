"use client";

import {useEffect,useId,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import type {SprintRegister,RegisterKind} from "@/lib/sprint-registers";
import {safeRegisterHref} from "@/lib/sprint-registers";
import RegistryCreate from "../../registries/registry-create";
import BootstrapIcon from "../../../bootstrap-icon";

const icons:Record<RegisterKind,
 "exclamation-octagon-fill"|"exclamation-triangle-fill"|"stack"|
 "bullseye"|"ticket-perforated-fill"|"bell-fill">={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",
 highlight:"bell-fill"
};

type Props={
 item:SprintRegister;teamId:string;canManage:boolean;historical:boolean;
 typeLabel:string;statusLabel:string|null;priorityLabel:string|null;
 dateLabel:string;formattedDate:string;
};

/** Same full registry editor as the dedicated record page. Automatic highlights
 * and frozen snapshots are never passed to RegistryCreate as fictitious items. */
export default function SprintRegisterRow({
 item,teamId,canManage,historical,typeLabel,statusLabel,priorityLabel,
 dateLabel,formattedDate
}:Props){
 const t=useTranslation(),router=useRouter(),dialogId=useId();
 const dialog=useRef<HTMLDialogElement>(null);
 const [opened,setOpened]=useState(false);
 const href=safeRegisterHref(item.href);
 const recordHref="/app/admin/registries/"+encodeURIComponent(item.id);
 const hasPersistedRecord=!historical&&href===recordHref;
 const writable=hasPersistedRecord&&canManage;
 useEffect(()=>{
  if(opened&&dialog.current&&!dialog.current.open)dialog.current.showModal();
 },[opened]);
 const close=()=>dialog.current?.close();
 const saved=()=>{close();router.refresh();};
 return <li className={"list-group-item bg-transparent smn-sprint-register-row smn-sprint-register-"+item.kind}>
  <span className={"smn-sprint-register-icon smn-sprint-register-icon-"+item.kind}
   aria-hidden="true"><BootstrapIcon name={icons[item.kind]}/></span>
  <div className="smn-sprint-register-fields">
   <span className="smn-sprint-register-kind">{typeLabel}</span>
   <span className="smn-sprint-register-status">
    {statusLabel&&<span className="badge text-bg-secondary">{statusLabel}</span>}
   </span>
   <button type="button" className="smn-sprint-register-title"
    onClick={()=>setOpened(true)} aria-haspopup="dialog">{item.title}</button>
   <span className="smn-sprint-register-priority">
    {priorityLabel&&<span className="badge text-bg-light border">{priorityLabel}</span>}
   </span>
   <time className="smn-sprint-register-date" dateTime={item.date}
    title={dateLabel}>{formattedDate}</time>
   <span className="smn-sprint-register-action">
    {writable&&<button className="smn-sprint-register-edit" type="button"
     onClick={()=>setOpened(true)} aria-haspopup="dialog"
     aria-label={t("sprintDetail.registersEditRecord")+": "+item.title}
     title={t("sprintDetail.registersEditRecord")+": "+item.title}>
     <BootstrapIcon name="pencil-square"/>
    </button>}
   </span>
  </div>
  {opened&&typeof document!=="undefined"&&createPortal(
   <dialog ref={dialog} className="smn-operational-create-dialog"
    aria-labelledby={dialogId} onClose={()=>setOpened(false)}>
    <div className="smn-operational-create-dialog-inner">
     <header className="d-flex justify-content-between align-items-center gap-3 mb-3">
      <h2 id={dialogId} className="h5 mb-0">
       {t(writable?"sprintDetail.registersEditRecord":
        "sprintDetail.registersReadRecord")}: {item.title}
      </h2>
      <button type="button" className="btn-close"
       aria-label={t("dashboard.operational.quickAdd.close")} onClick={close}/>
     </header>
     {hasPersistedRecord?
      <RegistryCreate itemId={item.id} teamId={teamId}
       canManage={canManage} modalMode onSaved={saved}/>:
      <div className="d-grid gap-2">
       <p className="small text-secondary mb-1">
        {t(historical?"sprintDetail.registersHistoricalLinkUnavailable":
         "sprintDetail.registersNoLink")}
       </p>
       <dl className="row small mb-0">
        <dt className="col-sm-4">{t("sprintDetail.registersCategories")}</dt>
        <dd className="col-sm-8">{typeLabel}</dd>
        {statusLabel&&<><dt className="col-sm-4">{t("registryCreate.status")}</dt>
         <dd className="col-sm-8">{statusLabel}</dd></>}
        {priorityLabel&&<><dt className="col-sm-4">{t("dashboard.operational.priority")}</dt>
         <dd className="col-sm-8">{priorityLabel}</dd></>}
        <dt className="col-sm-4">{dateLabel}</dt>
        <dd className="col-sm-8"><time dateTime={item.date}>{formattedDate}</time></dd>
       </dl>
      </div>}
     <div className="d-flex justify-content-end mt-3">
      <button type="button" className="btn btn-outline-secondary"
       onClick={close}>{t("dashboard.operational.quickAdd.cancel")}</button>
     </div>
    </div>
   </dialog>,document.body)}
 </li>;
}
