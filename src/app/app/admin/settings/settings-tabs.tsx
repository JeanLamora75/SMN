"use client";
import {useState,useEffect,type ReactNode} from "react";
type Section={id:string;label:string;content:ReactNode};
export default function SettingsTabs({sections,label}:{sections:Section[];label:string}){
 const [active,setActive]=useState(sections[0]?.id??"");
 useEffect(()=>{
  const selectFromHash=()=>{
   const hash=window.location.hash.slice(1);
   if(sections.some(section=>section.id===hash))setActive(hash);
  };
  selectFromHash();
  window.addEventListener("hashchange",selectFromHash);
  return ()=>window.removeEventListener("hashchange",selectFromHash);
 },[sections]);
 const selectTab=(id:string)=>{
  setActive(id);
  window.history.replaceState(null,"","#"+id);
 };
 return <div>
  <div className="nav nav-tabs mb-3" role="tablist" aria-label={label}>
   {sections.map((section,index)=><button key={section.id} type="button" role="tab"
    id={"tab-"+section.id} aria-controls={"panel-"+section.id}
    aria-selected={active===section.id} tabIndex={active===section.id?0:-1}
    className={"nav-link"+(active===section.id?" active":"")}
    onKeyDown={e=>{if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;
     e.preventDefault();const step=e.key==="ArrowRight"?1:-1;
     const next=e.key==="Home"?0:e.key==="End"?sections.length-1:
      (index+step+sections.length)%sections.length;
     selectTab(sections[next].id);
     document.getElementById("tab-"+sections[next].id)?.focus();
    }} onClick={()=>selectTab(section.id)}>{section.label}</button>)}
  </div>
  {sections.map(section=><section key={section.id} role="tabpanel"
   id={"panel-"+section.id} aria-labelledby={"tab-"+section.id}
   hidden={active!==section.id}>{section.content}</section>)}
 </div>;
}
