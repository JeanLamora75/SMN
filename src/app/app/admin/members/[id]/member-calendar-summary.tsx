"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Day={weekday:number;morning:boolean;afternoon:boolean};
type Week={days:Day[];effective_from:string};
type Calendar={configured:boolean;current:Week|null;suggestedWeek:Day[];exceptions:{on_date:string;morning:boolean;afternoon:boolean}[]};
export default function MemberCalendarSummary({memberId}:{memberId:string}){
 const t=useTranslation();
 const [value,setValue]=useState<Calendar|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/calendar",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Calendar>;})
  .then(v=>{if(active)setValue(v);}).catch(()=>{if(active)setError(true);});
  return()=>{active=false;};},[memberId]);
 if(error)return <p role="alert" className="alert alert-warning">{t("memberUX.loadFailed")}</p>;
 if(!value)return <p role="status">{t("memberUX.loading")}</p>;
 const days=value.current?.days??value.suggestedWeek??[];
 const names=["members.calendar.monday","members.calendar.tuesday","members.calendar.wednesday",
  "members.calendar.thursday","members.calendar.friday","members.calendar.saturday","members.calendar.sunday"] as const;
 return <div className="d-grid gap-3">
  {!value.configured&&<p className="alert alert-info mb-0">{t("members.calendar.suggestedOnly")}</p>}
  <div className="table-responsive"><table className="table table-sm align-middle">
   <thead><tr><th scope="col">{t("members.calendar.day")}</th><th scope="col">{t("members.calendar.morning")}</th><th scope="col">{t("members.calendar.afternoon")}</th></tr></thead>
   <tbody>{days.map((d,i)=><tr key={d.weekday}><th scope="row">{t(names[i]??"members.calendar.monday")}</th>
    <td>{d.morning?"✓":"—"}</td><td>{d.afternoon?"✓":"—"}</td></tr>)}</tbody>
  </table></div>
  {value.exceptions.length>0&&<div><h3 className="h6">{t("members.calendar.exceptionHistory")}</h3>
   <ul className="list-group">{value.exceptions.map(e=><li key={e.on_date} className="list-group-item">
    {e.on_date} · {e.morning?t("members.calendar.morning"):""} {e.afternoon?t("members.calendar.afternoon"):""}
   </li>)}</ul></div>}
 </div>;
}
