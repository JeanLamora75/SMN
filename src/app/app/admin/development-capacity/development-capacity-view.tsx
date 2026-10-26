"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import ActualCapacityPanel from "./actual-capacity-panel";
import HistoricalCapacityPanel from "./historical-capacity-panel";
import ReplanningPreview from "./replanning-preview";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type MissingCode="no-assignments"|"ambiguous-assignment"|"assignment-version"|
 "work-calendar"|"exceptional-meeting-participants"|"exceptional-meeting-work-slots";
type Day={date:string;status:"calculated"|"not-calculable";
 developmentJh:number|null;developmentHours:number|null;availableHalfDays:number|null;
 allocationPercent:number|null;developerPercent:number|null;
 contributionPercent:number|null;contractPercent:number|null;missing:MissingCode[]};
type Member={memberId:string;displayName:string;status:string;totalJh:number|null;days:Day[]};
type Report={start:string;end:string;hoursPerJh:number;team:{id:string;name:string;mode:string};
 status:"calculated"|"not-calculable";totalJh:number|null;selection:Selection;
 initialSnapshot:InitialSnapshot|null;
 missing:{date:string|null;memberId:string|null;source:MissingCode}[];members:Member[]};
type InitialSnapshot={
 id:string;eventId:string;initialJh:number|null;
 provenance:"Saisie"|"Calcul"|"Non renseigné";
 actualOpenedAt:string;recordedAt:string;manualRevision:number|null;
};
type Selection={
 start:string;end:string;manualJh:number|null;referenceJh:number|null;
 retainedJh:number|null;source:"Saisie"|"Calcul"|"Non calculable";
 revision:number;frozen:boolean;closed:boolean;updatedAt:string|null;
};
type Setting={hoursPerJh:number;revision:number;updatedAt:string};
const fmt=(v:number)=>v.toLocaleString("fr-FR",{maximumFractionDigits:4});
const missingKey:Record<MissingCode,string>={
 "no-assignments":"noAssignments","ambiguous-assignment":"ambiguousAssignment",
 "assignment-version":"assignmentVersion","work-calendar":"workCalendar",
 "exceptional-meeting-participants":"meetingParticipants",
 "exceptional-meeting-work-slots":"meetingWorkSlots"
};

