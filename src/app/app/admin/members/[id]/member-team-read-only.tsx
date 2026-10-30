"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import type {TeamAssignmentRevision} from "@/server/members/team-assignment-history";

type DailyAvailability={date:string;morningAbsent:boolean;afternoonAbsent:boolean};
type Response={memberId:string;teamId:string;startOn:string;endOn:string;
 days:DailyAvailability[]};
type Props=Readonly<{memberId:string;teamId:string;teamName:string;
 memberName:string;professionalFunction:string|null;versions:TeamAssignmentRevision[]}>;

function formatCivil(date:string,locale:string):string{
 const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
 if(!parts)return date;
 const utc=new Date(Date.UTC(Number(parts[1]),Number(parts[2])-1,Number(parts[3])));
 return new Intl.DateTimeFormat(locale==="en"?"en-GB":"fr-FR",
  {day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(utc);
}
function monthRange(month:string):{startOn:string;endOn:string}|null{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 const [year,number]=month.split("-").map(Number);
 if(year<1900||year>2200)return null;
 const dayCount=new Date(Date.UTC(year,number,0)).getUTCDate();
 const startOn=month+"-01";
 return {startOn,endOn:month+"-"+String(dayCount).padStart(2,"0")};
}

/** Vue v28 volontairement limitée aux données d'affectation de l'équipe.
 * Aucun éditeur de fiche, d'absence, d'identité ou de calendrier personnel.
 */
export default function MemberTeamReadOnly({memberId,teamId,teamName,memberName,professionalFunction,
 versions}:Props){
 const t=useTranslation();
 const locale=useLocale();
 const year=Number(new Intl.DateTimeFormat("en-US",{year:"numeric",timeZone:"Europe/Paris"}).format(new Date()));
 const [annual,setAnnual]=useState<number|null>(null);
 const [month,setMonth]=useState(()=>
  new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Paris"}).slice(0,7));
 const [status,setStatus]=useState<"loading"|"ready"|"empty"|"error">("loading");
 const [days,setDays]=useState<DailyAvailability[]>([]);
 useEffect(()=>{
  const range=monthRange(month);
  if(!range){void Promise.resolve().then(()=>{setDays([]);setStatus("error");});return;}
  const controller=new AbortController();
  const params=new URLSearchParams({teamId,...range});
  void Promise.resolve().then(()=>{if(!controller.signal.aborted){setDays([]);setStatus("loading");}});
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+
   "/team-availability?"+params.toString(),{
    cache:"no-store",signal:controller.signal
   }).then(async res=>{
    if(res.status===404)return null;
    if(!res.ok)throw Error("team-availability-fetch");
    return res.json() as Promise<Response>;
   }).then(result=>{
    if(controller.signal.aborted)return;
    if(result===null){setStatus("empty");return;}
    if(result.memberId!==memberId||result.teamId!==teamId||
       result.startOn!==range.startOn||result.endOn!==range.endOn||
       !Array.isArray(result.days))throw Error("team-availability-scope");
    setDays(result.days);setStatus(result.days.length?"ready":"empty");
   }).catch(()=>{
    if(!controller.signal.aborted){setDays([]);setStatus("error");}
   });
  return()=>controller.abort();
 },[memberId,teamId,month]);
 useEffect(()=>{
  const controller=new AbortController();
  const params=new URLSearchParams({teamId,year:String(year)});
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+
   "/team-annual-absence?"+params.toString(),{cache:"no-store",signal:controller.signal})
   .then(async res=>{if(!res.ok)throw Error("annual-absence-unavailable");
    return res.json() as Promise<{year:number;halfDays:number}>;})
   .then(data=>{if(!controller.signal.aborted)
    setAnnual(data.year===year&&Number.isInteger(data.halfDays)?data.halfDays:null);})
   .catch(()=>{if(!controller.signal.aborted)setAnnual(null);});
  return()=>controller.abort();
 },[memberId,teamId,year]);
 const active=versions[0];
 const role=active?[
  active.scrumMasterPercent>0?"Scrum Master":null,
  active.productOwnerPercent>0?"Product Owner":null,
  active.developerPercent>0?(locale==="fr"?"Développeur":"Developer"):null
 ].filter(Boolean).join(" / "):"";
 const firstHalf=days.filter(d=>Number(d.date.slice(-2))<=15);
 const secondHalf=days.filter(d=>Number(d.date.slice(-2))>15);
 const morning=days.filter(d=>d.morningAbsent).length;
 const afternoon=days.filter(d=>d.afternoonAbsent).length;
 return <div className="smn-member-cockpit d-grid gap-3">
  <header className="smn-member-hero">
   <div className="smn-member-hero-main">
    <p className="smn-member-eyebrow">{t("memberTeamScope.teamLabel")}: {teamName}</p>
    <h1>{memberName}</h1>
    <p className="smn-member-role">{role||t("memberTeamScope.noRole")} — {professionalFunction||t("memberTeamScope.noFunction")}</p>
    <p className="smn-member-hero-description">{t("memberTeamScope.readOnly")}</p>
   </div>
   <span className="smn-member-readonly">{t("memberTeamScope.readOnly").split(" — ")[0]}</span>
  </header>
  <div className="smn-member-body">
  <section className="smn-member-panel smn-member-history"
   aria-labelledby="smn-team-member-assignment-title">
   <h2 className="smn-member-panel-title" id="smn-team-member-assignment-title">
    {t("memberTeamScope.assignmentTitle")}
   </h2>
   {active&&<div className="smn-member-metrics">
    <div><span>{t("memberTeamScope.start")}</span><strong>{formatCivil(active.startOn,locale)}</strong></div>
    <div><span>{t("memberTeamScope.allocation")}</span><strong>{active.allocationPercent} %</strong></div>
    <div><span>{t("memberTeamScope.developer")}</span><strong>{active.developerPercent} %</strong></div>
    <div><span>{t("memberTeamScope.annualAbsences")}</span><strong>{annual===null?t("memberTeamScope.notAvailable"):annual}</strong></div>
   </div>}
   <div className="table-responsive">
    <table className="table table-striped align-middle smn-member-table">
     <thead><tr>
      <th scope="col">{t("memberTeamScope.start")}</th>
      <th scope="col">{t("memberTeamScope.end")}</th>
      <th scope="col">{t("memberTeamScope.effective")}</th>
      <th scope="col">{t("memberTeamScope.allocation")}</th>
      <th scope="col">{t("memberTeamScope.developer")}</th>
      <th scope="col">{t("memberTeamScope.revision")}</th>
     </tr></thead>
     <tbody>{versions.map(v=><tr key={v.assignmentId+"-"+v.revision}>
      <td>{formatCivil(v.startOn,locale)}</td><td>{v.endOn?formatCivil(v.endOn,locale):"—"}</td>
      <td>{formatCivil(v.effectiveFrom,locale)}</td><td>{v.allocationPercent} %</td>
      <td>{v.developerPercent} %</td><td><span className="smn-member-revision">{v.revision}</span></td>
     </tr>)}</tbody>
    </table>
   </div>
  </section>
  <section className="smn-member-panel smn-member-calendar"
   aria-labelledby="smn-team-member-availability-title">
   <h2 className="smn-member-panel-title" id="smn-team-member-availability-title">
    {t("memberTeamScope.absenceTitle")}
   </h2>
   <p className="text-secondary">{t("memberTeamScope.privacy")}</p>
   <div className="smn-member-toolbar"><label className="form-label" htmlFor="smn-member-team-month">
    {t("memberTeamScope.month")}
   </label>
   <input className="form-control" id="smn-member-team-month"
    type="month" min="1900-01" max="2200-12" value={month}
    onChange={event=>setMonth(event.target.value)}/></div>
   {status==="ready"&&<div className="smn-member-availability-summary">
    <span>{t("memberTeamScope.morning")}: <strong>{morning}</strong></span>
    <span>{t("memberTeamScope.afternoon")}: <strong>{afternoon}</strong></span>
   </div>}
   {status==="loading"&&<p role="status">{t("memberTeamScope.loading")}</p>}
   {status==="error"&&<p role="alert" className="alert alert-warning">
    {t("memberTeamScope.unavailable")}
   </p>}
   {status==="empty"&&<p role="status" className="alert alert-info">
    {t("memberTeamScope.noDays")}
   </p>}
   {status==="ready"&&<div className="smn-member-month-columns">
    {[firstHalf,secondHalf].map((part,index)=>
     <div key={index} className="table-responsive">
      <table className="table table-sm align-middle smn-member-table">
       <thead><tr><th scope="col">{t("memberTeamScope.day")}</th>
        <th scope="col">{t("memberTeamScope.morning")}</th>
        <th scope="col">{t("memberTeamScope.afternoon")}</th></tr></thead>
       <tbody>{part.map(d=><tr key={d.date}>
        <th scope="row">{formatCivil(d.date,locale)}</th>
        <td>{d.morningAbsent?t("memberTeamScope.absent"):"—"}</td>
        <td>{d.afternoonAbsent?t("memberTeamScope.absent"):"—"}</td>
       </tr>)}</tbody>
      </table>
     </div>)}
   </div>}
  </section>
  </div>
 </div>;
}
