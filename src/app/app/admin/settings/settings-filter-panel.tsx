"use client";
import type {ReactNode} from "react";
import {useTranslation} from "@/i18n/client";

/** Shared Cockpit Agile filter toolbar, separate from the data/results panel. */
export default function SettingsFilterPanel({children,className="",title,actions}:{
 children:ReactNode;className?:string;title?:string;actions?:ReactNode;
}){
 const t=useTranslation();
 return <section className={"smn-settings-filter-panel "+className}
  aria-label={title??t("settingsCollections.filtersTitle")}>
  <div className="smn-settings-filter-heading">
   <h2 className="smn-settings-filter-title">
    <i className="bi bi-sliders2" aria-hidden="true"/>
    {title??t("settingsCollections.filtersTitle")}
   </h2>
   {actions&&<div className="smn-settings-filter-actions">{actions}</div>}
  </div>
  <div className="smn-settings-filter-fields">{children}</div>
 </section>;
}
