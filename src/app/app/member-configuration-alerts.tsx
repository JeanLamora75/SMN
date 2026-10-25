"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";

type Member={id:string;displayName:string;archived:boolean;isAssigned:boolean;roleShares?:{scrumMaster:number;productOwner:number;developer:number}};
type Roster={members:Member[]};
type CalendarState={memberId:string;configured:boolean};
type Warning={id:string;name:string;missingCalendar:boolean;missingRoles:boolean};
export function missingMemberRoles(member:Member):boolean{
 const shares=member.roleShares;
 return !shares||!([shares.scrumMaster,shares.productOwner,shares.developer].some(v=>Number.isFinite(v)&&v>0));
}
export default function MemberConfigurationAlerts(){
 const t=useTranslation(),[warnings,setWarnings]=useState<Warning[]>([]),[error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const run=async()=>{
   const response=await fetch("/api/admin/members",{signal:controller.signal,cache:"no-store"});
   if(!response.ok)throw Error("members-unavailable");
   const roster=await response.json() as Roster;
   if(!Array.isArray(roster.members))throw Error("invalid-roster");
   const active=roster.members.filter(m=>!m.archived&&m.isAssigned);
   const checked=await Promise.all(active.map(async member=>{
    const r=await fetch("/api/admin/members/"+encodeURIComponent(member.id)+"/calendar",{signal:controller.signal,cache:"no-store"});
    if(!r.ok)throw Error("calendar-unavailable");
    const calendar=await r.json() as CalendarState;
    if(calendar.memberId!==member.id||typeof calendar.configured!=="boolean")throw Error("calendar-invalid");
    return {id:member.id,name:member.displayName,missingCalendar:!calendar.configured,missingRoles:missingMemberRoles(member)};
   }));
   if(!controller.signal.aborted)setWarnings(checked.filter(w=>w.missingCalendar||w.missingRoles));
  };
  void run().catch(()=>{if(!controller.signal.aborted)setError(true);});
  return ()=>controller.abort();
 },[]);
 if(error)return <p className="alert alert-warning" role="status">{t("memberConfigurationAlerts.unavailable")}</p>;
 if(!warnings.length)return null;
 return <section className="alert alert-warning" aria-label={t("memberConfigurationAlerts.heading")}>
  <h2 className="h6 mb-2">{t("memberConfigurationAlerts.heading")}</h2>
  <ul className="mb-0">
   {warnings.map(w=><li key={w.id}>
    <Link href={"/app/admin/members/"+encodeURIComponent(w.id)} className="alert-link">{w.name}</Link>
    {" — "}{[w.missingCalendar?t("memberConfigurationAlerts.calendar"):null,w.missingRoles?t("memberConfigurationAlerts.roles"):null].filter(Boolean).join(" · ")}
   </li>)}
  </ul>
 </section>;
}
