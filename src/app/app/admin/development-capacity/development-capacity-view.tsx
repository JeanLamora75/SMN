"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type MissingCode="no-assignments"|"ambiguous-assignment"|"assignment-version"|
 "work-calendar"|"member-country"|"national-coverage";
type Day={date:string;status:"calculated"|"not-calculable";
 developmentJh:number|null;developmentHours:number|null;availableHalfDays:number|null;
 allocationPercent:number|null;developerPercent:number|null;
 contributionPercent:number|null;contractPercent:number|null;missing:MissingCode[]};
type Member={memberId:string;displayName:string;status:string;totalJh:number|null;days:Day[]};
type Report={start:string;end:string;hoursPerJh:number;team:{id:string;name:string;mode:string};
 status:"calculated"|"not-calculable";totalJh:number|null;
 missing:{date:string|null;memberId:string|null;source:MissingCode}[];members:Member[]};
type Setting={hoursPerJh:number;revision:number;updatedAt:string};
const todayLocal=()=>{const d=new Date();return d.getFullYear()+"-"+
 String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const fmt=(v:number)=>v.toLocaleString("fr-FR",{maximumFractionDigits:4});
const missingKey:Record<MissingCode,string>={
 "no-assignments":"noAssignments","ambiguous-assignment":"ambiguousAssignment",
 "assignment-version":"assignmentVersion","work-calendar":"workCalendar",
 "member-country":"memberCountry","national-coverage":"nationalCoverage"
};

export default function DevelopmentCapacityView(){
 const t=useTranslation();
 const [start,setStart]=useState(()=>todayLocal());
 const [end,setEnd]=useState(()=>todayLocal());
 const [report,setReport]=useState<Report|null>(null);
 const [settings,setSettings]=useState<Setting|null>(null);
 const [hours,setHours]=useState("8");
 const [busy,setBusy]=useState(false);
 const [settingsBusy,setSettingsBusy]=useState(false);
 const [error,setError]=useState("");
 const [settingsError,setSettingsError]=useState("");
 const [showDays,setShowDays]=useState(false);
 const dirty=settings!==null&&hours!==String(settings.hoursPerJh);
 useUnsavedChanges(dirty||settingsBusy,t("draft.leaveWarning"));
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/capacity-settings",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("load");return r.json() as Promise<Setting>;})
   .then(v=>{if(!live)return;setSettings(v);setHours(String(v.hoursPerJh));})
   .catch(()=>{if(live)setSettingsError(t("developmentCapacity.settingsError"));});
  return ()=>{live=false;};
 },[t]);
 const load=async()=>{
  setBusy(true);setError("");setReport(null);
  try{
   const params=new URLSearchParams({start,end});
   const res=await fetch("/api/admin/development-capacity?"+params.toString(),{cache:"no-store"});
   if(!res.ok){
    setError(t(res.status===400?"developmentCapacity.invalidPeriod":"developmentCapacity.loadError"));
    return;
   }
   const data=await res.json() as Report;
   if(!Array.isArray(data.members)||!Array.isArray(data.missing))throw Error("invalid");
   setReport(data);
  }catch{setError(t("developmentCapacity.loadError"));}
  finally{setBusy(false);}
 };
 const saveSettings=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!settings||settingsBusy)return;
  setSettingsBusy(true);setSettingsError("");
  try{
   const res=await fetch("/api/admin/capacity-settings",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({hoursPerJh:Number(hours),revision:settings.revision})
   });
   if(!res.ok){
    setSettingsError(t(res.status===409?"developmentCapacity.conflict":"developmentCapacity.invalidHours"));
    return;
   }
   const data=await res.json() as {ok:boolean;settings:Setting};
   if(!data.ok)throw Error("save");
   setSettings(data.settings);setHours(String(data.settings.hoursPerJh));
   setReport(null);
  }catch{setSettingsError(t("developmentCapacity.settingsError"));}
  finally{setSettingsBusy(false);}
 };
 const nameMap=new Map<string,string>((report?.members??[]).map(m=>[m.memberId,m.displayName] as const));
 const label=(code:MissingCode)=>t(("developmentCapacity."+missingKey[code]) as "developmentCapacity.noAssignments");
 return <section className="smn-page container py-4 d-grid gap-4">
  <header>
   <h1 className="h3">{t("developmentCapacity.title")}</h1>
   <p className="text-secondary">{t("developmentCapacity.intro")}</p>
  </header>
  <form className="smn-panel p-3 d-grid gap-3" onSubmit={e=>{e.preventDefault();void load();}}>
   <h2 className="h5">{t("developmentCapacity.periodTitle")}</h2>
   <div className="row g-3">
    <div className="col-md-5"><label htmlFor="capacity-start" className="form-label">
     {t("developmentCapacity.start")}</label>
     <input id="capacity-start" type="date" className="form-control" value={start}
      min="1900-01-01" max="2200-12-31" required
      onChange={e=>setStart(e.target.value)}/></div>
    <div className="col-md-5"><label htmlFor="capacity-end" className="form-label">
     {t("developmentCapacity.end")}</label>
     <input id="capacity-end" type="date" className="form-control" value={end}
      min="1900-01-01" max="2200-12-31" required
      onChange={e=>setEnd(e.target.value)}/></div>
   </div>
   <p className="small text-secondary">{t("developmentCapacity.maxPeriod")}</p>
   <button className="btn btn-primary align-self-start" disabled={busy} type="submit">
    {t("developmentCapacity.compute")}</button>
  </form>
  <form className="smn-panel p-3 d-grid gap-3" onSubmit={saveSettings}>
   <h2 className="h5">{t("developmentCapacity.settingsTitle")}</h2>
   <label htmlFor="capacity-hours" className="form-label">{t("developmentCapacity.hours")}</label>
   <input id="capacity-hours" className="form-control" type="number"
    min="1" max="24" step="0.01" value={hours} required
    disabled={!settings||settingsBusy} onChange={e=>setHours(e.target.value)}/>
   <p className="small text-secondary">{t("developmentCapacity.settingsHint")}</p>
   <button type="submit" className="btn btn-outline-primary align-self-start"
    disabled={!settings||settingsBusy||!dirty}>{t("developmentCapacity.saveHours")}</button>
   {settingsError&&<p className="alert alert-warning" role="alert">{settingsError}</p>}
  </form>
  {busy&&<p role="status">{t("developmentCapacity.loading")}</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {report&&!busy&&<>
   <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="capacity-result">
    <h2 id="capacity-result" className="h5">{t("developmentCapacity.result")}</h2>
    <p>{t("developmentCapacity.team",{team:report.team.name})}</p>
    {report.status==="calculated"&&report.totalJh!==null?
     <p className="h4">{fmt(report.totalJh)} {t("developmentCapacity.unitJh")}</p>:
     <p className="alert alert-warning" role="status">{t("developmentCapacity.notCalculable")}</p>}
    <p className="small text-secondary">
     {t("developmentCapacity.hoursUsed",{hours:report.hoursPerJh})}</p>
    {report.missing.length>0&&<div>
     <h3 className="h6">{t("developmentCapacity.missingTitle")}</h3>
     <ul>{report.missing.map((entry,i)=><li key={i}>
      {entry.date??t("developmentCapacity.period")} — {entry.memberId?
       nameMap.get(entry.memberId)??t("developmentCapacity.unknownMember"):
       t("developmentCapacity.teamWide")} : {label(entry.source)}
     </li>)}</ul>
    </div>}
    <h3 className="h6">{t("developmentCapacity.members")}</h3>
    <div className="table-responsive"><table className="table table-sm">
     <thead><tr><th>{t("developmentCapacity.member")}</th>
      <th>{t("developmentCapacity.jh")}</th><th>{t("developmentCapacity.status")}</th></tr></thead>
     <tbody>{report.members.map(member=><tr key={member.memberId}>
      <td>{member.displayName}</td>
      <td>{member.totalJh===null?"—":fmt(member.totalJh)}</td>
      <td>{t(member.status==="calculated"?
       "developmentCapacity.calculated":"developmentCapacity.notCalculable")}</td>
     </tr>)}</tbody>
    </table></div>
    <button type="button" className="btn btn-outline-secondary align-self-start"
     onClick={()=>setShowDays(v=>!v)}>
     {t(showDays?"developmentCapacity.hideDays":"developmentCapacity.showDays")}</button>
    {showDays&&<div className="table-responsive">
     <table className="table table-sm table-bordered">
      <thead><tr><th>{t("developmentCapacity.member")}</th>
       <th>{t("developmentCapacity.date")}</th>
       <th>{t("developmentCapacity.availableSlots")}</th>
       <th>{t("developmentCapacity.allocation")}</th>
       <th>{t("developmentCapacity.developerShare")}</th>
       <th>{t("developmentCapacity.contribution")}</th>
       <th>{t("developmentCapacity.jh")}</th></tr></thead>
      <tbody>{report.members.flatMap(m=>m.days.map(day=><tr key={m.memberId+day.date}>
       <th scope="row">{m.displayName}</th><td>{day.date}</td>
       <td>{day.availableHalfDays??"—"}</td><td>{day.allocationPercent===null?"—":day.allocationPercent+"%"}</td>
       <td>{day.developerPercent===null?"—":day.developerPercent+"%"}</td>
       <td>{day.contributionPercent===null?"—":day.contributionPercent+"%"}</td>
       <td>{day.developmentJh===null?"—":fmt(day.developmentJh)}</td>
      </tr>))}</tbody>
     </table>
    </div>}
    <p className="small text-secondary">{t("developmentCapacity.disclaimer")}</p>
   </section>
  </>}
 </section>;
}
