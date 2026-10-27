"use client";

import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {prefillValue} from "@/lib/form-prefill";
import type {CalendarState,WorkDay} from "@/server/members/calendar";

const WEEKDAYS=["members.calendar.monday","members.calendar.tuesday","members.calendar.wednesday",
 "members.calendar.thursday","members.calendar.friday","members.calendar.saturday",
 "members.calendar.sunday"] as const;
const newest=(state:CalendarState)=>state.weeks.at(-1)??null;
const effectiveDefault=(state:CalendarState)=>{
 const latest=newest(state);
 return latest&&latest.effective_from>state.today?latest.effective_from:state.today;
};

/** Modale dédiée uniquement à la trame hebdomadaire et sa date d'effet. */
export default function MemberCalendarEditor({memberId,teamName,onSaved,onCancel}:{
 memberId:string;teamName:string;onSaved:()=>void;onCancel:()=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<CalendarState|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [week,setWeek]=useState<WorkDay[]>([]);
 const [baseline,setBaseline]=useState("");
 const [effective,setEffective]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const dirty=Boolean(data&&(JSON.stringify(week)!==baseline||effective!==effectiveDefault(data)));
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));

 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("calendar-read-failed");
    return response.json() as Promise<CalendarState>;
   })
   .then(next=>{
    if(!active)return;
    if(next.memberId!==memberId||!Array.isArray(next.weeks)||
       !Array.isArray(next.suggestedWeek))throw Error("calendar-invalid-response");
    const latest=newest(next);
    const days=prefillValue(latest?.days,next.suggestedWeek,[],Boolean(latest))
     .value.map(day=>({...day}));
    setData(next);
    setWeek(days);
    setBaseline(JSON.stringify(days));
    setEffective(effectiveDefault(next));
    setStatus("ready");
   })
   .catch(()=>{if(active)setStatus("error");});
  return()=>{active=false;};
 },[memberId]);

 const changeDay=(index:number,field:"morning"|"afternoon",checked:boolean)=>
  setWeek(rows=>rows.map((row,i)=>i===index?{...row,[field]:checked}:row));
 const cancel=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  onCancel();
 };
 const saveWeek=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy||!data||data.archived)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"weekly",effectiveFrom:effective,days:week,
     revision:newest(data)?.revision??0})
   });
   const result=await response.json() as {error?:string};
   if(!response.ok){
    setError(t(result.error==="conflict"?"members.calendar.conflict":
     result.error==="date-in-past"||result.error==="date-before-latest"?
      "members.calendar.invalidDate":
     result.error==="archived"?"members.calendar.archived":
     "members.calendar.invalidInput"));
    return;
   }
   onSaved();
  }catch{setError(t("members.calendar.failed"));}
  finally{setBusy(false);}
 };
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="member-calendar-heading">
  <h3 className="h5" id="member-calendar-heading">{t("members.calendar.weekHeading")}</h3>
  {status==="loading"&&<p role="status">{t("members.calendar.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("members.calendar.failedLoad")}</p>}
  {data&&status==="ready"&&<>
   <p className="small text-secondary mb-0">{t("prefill.teamContext",{team:teamName})}</p>
   <p className="small text-secondary mb-0">{t("members.calendar.contractSeparate",{value:data.contractPercent})}</p>
   <p className="small text-secondary mb-0">{t(data.configured?
    "prefill.savedWeek":"prefill.suggestedWeek")}</p>
   {!data.configured&&<p role="status" className="alert alert-info">
    {t("members.calendar.suggestedOnly")}</p>}
   {data.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   <form onSubmit={saveWeek} className="d-grid gap-3">
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr>
      <th scope="col">{t("members.calendar.day")}</th>
      <th scope="col">{t("members.calendar.morning")}</th>
      <th scope="col">{t("members.calendar.afternoon")}</th>
     </tr></thead>
     <tbody>{week.map((day,i)=><tr key={day.weekday}>
      <th scope="row">{t(WEEKDAYS[i])}</th>
      {(["morning","afternoon"] as const).map(field=><td key={field}>
       <input type="checkbox" className="form-check-input"
        aria-label={t(WEEKDAYS[i])+" — "+t(field==="morning"?
         "members.calendar.morning":"members.calendar.afternoon")}
        checked={day[field]} disabled={data.archived||busy}
        onChange={event=>changeDay(i,field,event.target.checked)}/>
      </td>)}
     </tr>)}</tbody>
    </table></div>
    <div className="d-grid gap-2">
     <div className="row g-3"><div className="col-12 col-md-6">
     <div><label className="form-label" htmlFor="calendar-effective">
      {t("members.calendar.effectiveFrom")}</label>
      <input id="calendar-effective" type="date" required className="form-control"
       min={newest(data)?.effective_from&&newest(data)!.effective_from>data.today?
        newest(data)!.effective_from:data.today}
       value={effective} disabled={busy||data.archived}
       onChange={event=>setEffective(event.target.value)}/></div>
     </div></div>
     <div className="smn-cockpit-form-actions">
     <button className="btn btn-primary" disabled={busy||data.archived}
      type="submit">{t("members.calendar.saveWeek")}</button>
     <button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={cancel}>{t("members.profile.cancel")}</button>
     </div>
    </div>
   </form>
  </>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {status==="error"&&<button type="button" className="btn btn-outline-secondary align-self-start"
   onClick={cancel}>{t("members.profile.cancel")}</button>}
 </section>;
}
