"use client";
import {useSyncExternalStore,type ReactNode} from "react";
import ExpressionGuide from "./expression-guide";
import RecommendedIndicatorGuide from "./recommended-guide";

type Tab="catalogue"|"guide"|"recommended";
function currentTab():Tab{
 return window.location.hash==="#guide-expressions"?"guide":window.location.hash==="#indicateurs-recommandes"?"recommended":"catalogue";
}
function subscribeToHash(onChange:()=>void):()=>void{
 window.addEventListener("hashchange",onChange);
 return ()=>window.removeEventListener("hashchange",onChange);
}
const serverTab=():Tab=>"catalogue";

export default function IndicatorSettingsTabs({catalogue,permissions,teams,teamId}:{catalogue:ReactNode;permissions:ReactNode;teams:readonly {id:string;name:string;mode:"scrum"|"kanban"}[];teamId:string|null}){
 const selected=useSyncExternalStore(subscribeToHash,currentTab,serverTab);
 return <div>
  <div className="smn-panel rounded-4 p-3 mb-3">
   <div className="nav nav-tabs gap-2" role="tablist" aria-label="Paramètres des indicateurs">
    <button type="button" role="tab" aria-selected={selected==="catalogue"} aria-controls="indicator-settings-catalogue" className={"nav-link"+(selected==="catalogue"?" active":"")} onClick={()=>{window.location.hash="indicator-settings-catalogue";}}>Catalogue</button>
    <button type="button" role="tab" aria-selected={selected==="guide"} aria-controls="guide-expressions" className={"nav-link"+(selected==="guide"?" active":"")} onClick={()=>{window.location.hash="guide-expressions";}}>Guide des expressions</button>
    <button type="button" role="tab" aria-selected={selected==="recommended"} aria-controls="indicateurs-recommandes" className={"nav-link"+(selected==="recommended"?" active":"")} onClick={()=>{window.location.hash="indicateurs-recommandes";}}>Indicateurs recommandés</button>
   </div>
  </div>
  <section id="indicator-settings-catalogue" role="tabpanel" aria-label="Catalogue" hidden={selected!=="catalogue"}>{catalogue}{permissions}</section>
  <section id="guide-expressions" role="tabpanel" aria-label="Guide des expressions" hidden={selected!=="guide"}><ExpressionGuide/></section>
  <section id="indicateurs-recommandes" role="tabpanel" aria-label="Indicateurs recommandés" hidden={selected!=="recommended"}><RecommendedIndicatorGuide teams={teams} teamId={teamId}/></section>
 </div>;
}
