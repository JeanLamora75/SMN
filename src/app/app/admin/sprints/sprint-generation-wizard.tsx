"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useLocale,useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import type {TranslationKey} from "@/i18n/catalog";

type Conflict={id:string;name:string;kind:"existing"|"batch"};
type Item={number:number;name:string;startOn:string;endOn:string;startAt:string;endAt:string;
 timeZone:string;conflicts:Conflict[]};
type Preview={ok:boolean;valid:boolean;token:string|null;historical:boolean;
 items:Item[];nameWarnings:number[];activeTemplates:Array<{id:string;name:string;revision:number}>;
 cadence:{duration_weeks:number;start_day:number;end_day:number;start_time:string;end_time:string;
 time_zone:string}|null;error?:string};
type Proposal={recommended:string|null;proposal:{startOn:string;name:string}|null};
const errorKeys:Record<string,TranslationKey>={
 "invalid-input":"sprintWizard.invalid",
 "preview-expired":"sprintWizard.expired",
 "stale-preview":"sprintWizard.stale",
 "preview-unavailable":"sprintWizard.failed",
 "generation-unavailable":"sprintWizard.failed"
};
export default function SprintGenerationWizard(){
 const t=useTranslation(),locale=useLocale(),router=useRouter();
 const [step,setStep]=useState<1|2|3>(1);
 const [count,setCount]=useState(1);
 const [startOn,setStartOn]=useState("");
 const [names,setNames]=useState<string[]>([]);
 const [historicalChoice,setHistoricalChoice]=useState(false);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [token,setToken]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [created,setCreated]=useState(false);
 const [init,setInit]=useState(true);
 const focus=useRef<HTMLHeadingElement>(null);
 useUnsavedChanges(!created&&(Boolean(startOn)||Boolean(preview)),t("draft.leaveWarning"));
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/sprints",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Proposal>;})
   .then(data=>{if(active){setStartOn(data.recommended??data.proposal?.startOn??"");setInit(false);}})
   .catch(()=>{if(active){setInit(false);setError(t("sprintWizard.proposalFailed"));}});
  return()=>{active=false;};
 },[t]);
 useEffect(()=>{focus.current?.focus();},[step]);
 useEffect(()=>{
  const close=(event:KeyboardEvent)=>{
   if(event.key==="Escape"&&!busy){
    event.preventDefault();
    if(window.confirm(t("draft.discardWarning"))){router.push("/app/admin/sprints");}
   }
  };
  window.addEventListener("keydown",close);
  return()=>window.removeEventListener("keydown",close);
 },[busy,router,t]);
 const invalidate=()=>{setToken(null);setError("");};
 const changeCount=(value:number)=>{setCount(value);setNames([]);setPreview(null);invalidate();};
 const changeDate=(value:string)=>{setStartOn(value);setNames([]);setPreview(null);invalidate();};
 const local=(value:string,zone:string)=>{
  try{return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
   timeZone:zone,dateStyle:"medium",timeStyle:"short"
  }).format(new Date(value));}catch{return value;}
 };
 const cancel=()=>{
  if(busy)return;
  if((startOn||preview)&&!window.confirm(t("draft.discardWarning")))return;
  router.push("/app/admin/sprints");
 };
 const fetchPreview=async(event?:FormEvent)=>{
  event?.preventDefault();
  if(busy||!startOn||!Number.isInteger(count)||count<1||count>6)return;
  setBusy(true);setError("");setToken(null);
  try{
   const payload={startOn,count,generateHistoricalCeremonies:historicalChoice,
    ...(names.length===count?{names}: {})};
   const r=await fetch("/api/admin/sprints/wizard/preview",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
   const d=await r.json() as Preview;
   if(!r.ok||!d.ok||!Array.isArray(d.items)){
    setError(t(errorKeys[d.error??""]??"sprintWizard.failed"));return;
   }
   setPreview(d);
   if(names.length!==count)setNames(d.items.map(x=>x.name));
   setToken(d.token??null);
   setStep(2);
  }catch{setError(t("sprintWizard.failed"));}
  finally{setBusy(false);}
 };
 const updateName=(index:number,value:string)=>{
  setNames(old=>old.map((name,i)=>i===index?value:name));
  invalidate();
 };
 const updateHistorical=(yes:boolean)=>{setHistoricalChoice(yes);invalidate();};
 const confirm=async()=>{
  if(!token||busy||!preview?.valid)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/sprints/wizard/confirm",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token}),cache:"no-store"
   });
   const result=await r.json() as {ok:boolean;error?:string;sprints?:Array<{id:string}>};
   setToken(null);
   if(!r.ok||!result.ok||result.sprints?.length!==count){
    setStep(2);setError(t(errorKeys[result.error??""]??"sprintWizard.failed"));
    return;
   }
   setCreated(true);
   router.push("/app/admin/sprints");
   router.refresh();
  }catch{
   setToken(null);setStep(2);setError(t("sprintWizard.failed"));
  }finally{setBusy(false);}
 };
 const validNames=names.length===count&&names.every(n=>n.trim().length>0&&n.trim().length<=160);
 const snapshotMatches=Boolean(preview&&preview.items.length===count&&
  preview.items.every((x,i)=>x.name===names[i]));
 return <div className="d-grid gap-3">
  <header className="d-flex justify-content-between align-items-start flex-wrap gap-2">
   <div>
    <button type="button" onClick={cancel} disabled={busy}
     className="btn btn-link px-0">← {t("sprintsIndex.title")}</button>
    <h1 tabIndex={-1} ref={focus} className="h3 mb-1">{t("sprintWizard.title")}</h1>
    <p className="text-secondary">{t("sprintWizard.subtitle")}</p>
   </div>
   <button type="button" className="btn btn-outline-secondary" onClick={cancel} disabled={busy}
    aria-label={t("sprintWizard.close")}>× {t("sprintWizard.close")}</button>
  </header>
  <ol className="d-flex gap-3 flex-wrap ps-4" aria-label={t("sprintWizard.steps")}>
   {(["configure","preview","confirm"] as const).map((key,i)=><li key={key}
    className={step===i+1?"fw-bold":""}
    aria-current={step===i+1?"step":undefined}>{t(("sprintWizard."+key) as TranslationKey)}</li>)}
  </ol>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {step===1&&<section className="smn-panel p-4 rounded-4">
   <h2 className="h5">{t("sprintWizard.configure")}</h2>
   <form onSubmit={event=>void fetchPreview(event)} className="d-grid gap-3">
    <div className="row g-3">
     <div className="col-md-5">
      <label htmlFor="wizard-count" className="form-label">{t("sprintWizard.count")}</label>
      <input id="wizard-count" type="number" min={1} max={6} step={1}
       className="form-control" value={count} required disabled={busy}
       onChange={event=>changeCount(Number(event.target.value))}/>
     </div>
     <div className="col-md-7">
      <label htmlFor="wizard-start" className="form-label">{t("sprintWizard.start")}</label>
      <input id="wizard-start" type="date" className="form-control" required
       value={startOn} disabled={busy} onChange={event=>changeDate(event.target.value)}/>
     </div>
    </div>
    <p className="text-secondary small">{t("sprintWizard.cadenceHint")}</p>
    <div className="d-flex gap-2 flex-wrap">
     <button type="submit" className="btn btn-primary" disabled={busy||init||!startOn}>
      {busy?t("sprintWizard.loading"):t("sprintWizard.showPreview")}</button>
     <button type="button" className="btn btn-outline-secondary" onClick={cancel}>{t("members.profile.cancel")}</button>
    </div>
   </form>
  </section>}
  {step===2&&preview&&<section className="smn-panel p-4 rounded-4 d-grid gap-3">
   <h2 className="h5">{t("sprintWizard.preview")}</h2>
   <p className="small text-secondary">{t("sprintWizard.cadenceSummary",{
    weeks:preview.cadence?.duration_weeks??"?",zone:preview.cadence?.time_zone??"?"})}</p>
   <div className="table-responsive">
    <table className="table align-middle">
     <thead><tr>
      <th scope="col">{t("sprintWizard.name")}</th>
      <th scope="col">{t("sprintWizard.dates")}</th>
      <th scope="col">{t("sprintWizard.conflicts")}</th>
     </tr></thead>
     <tbody>{preview.items.map((item,i)=><tr key={item.number}>
      <td><label htmlFor={"wizard-name-"+i} className="visually-hidden">{t("sprintWizard.nameNumber",{number:item.number})}</label>
       <input id={"wizard-name-"+i} className="form-control" maxLength={160}
        value={names[i]??item.name} disabled={busy}
        onChange={event=>updateName(i,event.target.value)}/>
       {preview.nameWarnings?.includes(item.number)&&<small className="text-warning-emphasis">{t("sprintWizard.duplicateName")}</small>}</td>
      <td><span>{local(item.startAt,item.timeZone)}</span>
       <span className="d-block text-secondary">→ {local(item.endAt,item.timeZone)}</span></td>
      <td>{item.conflicts.length?item.conflicts.map(x=>
       <p className="text-danger mb-1" key={x.id}>{t("sprintWizard.conflictWith",{name:x.name})}</p>):
       t("sprintWizard.noConflicts")}</td>
     </tr>)}</tbody>
    </table>
   </div>
   {preview.activeTemplates.length>0?
    <p className="text-secondary small">{t("sprintWizard.templates")} : {preview.activeTemplates.map(x=>x.name).join(", ")}</p>:
    <p className="text-secondary small">{t("sprintWizard.noTemplates")}</p>}
   {preview.historical&&<label className="d-flex gap-2 align-items-start">
    <input type="checkbox" className="form-check-input mt-1" checked={historicalChoice}
     onChange={event=>updateHistorical(event.target.checked)} disabled={busy}/>
    <span>{t("sprintWizard.historicalOption")}
     <span className="d-block text-secondary small">{t("sprintWizard.historicalWarning")}</span></span>
   </label>}
   {!preview.valid&&<p role="alert" className="alert alert-warning">{t("sprintWizard.blocked")}</p>}
   {validNames&&!snapshotMatches&&<p className="small text-warning-emphasis">{t("sprintWizard.refreshNeeded")}</p>}
   <div className="d-flex flex-wrap gap-2">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={()=>{setStep(1);invalidate();}}>{t("sprintWizard.back")}</button>
    <button type="button" className="btn btn-outline-primary" disabled={busy||!validNames}
     onClick={()=>void fetchPreview()}>{t("sprintWizard.refreshPreview")}</button>
    <button type="button" className="btn btn-primary" disabled={busy||!validNames||!preview.valid||!token||!snapshotMatches}
     onClick={()=>setStep(3)}>{t("sprintWizard.continue")}</button>
   </div>
  </section>}
  {step===3&&preview&&<section className="smn-panel p-4 rounded-4 d-grid gap-3">
   <h2 className="h5">{t("sprintWizard.confirm")}</h2>
   <p>{t("sprintWizard.confirmQuestion",{count})}</p>
   <ul>{names.map((name,i)=><li key={i}>{name}</li>)}</ul>
   {preview.historical&&<p className="alert alert-warning">{historicalChoice?
    t("sprintWizard.historicalReconstructed"):t("sprintWizard.historicalSkipped")}</p>}
   <p className="text-secondary small">{t("sprintWizard.atomicNotice")}</p>
   <div className="d-flex gap-2 flex-wrap">
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setStep(2)}>
     {t("sprintWizard.back")}</button>
    <button type="button" className="btn btn-primary" disabled={busy||!token}
     onClick={()=>void confirm()}>{busy?t("sprintWizard.saving"):t("sprintWizard.create")}</button>
   </div>
  </section>}
 </div>;
}
