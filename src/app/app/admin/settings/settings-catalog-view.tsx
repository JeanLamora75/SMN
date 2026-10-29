"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {SettingsGroup} from "@/lib/settings-catalog";

type View="cards"|"list";
/** Page-specific choice: independent from smn-team-roster-view. */
export const SETTINGS_VIEW_STORAGE_KEY="smn-settings-catalog-view";
export function normalizeSettingsView(value:string|null):View{
 return value==="list"?"list":"cards";
}
export default function SettingsCatalogView({groups,showCompanies=false}:{groups:SettingsGroup[];showCompanies?:boolean}){
 const t=useTranslation();
 const [view,setView]=useState<View>("cards");
 useEffect(()=>{
  void Promise.resolve().then(()=>{
   try{setView(normalizeSettingsView(window.localStorage.getItem(SETTINGS_VIEW_STORAGE_KEY)));}
   catch{setView("cards");}
  });
 },[]);
 function choose(next:View){
  setView(next);
  try{window.localStorage.setItem(SETTINGS_VIEW_STORAGE_KEY,next);}catch{/* private mode */}
 }
 return <>
  <div className="d-flex justify-content-end mb-4">
   <div className="btn-group" role="group" aria-label={t("settingsCatalog.view.switchLabel")}>
    <button type="button" className={"btn "+(view==="cards"?"btn-primary":"btn-outline-secondary")}
     aria-label={t("settingsCatalog.view.cards")} aria-pressed={view==="cards"} title={t("settingsCatalog.view.cards")}
     onClick={()=>choose("cards")}><span aria-hidden="true">▦</span></button>
    <button type="button" className={"btn "+(view==="list"?"btn-primary":"btn-outline-secondary")}
     aria-label={t("settingsCatalog.view.list")} aria-pressed={view==="list"} title={t("settingsCatalog.view.list")}
     onClick={()=>choose("list")}><span aria-hidden="true">☷</span></button>
   </div>
  </div>
  {showCompanies&&<section className="mb-4" aria-labelledby="smn-settings-companies-title">
   <h2 className="h5 mb-3" id="smn-settings-companies-title">Entreprises</h2>
   <div className={view==="cards"?"row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3":"d-grid gap-2"}>
    {[
     {id:"companies",href:"/app/admin/companies",icon:"▤",title:"Gestion des entreprises",
      description:"Consulter et gérer les entreprises de l’organisation."},
     {id:"closures",href:"/app/admin/company-closures",icon:"▦",title:"Fermetures d’entreprise",
      description:"Consulter et gérer les périodes de fermeture des entreprises."}
    ].map(entry=><div key={entry.id} className={view==="cards"?"col":""}>
     <Link href={entry.href}
      className="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start text-body text-decoration-none smn-settings-entry-link"
      aria-label={entry.title}>
      <span className="fs-4 flex-shrink-0" aria-hidden="true">{entry.icon}</span>
      <span className={"d-flex flex-wrap align-items-start gap-2 flex-grow-1"+(view==="cards"?" flex-column":"")}>
       <span className="fw-semibold">{entry.title}</span>
       <span className={"text-secondary small "+(view==="cards"?"w-100":"flex-grow-1")}>{entry.description}</span>
       <span className="small text-secondary">Disponible</span>
      </span>
      {view==="list"&&<span aria-hidden="true" className="ms-auto">›</span>}
     </Link>
    </div>)}
   </div>
  </section>}
  {groups.map(group=><section key={group.id} className="mb-4" aria-labelledby={"settings-group-"+group.id}>
   <h2 className="h5 mb-3" id={"settings-group-"+group.id}>{t(group.label)}</h2>
   <div className={view==="cards"?"row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3":"d-grid gap-2"}>
    {group.entries.map(entry=>{
     const label=t(entry.label);
     const description=t(entry.description);
     const status=t(({
      available:"settingsCatalog.status.available",
      partial:"settingsCatalog.status.partial",
      planned:"settingsCatalog.status.planned",
      "not-applicable":"settingsCatalog.status.not-applicable"
     } as const)[entry.status]);
     const body=<>
      <span className="fs-4 flex-shrink-0" aria-hidden="true">{entry.icon}</span>
      <span className={"d-flex flex-wrap align-items-start gap-2 flex-grow-1"+(view==="cards"?" flex-column":"")}>
       <span className="fw-semibold">{label}</span>
       <span className={"text-secondary small "+(view==="cards"?"w-100":"flex-grow-1")}>{description}</span>
       <span className="small text-secondary">{status}</span>
      </span>
      {view==="list"&&entry.href&&<span aria-hidden="true" className="ms-auto">›</span>}
     </>;
     const classes="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start text-body"+
      (entry.href?" text-decoration-none smn-settings-entry-link":" opacity-50 bg-body-tertiary");
     return <div className={view==="cards"?"col":""} key={entry.id}>
      {entry.href?<Link href={entry.href} className={classes} aria-label={label}>{body}</Link>:
       <div className={classes}>{body}</div>}
     </div>;
    })}
   </div>
  </section>)}
 </>;
}