export default function DevelopmentCapacityView({initialPeriod=null}:{
 initialPeriod?:{start:string;end:string}|null;
}){
 const t=useTranslation();
 const initialStart=initialPeriod?.start;
 const initialEnd=initialPeriod?.end;
 // The server supplies only recorded Sprint dates, never guesses from the browser clock.
 const [start,setStart]=useState(initialPeriod?.start??"");
 const [end,setEnd]=useState(initialPeriod?.end??"");
 const [report,setReport]=useState<Report|null>(null);
 const [settings,setSettings]=useState<Setting|null>(null);
 const [hours,setHours]=useState("8");
 const [busy,setBusy]=useState(Boolean(initialPeriod));
 const [settingsBusy,setSettingsBusy]=useState(false);
 const [error,setError]=useState("");
 const [settingsError,setSettingsError]=useState("");
 const [showDays,setShowDays]=useState(false);
 const [manualDraft,setManualDraft]=useState("");
 const [manualBusy,setManualBusy]=useState(false);
 const [manualError,setManualError]=useState("");
 const [manualSaved,setManualSaved]=useState("");
 const [openingBusy,setOpeningBusy]=useState(false);
 const [openingError,setOpeningError]=useState("");
 const dirty=settings!==null&&hours!==String(settings.hoursPerJh);
 const manualDirty=report!==null&&
  manualDraft!==(report.selection.manualJh===null?"":String(report.selection.manualJh));
 useUnsavedChanges(dirty||settingsBusy||manualDirty||manualBusy,
  t("draft.leaveWarning"));
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/capacity-settings",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("load");return r.json() as Promise<Setting>;})
   .then(v=>{if(!live)return;setSettings(v);setHours(String(v.hoursPerJh));})
   .catch(()=>{if(live)setSettingsError(t("developmentCapacity.settingsError"));});
  return ()=>{live=false;};
 },[t]);
 // On first entry, recalculate for the selected persisted Sprint. Each later
 // manual date change aborts this request rather than restoring obsolete data.
 useEffect(()=>{
  if(!initialStart||!initialEnd||start!==initialStart||end!==initialEnd)return;
  const controller=new AbortController();
  const params=new URLSearchParams({start,end});
  void fetch("/api/admin/development-capacity?"+params.toString(),{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("capacity-unavailable");
   return response.json() as Promise<Report>;
  }).then(data=>{
   if(controller.signal.aborted)return;
   if(!Array.isArray(data.members)||!Array.isArray(data.missing)||
    !data.selection||typeof data.selection.revision!=="number")
    throw Error("invalid-capacity");
   setReport(data);
   setManualDraft(data.selection.manualJh===null?"":String(data.selection.manualJh));
  }).catch(()=>{
   if(!controller.signal.aborted)setError(t("developmentCapacity.loadError"));
  }).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return()=>controller.abort();
 },[start,end,initialStart,initialEnd,t]);
 const setPeriodBoundary=(which:"start"|"end",date:string)=>{
  if(manualDirty&&!window.confirm(t("draft.discardWarning")))return;
  if(which==="start")setStart(date);else setEnd(date);
  setReport(null);setManualDraft("");setManualError("");setManualSaved("");
 };
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
   if(!data.selection||typeof data.selection.revision!=="number")
    throw Error("invalid-capacity-selection");
   setReport(data);
   setManualDraft(data.selection.manualJh===null?"":String(data.selection.manualJh));
   setManualError("");setManualSaved("");
  }catch{setError(t("developmentCapacity.loadError"));}
  finally{setBusy(false);}
 };
 const updateManual=async(action:"set"|"clear")=>{
  if(!report||manualBusy)return;
  if(report.selection.frozen||report.selection.closed)return;
  setManualError("");setManualSaved("");
  const parsed=Number(manualDraft);
  if(action==="set"&&(manualDraft.trim()===""||!Number.isFinite(parsed)||
    parsed<0||parsed>99999999.9999||
    Math.abs(Math.round(parsed*10000)-parsed*10000)>1e-6)){
   setManualError(t("manualCapacity.invalid"));return;
  }
  setManualBusy(true);
  try{
   const input={action,start:report.start,end:report.end,
    revision:report.selection.revision,
    ...(action==="set"?{manualJh:parsed}:{})};
   const response=await fetch("/api/admin/development-capacity",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(input)
   });
   if(!response.ok){
    setManualError(t(response.status===423?"manualCapacity.protected":
     response.status===409?"manualCapacity.conflict":"manualCapacity.failed"));
    return;
   }
   await load();
   setManualSaved(t(action==="set"?"manualCapacity.saved":"manualCapacity.cleared"));
  }catch{setManualError(t("manualCapacity.failed"));}
  finally{setManualBusy(false);}
 };
 const openEffective=async()=>{
  if(!report||report.initialSnapshot||openingBusy||manualBusy||manualDirty)return;
  if(!window.confirm(t("initialCapacity.confirm")))return;
  setOpeningBusy(true);setOpeningError("");
  try{
   const response=await fetch("/api/admin/capacity-openings",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({start:report.start,end:report.end,
     eventId:crypto.randomUUID()})
   });
   if(!response.ok){
    setOpeningError(t("initialCapacity.failed"));return;
   }
   await load();
  }catch{setOpeningError(t("initialCapacity.failed"));}
  finally{setOpeningBusy(false);}
 };
 const saveSettings=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!settings||settingsBusy)return;
  if(manualDirty){setSettingsError(t("prefill.unsavedCapacity"));return;}
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
   if(start&&end)await load();
   else setReport(null);
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
  <form className="smn-panel p-3 d-grid gap-3" onSubmit={e=>{
    e.preventDefault();
    if(manualDirty&&!window.confirm(t("draft.discardWarning")))return;
    void load();
   }}>
   <h2 className="h5">{t("developmentCapacity.periodTitle")}</h2>
   <div className="row g-3">
    <div className="col-md-5"><label htmlFor="capacity-start" className="form-label">
     {t("developmentCapacity.start")}</label>
     <input id="capacity-start" type="date" className="form-control" value={start}
      min="1900-01-01" max="2200-12-31" required
      onChange={e=>setPeriodBoundary("start",e.target.value)}/></div>
    <div className="col-md-5"><label htmlFor="capacity-end" className="form-label">
     {t("developmentCapacity.end")}</label>
     <input id="capacity-end" type="date" className="form-control" value={end}
      min="1900-01-01" max="2200-12-31" required
      onChange={e=>setPeriodBoundary("end",e.target.value)}/></div>
   </div>
   <p className="small text-secondary">{t("developmentCapacity.maxPeriod")}</p>
   <p className="small text-secondary">{t("prefill.unknownPeriod")}</p>
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
   <ActualCapacityPanel key={report.start+"-"+report.end} start={report.start} end={report.end}/>
   <HistoricalCapacityPanel key={"history-"+report.start+"-"+report.end} start={report.start} end={report.end}/>
   <ReplanningPreview key={"replan-"+report.start+"-"+report.end} start={report.start} end={report.end}/>
   <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="capacity-result">
    <h2 id="capacity-result" className="h5">{t("developmentCapacity.result")}</h2>
    <p>{t("developmentCapacity.team",{team:report.team.name})}</p>
    <p className="h6">{t("manualCapacity.retained")}</p>
    {report.selection.retainedJh!==null?
     <p className="h4">{fmt(report.selection.retainedJh)} {t("developmentCapacity.unitJh")}</p>:
     <p className="alert alert-warning" role="status">{t("developmentCapacity.notCalculable")}</p>}
    <p>{t("manualCapacity.provenance")} : <strong>{t(report.selection.source==="Saisie"?
     "manualCapacity.sourceManual":report.selection.source==="Calcul"?
     "manualCapacity.sourceCalculated":"manualCapacity.sourceUnknown")}</strong></p>
    <p>{t("manualCapacity.reference")} : {report.totalJh===null?
     t("developmentCapacity.notCalculable"):fmt(report.totalJh)+" "+t("developmentCapacity.unitJh")}</p>
    <div className="border-top pt-3">
     <h3 className="h6">{t("manualCapacity.editTitle")}</h3>
     {report.selection.frozen||report.selection.closed?
      <p className="alert alert-warning" role="status">{t("manualCapacity.protected")}</p>:
      <div className="d-grid gap-2">
       <label className="form-label" htmlFor="capacity-manual-jh">
        {t("manualCapacity.input")}</label>
       <input id="capacity-manual-jh" type="number" min="0" max="99999999.9999"
        step="0.0001" className="form-control" value={manualDraft}
        disabled={manualBusy} onChange={e=>setManualDraft(e.target.value)}
        placeholder={t("manualCapacity.empty")}/>
       <p className="small text-secondary">{t("manualCapacity.zeroHint")}</p>
       <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-primary" type="button" disabled={manualBusy}
         onClick={()=>void updateManual("set")}>{t("manualCapacity.save")}</button>
        <button className="btn btn-outline-secondary" type="button"
         disabled={manualBusy||report.selection.manualJh===null}
         onClick={()=>void updateManual("clear")}>{t("manualCapacity.clear")}</button>
       </div>
      </div>}
     {manualError&&<p className="alert alert-warning" role="alert">{manualError}</p>}
     {manualSaved&&<p className="alert alert-success" role="status">{manualSaved}</p>}
    </div>
    <div className="border-top pt-3 d-grid gap-2">
     <h3 className="h6">{t("initialCapacity.title")}</h3>
     {report.initialSnapshot?<>
       <p>{t("initialCapacity.openedAt")} : {report.initialSnapshot.actualOpenedAt}</p>
       <p>{t("initialCapacity.provenance")} : {t(report.initialSnapshot.provenance==="Saisie"?
        "initialCapacity.manual":report.initialSnapshot.provenance==="Calcul"?
        "initialCapacity.calculated":"initialCapacity.unknown")}</p>
       <p className="fw-bold">{report.initialSnapshot.initialJh===null?
        t("initialCapacity.unknown"):
        fmt(report.initialSnapshot.initialJh)+" "+t("developmentCapacity.unitJh")}</p>
       <p className="small text-secondary">{t("initialCapacity.immutable")}</p>
      </>:<>
       <p>{t("initialCapacity.notOpened")}</p>
       <button className="btn btn-outline-primary align-self-start" type="button"
        disabled={openingBusy||manualBusy||manualDirty}
        onClick={()=>void openEffective()}>{t("initialCapacity.openAction")}</button>
       <p className="small text-secondary">{t("initialCapacity.openHint")}</p>
      </>}
     {openingError&&<p role="alert" className="alert alert-warning">{openingError}</p>}
    </div>
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
