"use client";

import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import MemberAbsenceEditor from "./member-absence-editor";
import {prefillValue} from "@/lib/form-prefill";

type WorkDay={weekday:number;morning:boolean;afternoon:boolean};
type Week={revision:number;effective_from:string;days:WorkDay[];created_at:string};
type Exception={revision:number;on_date:string;morning:boolean;afternoon:boolean;note:string|null};
type DayResult={onDate:string;status:"missing"|"configured";source:"missing"|"weekly"|"exception";
 slots:{morning:boolean;afternoon:boolean}|null;absenceDays:null;developmentCapacityJh:null};
type CalendarState={memberId:string;teamId:string;contractPercent:number;archived:boolean;
 today:string;configured:boolean;suggestedWeek:WorkDay[];current:Week|null;weeks:Week[];
 exceptions:Exception[];day:DayResult};
const WEEKDAYS=["members.calendar.monday","members.calendar.tuesday","members.calendar.wednesday","members.calendar.thursday","members.calendar.friday","members.calendar.saturday","members.calendar.sunday"] as const;
const newest=(s:CalendarState)=>s.weeks.at(-1)??null;

export default function MemberCalendarEditor({memberId,teamName,onClose}:{
 memberId:string;teamName:string;onClose:()=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<CalendarState|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [week,setWeek]=useState<WorkDay[]>([]);
 const [baseline,setBaseline]=useState("");
 const [exceptionBaseline,setExceptionBaseline]=useState("");
 const [effective,setEffective]=useState("");
 const [dayDate,setDayDate]=useState("");
 const [am,setAm]=useState(false);
 const [pm,setPm]=useState(false);
 const [note,setNote]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [absenceDirty,setAbsenceDirty]=useState(false);
 const dirty=Boolean(data&&(
  JSON.stringify(week)!==baseline||
  (effective!==(newest(data)?.effective_from&&newest(data)!.effective_from>data.today?
    newest(data)!.effective_from:data.today))||
  JSON.stringify({onDate:dayDate,morning:am,afternoon:pm,note})!==exceptionBaseline));
 useUnsavedChanges(dirty||absenceDirty||busy,t("draft.leaveWarning"));
 const load=async(date?:string)=>{
  const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar"+
   (date?"?onDate="+encodeURIComponent(date):""),{cache:"no-store"});
  if(!response.ok)throw Error("calendar-read-failed");
  const next=await response.json() as CalendarState;
  if(next.memberId!==memberId||!Array.isArray(next.weeks)||!Array.isArray(next.exceptions))
   throw Error("calendar-invalid-response");
  setData(next);setStatus("ready");
  const latest=newest(next);
  const days=prefillValue(latest?.days,next.suggestedWeek,[],Boolean(latest))
   .value.map(d=>({...d}));
  setWeek(days);setBaseline(JSON.stringify(days));
  setEffective(latest&&latest.effective_from>next.today?latest.effective_from:next.today);
  setDayDate(next.day.onDate);
  const selected=next.exceptions.filter(e=>e.on_date===next.day.onDate).at(-1);
  setAm(selected?.morning??next.day.slots?.morning??false);
  setPm(selected?.afternoon??next.day.slots?.afternoon??false);
  setNote(selected?.note??"");
  setExceptionBaseline(JSON.stringify({onDate:next.day.onDate,
   morning:selected?.morning??next.day.slots?.morning??false,
   afternoon:selected?.afternoon??next.day.slots?.afternoon??false,note:selected?.note??""}));
 };
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("failed");return r.json() as Promise<CalendarState>;})
   .then(next=>{
    if(!active)return;
    if(next.memberId!==memberId||!Array.isArray(next.weeks))throw Error("invalid");
    const selected=newest(next),days=prefillValue(selected?.days,next.suggestedWeek,[],Boolean(selected))
     .value.map(d=>({...d}));
    setData(next);setStatus("ready");
    setWeek(previous=>previous.length>0?previous:days);setBaseline(JSON.stringify(days));
    setEffective(selected&&selected.effective_from>next.today?selected.effective_from:next.today);
    setDayDate(next.day.onDate);
    const except=next.exceptions.filter(e=>e.on_date===next.day.onDate).at(-1);
    setAm(except?.morning??next.day.slots?.morning??false);
    setPm(except?.afternoon??next.day.slots?.afternoon??false);
    setNote(except?.note??"");
    setExceptionBaseline(JSON.stringify({onDate:next.day.onDate,
     morning:except?.morning??next.day.slots?.morning??false,
     afternoon:except?.afternoon??next.day.slots?.afternoon??false,note:except?.note??""}));
   }).catch(()=>{if(active)setStatus("error");});
  return ()=>{active=false;};
 },[memberId]);
 const changeDay=(index:number,field:"morning"|"afternoon",checked:boolean)=>
  setWeek(rows=>rows.map((row,i)=>i===index?{...row,[field]:checked}:row));
 const selectDate=(value:string)=>{
  if((dirty||absenceDirty)&&!window.confirm(t("draft.discardWarning")))return;
  setDayDate(value);setError("");setMessage("");
  setStatus("loading");
  void load(value).catch(()=>setStatus("error"));
 };
 const submit=async(payload:Record<string,unknown>,successKey:TranslationKey)=>{
  if(busy||!data)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
   });
   const result=await response.json() as {error?:string};
   if(!response.ok){
    setError(t(result.error==="conflict"?"members.calendar.conflict":
     result.error==="date-in-past"||result.error==="date-before-latest"?
      "members.calendar.invalidDate":
     result.error==="weekly-missing"?"members.calendar.weeklyMissing":
     result.error==="archived"?"members.calendar.archived":
     "members.calendar.invalidInput"));
    return;
   }
   await load(payload.action==="exception"?String(payload.onDate):dayDate);
   setMessage(t(successKey));
  }catch{
   setError(t("members.calendar.failed"));
  }finally{setBusy(false);}
 };
 const saveWeek=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!data||data.archived)return;
  void submit({action:"weekly",effectiveFrom:effective,days:week,revision:newest(data)?.revision??0},
   "members.calendar.weekSaved");
 };
 const saveException=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!data||data.archived||data.day.status==="missing")return;
  const current=data.exceptions.filter(x=>x.on_date===dayDate).at(-1);
  void submit({action:"exception",revision:current?.revision??0,onDate:dayDate,
   morning:am,afternoon:pm,note:note.trim()||null},"members.calendar.exceptionSaved");
 };
 const close=()=>{if(busy)return;if((dirty||absenceDirty)&&!window.confirm(t("draft.discardWarning")))return;onClose();};
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="member-calendar-heading">
  <h3 className="h5" id="member-calendar-heading">{t("members.calendar.title")}</h3>
  {status==="loading"&&<p role="status">{t("members.calendar.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("members.calendar.failedLoad")}</p>}
  {data&&status==="ready"&&<>
   <p className="small text-secondary mb-0">{t("prefill.teamContext",{team:teamName})}</p>
   <p className="small text-secondary mb-0">{t("members.calendar.contractSeparate",{value:data.contractPercent})}</p>
   <p className="small text-secondary mb-0">{t(data.configured?
    "prefill.savedWeek":"prefill.suggestedWeek")}</p>
   <p className={data.configured?"small text-secondary mb-0":"alert alert-warning"} role="status">
    {t(data.configured?"members.calendar.configured":"members.calendar.suggestedOnly")}</p>
   {data.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   <form onSubmit={saveWeek} className="d-grid gap-3">
    <h4 className="h6 mb-0">{t("members.calendar.weekHeading")}</h4>
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr>
      <th scope="col">{t("members.calendar.day")}</th>
      <th scope="col">{t("members.calendar.morning")}</th>
      <th scope="col">{t("members.calendar.afternoon")}</th>
     </tr></thead>
     <tbody>{week.map((d,i)=><tr key={d.weekday}>
      <th scope="row">{t(WEEKDAYS[i])}</th>
      {(["morning","afternoon"] as const).map(field=><td key={field}>
       <input type="checkbox" className="form-check-input"
        aria-label={t(WEEKDAYS[i])+" — "+t(field==="morning"?"members.calendar.morning":"members.calendar.afternoon")}
        checked={d[field]} disabled={data.archived||busy}
        onChange={e=>changeDay(i,field,e.target.checked)}/>
      </td>)}
     </tr>)}</tbody>
    </table></div>
    <div className="d-flex gap-3 flex-wrap align-items-end">
     <div><label className="form-label" htmlFor="calendar-effective">
      {t("members.calendar.effectiveFrom")}</label>
      <input id="calendar-effective" type="date" required className="form-control"
       min={newest(data)?.effective_from&&newest(data)!.effective_from>data.today?
        newest(data)!.effective_from:data.today}
       value={effective} disabled={busy||data.archived} onChange={e=>setEffective(e.target.value)}/></div>
     <button className="btn btn-primary" disabled={busy||data.archived} type="submit">
      {t("members.calendar.saveWeek")}</button>
    </div>
   </form>
   <div>
    <h4 className="h6">{t("members.calendar.weekHistory")}</h4>
    {data.weeks.length===0?<p className="small">{t("members.calendar.noHistory")}</p>:
     <div className="table-responsive"><table className="table table-sm">
      <thead><tr><th>{t("members.calendar.revision")}</th><th>{t("members.calendar.effectiveFrom")}</th></tr></thead>
      <tbody>{data.weeks.map(w=><tr key={w.revision}><td>{w.revision}</td><td>{w.effective_from}</td></tr>)}</tbody>
     </table></div>}
   </div>
   <form onSubmit={saveException} className="d-grid gap-3 border-top pt-3">
    <h4 className="h6">{t("members.calendar.exceptionHeading")}</h4>
    <div><label htmlFor="calendar-on-date" className="form-label">{t("members.calendar.onDate")}</label>
     <input id="calendar-on-date" type="date" className="form-control" required
      min={data.today} value={dayDate} disabled={busy||data.archived}
      onChange={e=>selectDate(e.target.value)}/></div>
    <p className={data.day.status==="missing"?"alert alert-warning":"small text-secondary"}
     role="status">{t(data.day.status==="missing"?"members.calendar.availabilityMissing":
      data.day.source==="exception"?"members.calendar.exceptionApplicable":"members.calendar.weekApplicable")}</p>
    <div className="d-flex gap-4 flex-wrap">
     <label className="form-check-label"><input type="checkbox" className="form-check-input me-2"
      checked={am} disabled={busy||data.archived||data.day.status==="missing"}
      onChange={e=>setAm(e.target.checked)}/>{t("members.calendar.morning")}</label>
     <label className="form-check-label"><input type="checkbox" className="form-check-input me-2"
      checked={pm} disabled={busy||data.archived||data.day.status==="missing"}
      onChange={e=>setPm(e.target.checked)}/>{t("members.calendar.afternoon")}</label>
    </div>
    <div><label htmlFor="calendar-note" className="form-label">{t("members.calendar.note")}</label>
     <input id="calendar-note" className="form-control" maxLength={200}
      disabled={busy||data.archived||data.day.status==="missing"}
      value={note} onChange={e=>setNote(e.target.value)}/></div>
    <button type="submit" className="btn btn-primary align-self-start"
     disabled={busy||data.archived||data.day.status==="missing"}>
     {t("members.calendar.saveException")}</button>
    <p className="small text-secondary">{t("members.calendar.exceptionsHint")}</p>
   </form>
   {data.exceptions.length>0&&<div>
    <h4 className="h6">{t("members.calendar.exceptionHistory")}</h4>
    <div className="table-responsive"><table className="table table-sm">
     <thead><tr><th>{t("members.calendar.onDate")}</th><th>{t("members.calendar.revision")}</th>
      <th>{t("members.calendar.morning")}</th><th>{t("members.calendar.afternoon")}</th></tr></thead>
     <tbody>{data.exceptions.map(e=><tr key={e.on_date+"-"+e.revision}>
      <td>{e.on_date}</td><td>{e.revision}</td>
      <td>{e.morning?t("members.calendar.yes"):t("members.calendar.no")}</td>
      <td>{e.afternoon?t("members.calendar.yes"):t("members.calendar.no")}</td>
     </tr>)}</tbody>
    </table></div>
   </div>}
   <MemberAbsenceEditor key={memberId+"-"+dayDate} memberId={memberId}
    selectedOn={dayDate} onDirtyChange={setAbsenceDirty}/>
   <p className="small text-secondary">{t("members.calendar.unknownCapacity")}</p>
  </>}
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {message&&<p className="alert alert-success" role="status">{message}</p>}
  <button type="button" className="btn btn-outline-secondary align-self-start"
   disabled={busy} onClick={close}>{t("members.profile.cancel")}</button>
 </section>;
}
