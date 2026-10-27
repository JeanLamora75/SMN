"use client";

import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import type {CalendarState} from "@/server/members/calendar";

type Selection={morning:boolean;afternoon:boolean;note:string};
const applicableWeek=(data:CalendarState,date:string)=>
 data.weeks.filter(week=>week.effective_from<=date).at(-1)??null;
const latestException=(data:CalendarState,date:string)=>
 data.exceptions.filter(item=>item.on_date===date).at(-1)??null;
const fromCalendar=(data:CalendarState,date:string):Selection=>{
 const exception=latestException(data,date);
 if(exception)return {morning:exception.morning,afternoon:exception.afternoon,note:exception.note??""};
 const week=applicableWeek(data,date);
 const weekday=new Date(date+"T00:00:00.000Z").getUTCDay()||7;
 const day=week?.days[weekday-1];
 return {morning:day?.morning??false,afternoon:day?.afternoon??false,note:""};
};

/** Exception ponctuelle indépendante de la trame et des absences. */
export default function MemberCalendarExceptionEditor({memberId,onSaved,onCancel,onDirtyChange}:{
 memberId:string;onSaved:()=>void;onCancel:()=>void;onDirtyChange?:(dirty:boolean,busy:boolean)=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<CalendarState|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [date,setDate]=useState("");
 const [selection,setSelection]=useState<Selection>({morning:false,afternoon:false,note:""});
 const [baseline,setBaseline]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 // Changer de date sans éditer les créneaux n’est pas une modification à sauvegarder.
 const dirty=Boolean(data&&JSON.stringify(selection)!==baseline);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{onDirtyChange?.(Boolean(dirty),busy);},[dirty,busy,onDirtyChange]);
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("calendar-read-failed");
    return response.json() as Promise<CalendarState>;
   })
   .then(next=>{
    if(!live)return;
    if(next.memberId!==memberId||!Array.isArray(next.weeks)||
       !Array.isArray(next.exceptions))throw Error("calendar-invalid");
    const initial=fromCalendar(next,next.today);
    setData(next);setDate(next.today);setSelection(initial);
    setBaseline(JSON.stringify(initial));setStatus("ready");
   }).catch(()=>{if(live)setStatus("error");});
  return()=>{live=false;};
 },[memberId]);
 const changeDate=(next:string)=>{
  if(!data)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  const nextValue=fromCalendar(data,next);
  setDate(next);setSelection(nextValue);setBaseline(JSON.stringify(nextValue));setError("");
 };
 const close=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  onCancel();
 };
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!data||busy||data.archived||!applicableWeek(data,date))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"exception",revision:latestException(data,date)?.revision??0,
     onDate:date,morning:selection.morning,afternoon:selection.afternoon,
     note:selection.note.trim()||null
    })
   });
   const result=await response.json() as {error?:string};
   if(!response.ok){
    setError(t(result.error==="conflict"?"members.calendar.conflict":
     result.error==="weekly-missing"?"members.calendar.weeklyMissing":
     result.error==="date-in-past"?"members.calendar.invalidDate":
     result.error==="archived"?"members.calendar.archived":"members.calendar.invalidInput"));
    return;
   }
   onSaved();
  }catch{setError(t("members.calendar.failed"));}
  finally{setBusy(false);}
 };
 const hasWeek=Boolean(data&&applicableWeek(data,date));
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="calendar-exception-heading">
  <h3 className="h5" id="calendar-exception-heading">{t("members.calendar.exceptionHeading")}</h3>
  {status==="loading"&&<p role="status">{t("members.calendar.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("members.calendar.failedLoad")}</p>}
  {data&&status==="ready"&&<>
   <p className="small text-secondary mb-0">{t("members.calendar.exceptionsHint")}</p>
   {data.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   <form onSubmit={save} className="d-grid gap-3">
    <div><label htmlFor="calendar-exception-date" className="form-label">
     {t("members.calendar.onDate")}</label>
     <input id="calendar-exception-date" type="date" className="form-control" required
      min={data.today} value={date} disabled={busy||data.archived}
      onChange={event=>changeDate(event.target.value)}/></div>
    <p role="status" className={hasWeek?"small text-secondary mb-0":"alert alert-warning"}>
     {t(!hasWeek?"members.calendar.availabilityMissing":
      latestException(data,date)?"members.calendar.exceptionApplicable":"members.calendar.weekApplicable")}
    </p>
    <div className="d-flex gap-4 flex-wrap">
     <label className="form-check-label"><input type="checkbox" className="form-check-input me-2"
      checked={selection.morning} disabled={busy||data.archived||!hasWeek}
      onChange={event=>setSelection(previous=>({...previous,morning:event.target.checked}))}/>
      {t("members.calendar.morning")}</label>
     <label className="form-check-label"><input type="checkbox" className="form-check-input me-2"
      checked={selection.afternoon} disabled={busy||data.archived||!hasWeek}
      onChange={event=>setSelection(previous=>({...previous,afternoon:event.target.checked}))}/>
      {t("members.calendar.afternoon")}</label>
    </div>
    <div><label htmlFor="calendar-exception-note" className="form-label">{t("members.calendar.note")}</label>
     <input id="calendar-exception-note" className="form-control" maxLength={200}
      value={selection.note} disabled={busy||data.archived||!hasWeek}
      onChange={event=>setSelection(previous=>({...previous,note:event.target.value}))}/></div>
    {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
    <div className="smn-cockpit-form-actions">
     <button type="submit" className="btn btn-primary" disabled={busy||data.archived||!hasWeek}>
      {t("members.calendar.saveException")}</button>
     <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={close}>
      {t("members.profile.cancel")}</button>
    </div>
   </form>
  </>}
  {status==="error"&&<button type="button" className="btn btn-outline-secondary align-self-start"
   onClick={close}>{t("members.profile.cancel")}</button>}
 </section>;
}
