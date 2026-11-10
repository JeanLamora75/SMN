"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {filterSettingsGroups} from "@/lib/settings-catalog-search";
import type {SettingsGroup} from "@/lib/settings-catalog";
import BootstrapIcon from "../../bootstrap-icon";

type View="cards"|"list";
/** Separate from the team roster preference. */
export const SETTINGS_VIEW_STORAGE_KEY="smn-settings-catalog-view";
export function normalizeSettingsView(value:string|null):View{
 return value==="list"?"list":"cards";
}
export default function SettingsCatalogView({groups}:{groups:SettingsGroup[]}){
 const t=useTranslation();
 const [view,setView]=useState<View>("cards");
 const [query,setQuery]=useState("");
 useEffect(()=>{
  void Promise.resolve().then(()=>{
   try{setView(normalizeSettingsView(window.localStorage.getItem(SETTINGS_VIEW_STORAGE_KEY)));}
   catch{setView("cards");}
  });
 },[]);
 const filtered=useMemo(()=>filterSettingsGroups(groups,query,t),[groups,query,t]);
 const matches=filtered.reduce((sum,group)=>sum+group.entries.length,0);
 function choose(next:View){
  setView(next);
  try{window.localStorage.setItem(SETTINGS_VIEW_STORAGE_KEY,next);}catch{/* private mode */}
 }
 return <div className="smn-settings-catalog">
  <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
   <div className="flex-grow-1" style={{maxWidth:600,minWidth:240}}>
    <label className="form-label fw-semibold" htmlFor="smn-settings-search">
     {t("settingsCatalog.search.label")}
    </label>
    <div className="input-group">
     <span className="input-group-text" aria-hidden="true"><BootstrapIcon name="search"/></span>
     <input id="smn-settings-search" type="search" className="form-control"
      placeholder={t("settingsCatalog.search.placeholder")} value={query}
      onChange={event=>setQuery(event.target.value)}
      onKeyDown={event=>{if(event.key==="Escape"&&query)setQuery("");}}/>
     {query&&<button type="button" className="btn btn-outline-secondary"
      aria-label={t("settingsCatalog.search.clear")} onClick={()=>setQuery("")}>
      {t("settingsCatalog.search.clear")}
     </button>}
    </div>
   </div>
   <div className="btn-group" role="group" aria-label={t("settingsCatalog.view.switchLabel")}>
    <button type="button" className={"btn "+(view==="cards"?"btn-primary":"btn-outline-secondary")}
     aria-label={t("settingsCatalog.view.cards")} aria-pressed={view==="cards"}
     title={t("settingsCatalog.view.cards")} onClick={()=>choose("cards")}>
     <BootstrapIcon name="grid-3x3-gap"/>
    </button>
    <button type="button" className={"btn "+(view==="list"?"btn-primary":"btn-outline-secondary")}
     aria-label={t("settingsCatalog.view.list")} aria-pressed={view==="list"}
     title={t("settingsCatalog.view.list")} onClick={()=>choose("list")}>
     <BootstrapIcon name="list-ul"/>
    </button>
   </div>
  </div>
  {query.trim()!==""&&<p className="small text-secondary mb-3" role="status" aria-live="polite">
   {t("settingsCatalog.search.results",{count:matches})}
  </p>}
  {query.trim()!==""&&matches===0&&<div className="smn-panel rounded-4 p-4">
   <p className="mb-2">{t("settingsCatalog.search.empty")}</p>
   <button className="btn btn-outline-primary btn-sm" type="button" onClick={()=>setQuery("")}>
    {t("settingsCatalog.search.reset")}
   </button>
  </div>}
  {filtered.map(group=><section key={group.id} className="mb-4"
   aria-labelledby={"settings-group-"+group.id}>
   <h2 className="h5 mb-3" id={"settings-group-"+group.id}>{t(group.label)}</h2>
   <div className={view==="cards"?"row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3":"d-grid gap-2"}>
    {group.entries.map(entry=>{
     const label=t(entry.label),description=t(entry.description);
     const status=t(({
      available:"settingsCatalog.status.available",
      partial:"settingsCatalog.status.partial",
      planned:"settingsCatalog.status.planned",
      "not-applicable":"settingsCatalog.status.not-applicable"
     } as const)[entry.status]);
     const body=<>
      <span className="fs-4 flex-shrink-0" aria-hidden="true"><BootstrapIcon name={entry.icon}/></span>
      <span className={"d-flex flex-wrap align-items-start gap-2 flex-grow-1"+(view==="cards"?" flex-column":"")}>
       <span className="fw-semibold">{label}</span>
       <span className={"text-secondary small "+(view==="cards"?"w-100":"flex-grow-1")}>{description}</span>
       <span className="small text-secondary">{status}</span>
      </span>
      {view==="list"&&entry.href&&<span aria-hidden="true" className="ms-auto">
       <BootstrapIcon name="arrow-right"/>
      </span>}
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
 </div>;
}
