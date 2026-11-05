"use client";
import {useEffect,useState,useSyncExternalStore,type ReactNode} from "react";
import ExpressionGuide from "./expression-guide";
import RecommendedIndicatorGuide from "./recommended-guide";

export type IndicatorView="cards"|"list";
type Tab="catalogue"|"guide"|"recommended";
const VIEW_KEY="smn-indicator-settings-view-v1";
function currentTab():Tab{
 return window.location.hash==="#guide-expressions"?"guide":window.location.hash==="#indicateurs-recommandes"?"recommended":"catalogue";
}
function subscribeToHash(onChange:()=>void):()=>void{
 window.addEventListener("hashchange",onChange);
 return ()=>window.removeEventListener("hashchange",onChange);
}
const serverTab=():Tab=>"catalogue";

export default function IndicatorSettingsTabs({catalogue,permissions,teams=[],teamId=null}:{catalogue:ReactNode;permissions:ReactNode;teams?:readonly {id:string;name:string;mode:"scrum"|"kanban"}[];teamId?:string|null}){
 const selected=useSyncExternalStore(subscribeToHash,currentTab,serverTab);
 return <div>
  <div className="smn-panel rounded-4 p-3 mb-3">
   <div className="d-flex flex-wrap justify-content-between align-items-end gap-2">
   <div className="nav nav-tabs gap-2 smn-indicator-tabs flex-grow-1" role="tablist" aria-label="Paramètres des indicateurs">
    <button type="button" role="tab" aria-selected={selected==="catalogue"} aria-controls="indicator-settings-catalogue" className={"nav-link"+(selected==="catalogue"?" active":"")} onClick={()=>{window.location.hash="indicator-settings-catalogue";}}>Catalogue</button>
    <button type="button" role="tab" aria-selected={selected==="guide"} aria-controls="guide-expressions" className={"nav-link"+(selected==="guide"?" active":"")} onClick={()=>{window.location.hash="guide-expressions";}}>Guide des expressions</button>
    <button type="button" role="tab" aria-selected={selected==="recommended"} aria-controls="indicateurs-recommandes" className={"nav-link"+(selected==="recommended"?" active":"")} onClick={()=>{window.location.hash="indicateurs-recommandes";}}>Indicateurs recommandés</button>
   </div>
   <div className="btn-group btn-group-sm mb-1" role="group" aria-label="Mode d’affichage">
    <button type="button" className={"btn "+(view==="cards"?"btn-primary":"btn-outline-secondary")} aria-pressed={view==="cards"} onClick={()=>changeView("cards")}><i className="bi bi-grid-3x2-gap me-1" aria-hidden="true"/>Cartes</button>
    <button type="button" className={"btn "+(view==="list"?"btn-primary":"btn-outline-secondary")} aria-pressed={view==="list"} onClick={()=>changeView("list")}><i className="bi bi-list-ul me-1" aria-hidden="true"/>Liste</button>
   </div>
   </div>
  </div>
  <section id="indicator-settings-catalogue" role="tabpanel" aria-label="Catalogue" hidden={selected!=="catalogue"}><div data-indicator-view={view}>{catalogue}</div>{permissions}</section>
  <section id="guide-expressions" role="tabpanel" aria-label="Guide des expressions" hidden={selected!=="guide"}><ExpressionGuide view={views.guide}/></section>
  <section id="indicateurs-recommandes" role="tabpanel" aria-label="Indicateurs recommandés" hidden={selected!=="recommended"}><RecommendedIndicatorGuide teams={teams} teamId={teamId} view={views.recommended}/></section>
 </div>;
}
