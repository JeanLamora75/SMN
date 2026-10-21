"use client";

import Link from "next/link";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {useTranslation} from "@/i18n/client";
import LogoutControl from "./logout-control";
import PrivateNavigation from "./private-navigation";
import type {PrivateMode,PrivateRole} from "@/lib/private-navigation";

type Props=Readonly<{
  children:ReactNode;
  username:string;
  role:PrivateRole;
  mode:PrivateMode|null;
  product:string|null;
  team:string|null;
  teamId:string|null;
}>;

/** Coquille privée partagée : un contexte réel, aucune sélection de cycle simulée. */
export default function PrivateShell({children,username,role,mode,product,team,teamId}:Props){
  const t=useTranslation();
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const mobileButton=useRef<HTMLButtonElement>(null);
  const sidebar=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!mobileOpen)return;
    sidebar.current?.querySelector<HTMLElement>("a[href],button:not([disabled])")?.focus();
    const escape=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        setMobileOpen(false);
        mobileButton.current?.focus();
      }
    };
    document.addEventListener("keydown",escape);
    return ()=>document.removeEventListener("keydown",escape);
  },[mobileOpen]);

  const cycleLabel=mode==="kanban"?"dashboard.shell.period":"dashboard.shell.sprint";
  return <div className={`smn-dashboard smn-private-layout${collapsed?" is-collapsed":""}${mobileOpen?" mobile-open":""}`}>
    <header className="smn-dashboard-topbar">
      <div className="smn-private-header">
        <div className="smn-header-brand">
          <button type="button" className="btn smn-menu-toggle smn-desktop-toggle"
            aria-label={t(collapsed?"dashboard.shell.expandMenu":"dashboard.shell.collapseMenu")}
            aria-controls="smn-private-sidebar" aria-expanded={!collapsed}
            onClick={()=>setCollapsed(value=>!value)}>
            <span className="smn-menu-bars" aria-hidden="true"><i/><i/><i/></span>
          </button>
          <button ref={mobileButton} type="button" className="btn smn-menu-toggle smn-mobile-toggle"
            aria-label={t(mobileOpen?"dashboard.shell.closeMenu":"dashboard.shell.openMenu")}
            aria-controls="smn-private-sidebar" aria-expanded={mobileOpen}
            onClick={()=>setMobileOpen(value=>!value)}>
            <span className="smn-menu-bars" aria-hidden="true"><i/><i/><i/></span>
          </button>
          <Link href="/app" className="smn-brand" aria-label={t("dashboard.back")}>
            <span className="smn-mark" aria-hidden="true">SMN</span>
            <span className="smn-brand-name">Scrum Master <strong>Notebook</strong></span>
          </Link>
        </div>
        <div className="smn-header-controls" role="group" aria-label={t("dashboard.shell.contextControls")}>
          <div className="smn-header-field smn-header-team">
            <label htmlFor="smn-current-team">{t("dashboard.shell.team")}</label>
            <select id="smn-current-team" className="form-select form-select-sm"
              value={teamId??""} disabled title={t("dashboard.shell.singleTeam")}>
              <option value={teamId??""}>{team??t("dashboard.shell.noTeam")}</option>
            </select>
          </div>
          <div className="smn-header-field smn-header-cycle">
            <label htmlFor="smn-current-cycle">{t(cycleLabel)}</label>
            <select id="smn-current-cycle" className="form-select form-select-sm"
              value="" disabled title={t("dashboard.shell.noCycle")}>
              <option value="">{t("dashboard.shell.noCycle")}</option>
            </select>
          </div>
          <div className="smn-header-field smn-header-search">
            <label htmlFor="smn-global-search">{t("dashboard.shell.search")}</label>
            <input id="smn-global-search" type="search" className="form-control form-control-sm"
              disabled placeholder={t("dashboard.shell.searchUnavailable")}
              title={t("dashboard.shell.searchUnavailable")}/>
          </div>
        </div>
        <div className="smn-header-account">
          <span className="smn-account-pill">
            <span className="smn-account-dot" aria-hidden="true"/>
            <span className="smn-account-name">{username}</span>
            <span className="visually-hidden">{t("dashboard.connected",{username})}</span>
          </span>
          <LogoutControl/>
        </div>
      </div>
    </header>
    <div className="smn-shell-content">
      <div ref={sidebar} className="smn-sidebar-region" id="smn-private-sidebar">
        <PrivateNavigation mode={mode} role={role} product={product} team={team}
          onNavigate={()=>setMobileOpen(false)}/>
      </div>
      <main id="smn-main" className="smn-private-main pb-5">{children}</main>
    </div>
  </div>;
}
