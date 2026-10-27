"use client";

import Link from "next/link";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import type {SprintContextItem} from "@/lib/sprint-context";
type CycleChoice=Pick<SprintContextItem,"id"|"name">;
import {useEffect,useRef,useState,type ReactNode} from "react";
import {useTranslation} from "@/i18n/client";
import LogoutControl from "./logout-control";
import ActiveTeamSelector from "./active-team-selector";
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
  teamSwitcherEnabled:boolean;
}>;

/** Coquille privée partagée : un contexte réel, aucune sélection de cycle simulée. */
export default function PrivateShell({children,username,role,mode,product,team,teamId,teamSwitcherEnabled}:Props){
  const t=useTranslation();
  const pathname=usePathname(),router=useRouter(),searchParams=useSearchParams();
  const requestedCycleId=pathname==="/app"?searchParams.get("cycleId"):null;
  const [sprints,setSprints]=useState<CycleChoice[]>([]);
  const [selectedCycleId,setSelectedCycleId]=useState("");
  const [cycleState,setCycleState]=useState<"loading"|"ready"|"error">("loading");
  // Une navigation vers la liste puis une nouvelle génération recharge les options.
  // La liste est fournie par le serveur, sans pagination ni écriture en base.
  useEffect(()=>{
    const ctrl=new AbortController();
    if(!teamId||(mode!=="scrum"&&!(mode==="kanban"&&teamSwitcherEnabled))){
      queueMicrotask(()=>{
        if(ctrl.signal.aborted)return;
        setSprints([]);setSelectedCycleId("");setCycleState("ready");
      });
      return ()=>ctrl.abort();
    }
    queueMicrotask(()=>{if(!ctrl.signal.aborted)setCycleState("loading");});
    const endpoint=teamSwitcherEnabled?"/api/admin/team-cycles/list":
      mode==="kanban"?"/api/kanban/context":"/api/sprints/context";
    const suffix=teamSwitcherEnabled?"?"+new URLSearchParams({teamId,
      ...(mode==="scrum"?{pageSize:"50"}:{})}).toString():"";
    void fetch(endpoint+suffix,{signal:ctrl.signal,cache:"no-store"})
      .then(async response=>{
        if(!response.ok)throw Error("sprint-context-unavailable");
        return response.json() as Promise<{
          items:CycleChoice[];defaultCycleId?:string|null;teamId?:string;mode?:string
        }>;
      })
      .then(result=>{
        if(ctrl.signal.aborted)return;
        if(!Array.isArray(result.items)||
          (teamSwitcherEnabled&&(result.teamId!==teamId||result.mode!==mode)))
          throw Error("sprint-context-invalid");
        setSprints(result.items);
        setSelectedCycleId(previous=>{
          if(requestedCycleId&&result.items.some(item=>item.id===requestedCycleId))
            return requestedCycleId;
          if(pathname==="/app")return result.defaultCycleId??result.items[0]?.id??"";
          if(previous&&result.items.some(item=>item.id===previous))return previous;
          return result.defaultCycleId??result.items[0]?.id??"";
        });
        setCycleState("ready");
      })
      .catch(()=>{if(!ctrl.signal.aborted){setSprints([]);setSelectedCycleId("");setCycleState("error");}});
    return ()=>ctrl.abort();
  },[mode,teamId,pathname,requestedCycleId,teamSwitcherEnabled]);

  const changeSprint=(cycleId:string)=>{
    if(!teamId||!sprints.some(item=>item.id===cycleId))return;
    setSelectedCycleId(cycleId);
    const params=pathname==="/app"?new URLSearchParams(searchParams.toString()):new URLSearchParams();
    params.set("teamId",teamId);
    params.set("cycleId",cycleId);
    params.delete("version");params.delete("asOf");
    router.push("/app?"+params.toString());
  };
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

  useEffect(()=>{
    const desktop=window.matchMedia("(min-width: 992px)");
    const onBreakpointChange=()=>{
      if(desktop.matches)setMobileOpen(false);
    };
    onBreakpointChange();
    desktop.addEventListener("change",onBreakpointChange);
    return ()=>desktop.removeEventListener("change",onBreakpointChange);
  },[]);

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
          <ActiveTeamSelector enabled={teamSwitcherEnabled&&role==="admin"}
            mode={mode} teamId={teamId} teamName={team}/>
          <div className="smn-header-field smn-header-cycle">
            <label htmlFor="smn-current-cycle">{t(cycleLabel)}</label>
            <select id="smn-current-cycle" className="form-select form-select-sm"
              value={selectedCycleId} onChange={event=>changeSprint(event.target.value)}
              disabled={(!teamSwitcherEnabled&&mode!=="scrum")||cycleState!=="ready"||sprints.length===0}
              aria-describedby="smn-cycle-help">
              {sprints.length===0&&<option value="">{t(cycleState==="error"?"dashboard.shell.cycleUnavailable":
                cycleState==="loading"?"dashboard.shell.loadingCycles":"dashboard.shell.noCycle")}</option>}
              {sprints.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <span id="smn-cycle-help" className="visually-hidden">
              {cycleState==="error"?t("sprintsIndex.error"):
                sprints.length===0?t("dashboard.shell.noCycle"):t("dashboard.shell.sprint")}
            </span>
          </div>
          <div className="smn-header-field smn-header-search">
            <label htmlFor="smn-global-search">{t("dashboard.shell.search")}</label>
            <input id="smn-global-search" type="search" className="form-control form-control-sm"
              disabled placeholder={t("dashboard.shell.searchUnavailable")}
              title={t("dashboard.shell.searchUnavailable")}
              aria-describedby="smn-search-help"/>
            <span id="smn-search-help" className="visually-hidden">{t("dashboard.shell.searchUnavailable")}</span>
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
        <PrivateNavigation mode={mode} role={role}
          onNavigate={()=>setMobileOpen(false)}/>
      </div>
      <main id="smn-main" className="smn-private-main pb-5">{children}</main>
    </div>
  </div>;
}
