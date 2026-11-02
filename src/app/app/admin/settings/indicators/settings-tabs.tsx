"use client";
import {useEffect,useState,type ReactNode} from "react";
import ExpressionGuide from "./expression-guide";

export default function IndicatorSettingsTabs({catalogue,permissions}:{catalogue:ReactNode;permissions:ReactNode}){
 const [selected,setSelected]=useState<"catalogue"|"guide">("catalogue");
 useEffect(()=>{if(window.location.hash==="#guide-expressions")setSelected("guide");},[]);
 return <div>
  <div className="smn-panel rounded-4 p-3 mb-3">
   <div className="nav nav-tabs gap-2" role="tablist" aria-label="Paramètres des indicateurs">
    <button type="button" role="tab" aria-selected={selected==="catalogue"} aria-controls="indicator-settings-catalogue" className={"nav-link"+(selected==="catalogue"?" active":"")} onClick={()=>setSelected("catalogue")}>Catalogue</button>
    <button type="button" role="tab" aria-selected={selected==="guide"} aria-controls="guide-expressions" className={"nav-link"+(selected==="guide"?" active":"")} onClick={()=>setSelected("guide")}>Guide des expressions</button>
   </div>
  </div>
  <section id="indicator-settings-catalogue" role="tabpanel" aria-label="Catalogue" hidden={selected!=="catalogue"}>{catalogue}{permissions}</section>
  <section id="guide-expressions" role="tabpanel" aria-label="Guide des expressions" hidden={selected!=="guide"}><ExpressionGuide/></section>
 </div>;
}
