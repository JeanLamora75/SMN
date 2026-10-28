"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";

type Warning={id:string;name:string;missingCalendar:boolean;missingRoles:boolean};
export default function MemberConfigurationAlerts(){
 const t=useTranslation(),[warnings,setWarnings]=useState<Warning[]>([]),[error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const run=async()=>{
   const response=await fetch("/api/admin/members/configuration-alerts",{
    signal:controller.signal,cache:"no-store"
   });
   if(!response.ok)throw Error("configuration-alerts-unavailable");
   const result=await response.json() as {warnings?:Warning[]};
   if(!Array.isArray(result.warnings))throw Error("invalid-alerts");
   if(!controller.signal.aborted)setWarnings(result.warnings);
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
