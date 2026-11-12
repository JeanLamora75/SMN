"use client";
import {useState,useEffect,type ReactNode} from "react";

type Section={id:string;label:string;content:ReactNode};

export default function SettingsTabs({sections,label,variant="default",actions,actionsTabId}:{
 sections:Section[];label:string;variant?:"default"|"cockpit";actions?:ReactNode;actionsTabId?:string
}){
 const [active,setActive]=useState(sections[0]?.id??"");
 const sectionIds=sections.map(section=>section.id).join("|");
 const available=sections.some(section=>section.id===active);
 const selected=available?active:(sections[0]?.id??"");

 useEffect(()=>{
  const selectFromHash=()=>{
   const hash=window.location.hash.slice(1);
   const ids=sectionIds.split("|").filter(Boolean);
   setActive(ids.includes(hash)?hash:(ids[0]??""));
  };
  selectFromHash();
  window.addEventListener("hashchange",selectFromHash);
  return ()=>window.removeEventListener("hashchange",selectFromHash);
 },[sectionIds]);

 const selectTab=(id:string)=>{
  if(!sections.some(section=>section.id===id))return;
  setActive(id);
  const url=new URL(window.location.href);
  url.hash=id;
  window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);
 };
 return <div>
  <div className={"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"+(variant==="cockpit"?" smn-indicator-toolbar":"")}>
   <div className={"nav nav-tabs flex-grow-1"+(variant==="cockpit"?" smn-indicator-tabs":"")} role="tablist" aria-label={label}>
    {sections.map((section,index)=><button key={section.id} type="button" role="tab"
     id={"tab-"+section.id} aria-controls={"panel-"+section.id}
     aria-selected={selected===section.id} tabIndex={selected===section.id?0:-1}
     className={"nav-link"+(selected===section.id?" active":"")}
     onKeyDown={e=>{
      if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key)||sections.length===0)return;
      e.preventDefault();
      const step=e.key==="ArrowRight"?1:-1;
      const next=e.key==="Home"?0:e.key==="End"?sections.length-1:
       (index+step+sections.length)%sections.length;
      selectTab(sections[next].id);
      document.getElementById("tab-"+sections[next].id)?.focus();
     }} onClick={()=>selectTab(section.id)}>{section.label}</button>)}
   </div>
   {actions&&(!actionsTabId||selected===actionsTabId)&&
    <div className="d-flex flex-wrap align-items-center gap-2 pb-1 ms-auto">{actions}</div>}
  </div>
  {sections.map(section=><section key={section.id} role="tabpanel"
   id={"panel-"+section.id} aria-labelledby={"tab-"+section.id}
   tabIndex={0} hidden={selected!==section.id}>{section.content}</section>)}
 </div>;
}
