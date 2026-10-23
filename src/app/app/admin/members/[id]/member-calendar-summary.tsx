"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {CalendarState} from "@/server/members/calendar";

/** Consultation des trames et exceptions avec leurs versions, hors formulaires. */
export default function MemberCalendarSummary({memberId}:{memberId:string}){
 const t=useTranslation();
 const [value,setValue]=useState<CalendarState|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("calendar-load-failed");
    return response.json() as Promise<CalendarState>;
   })
   .then(data=>{
    if(!active)return;
    if(data.memberId!==memberId||!Array.isArray(data.weeks)||
       !Array.isArray(data.exceptions))throw Error("calendar-invalid");
    setValue(data);
   }).catch(()=>{if(active)setError(true);});
  return()=>{active=false;};
 },[memberId]);
 if(error)return <p role="alert" className="alert alert-warning">{t("memberUX.loadFailed")}</p>;
 if(!value)return <p role="status">{t("memberUX.loading")}</p>;
 const days=value.current?.days??value.suggestedWeek??[];
 const names=["members.calendar.monday","members.calendar.tuesday","members.calendar.wednesday",
  "members.calendar.thursday","members.calendar.friday","members.calendar.saturday",
  "members.calendar.sunday"] as const;
 return <div className="d-grid gap-3">
  {!value.configured&&<p className="alert alert-info mb-0">{t("members.calendar.suggestedOnly")}</p>}
  <div className="table-responsive"><table className="table table-sm align-middle">
   <thead><tr><th scope="col">{t("members.calendar.day")}</th>
    <th scope="col">{t("members.calendar.morning")}</th>
    <th scope="col">{t("members.calendar.afternoon")}</th></tr></thead>
   <tbody>{days.map((day,i)=><tr key={day.weekday}>
    <th scope="row">{t(names[i]??"members.calendar.monday")}</th>
    <td>{day.morning?"✓":"—"}</td><td>{day.afternoon?"✓":"—"}</td>
   </tr>)}</tbody>
  </table></div>
  <div className="border-top pt-3">
   <h3 className="h6">{t("members.calendar.weekHistory")}</h3>
   {value.weeks.length===0?<p className="small text-secondary">{t("members.calendar.noHistory")}</p>:
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr><th scope="col">{t("members.calendar.revision")}</th>
      <th scope="col">{t("members.calendar.effectiveFrom")}</th></tr></thead>
     <tbody>{value.weeks.map(week=><tr key={week.revision}>
      <td>{week.revision}</td>
      <td><time dateTime={week.effective_from}>{week.effective_from}</time></td>
     </tr>)}</tbody>
    </table></div>}
  </div>
  {value.exceptions.length>0&&<div className="border-top pt-3">
   <h3 className="h6">{t("members.calendar.exceptionHistory")}</h3>
   <div className="table-responsive"><table className="table table-sm align-middle">
    <thead><tr>
     <th scope="col">{t("members.calendar.onDate")}</th>
     <th scope="col">{t("members.calendar.revision")}</th>
     <th scope="col">{t("members.calendar.morning")}</th>
     <th scope="col">{t("members.calendar.afternoon")}</th>
     <th scope="col">{t("members.calendar.note")}</th>
    </tr></thead>
    <tbody>{value.exceptions.map(exception=><tr key={exception.on_date+"-"+exception.revision}>
     <td><time dateTime={exception.on_date}>{exception.on_date}</time></td>
     <td>{exception.revision}</td>
     <td>{exception.morning?t("members.calendar.yes"):t("members.calendar.no")}</td>
     <td>{exception.afternoon?t("members.calendar.yes"):t("members.calendar.no")}</td>
     <td>{exception.note??"—"}</td>
    </tr>)}</tbody>
   </table></div>
  </div>}
 </div>;
}
