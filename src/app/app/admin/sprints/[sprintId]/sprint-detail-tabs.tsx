"use client";
import Link from "next/link";
import {useEffect,useRef,type KeyboardEvent} from "react";
import {useRouter} from "next/navigation";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {sprintTabKeys,type SprintTab} from "@/lib/sprint-detail-tabs";
export default function SprintDetailTabs({sprintId,teamId,active,labels,navLabel}:{
 sprintId:string;teamId:string;active:SprintTab;labels:Readonly<Record<SprintTab,string>>;navLabel:string;
}){
 const router=useRouter();
 const tabs=useRef<Array<HTMLAnchorElement|null>>([]);
 const focused=useRef<number|null>(null);
 const tabHref=(key:SprintTab)=>sprintDetailPath(sprintId)+"?"+new URLSearchParams({tab:key,teamId}).toString();
 useEffect(()=>{
  if(focused.current!==null){tabs.current[focused.current]?.focus();focused.current=null;}
 },[active]);
 function onKeyDown(event:KeyboardEvent<HTMLAnchorElement>,index:number){
  let next=index;
  if(event.key==="ArrowRight")next=(index+1)%sprintTabKeys.length;
  else if(event.key==="ArrowLeft")next=(index+sprintTabKeys.length-1)%sprintTabKeys.length;
  else if(event.key==="Home")next=0;
  else if(event.key==="End")next=sprintTabKeys.length-1;
  else return;
  event.preventDefault();
  focused.current=next;
  router.push(tabHref(sprintTabKeys[next]));
 }
 return <nav className="smn-sprint-detail-tabs" aria-label={navLabel}>
  <div role="tablist" aria-label={navLabel}
   className="nav nav-tabs flex-nowrap overflow-auto" style={{scrollbarWidth:"thin"}}>
   {sprintTabKeys.map((key,index)=><Link key={key}
    ref={el=>{tabs.current[index]=el;}}
    id={"smn-sprint-tab-"+key} className={"nav-link text-nowrap "+(active===key?"active":"")}
    href={tabHref(key)} role="tab" tabIndex={active===key?0:-1}
    aria-selected={active===key} aria-controls="smn-sprint-detail-panel"
    onKeyDown={event=>onKeyDown(event,index)}>{labels[key]}</Link>)}
  </div>
 </nav>;
}
