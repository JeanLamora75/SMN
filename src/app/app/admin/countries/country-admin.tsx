"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import HolidayCsvImport from "./holiday-csv-import";
import HolidayIcsImport from "./holiday-ics-import";
type Coverage={year:number;status:"configured"|"partial"|"not-configured"|"invalid";count:number;diagnostic:string|null};
type Country={code:string;name:string;nationalCalendar:{
 status:"configured"|"partial"|"not-configured"|"invalid";years:Coverage[];
 holidays:{date:string;name:string}[]|null;
}};

export default function CountryAdmin({canManage=true}:{canManage?:boolean}){
 const t=useTranslation();
 const [countries,setCountries]=useState<Country[]>([]);
 const [code,setCode]=useState("");
 const [name,setName]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 async function refresh(){
  const response=await fetch("/api/admin/countries",{cache:"no-store"});
  if(!response.ok)throw Error("read-error");
  const data=await response.json() as {countries:Country[]};
  setCountries(data.countries);
 }
 useEffect(()=>{void refresh().catch(()=>setNotice("failed"));},[]);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/admin/countries",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name})});
   if(!response.ok){setNotice(response.status===409?"duplicate":response.status===400?"invalid":"failed");return;}
   await refresh();setCode("");setName("");setNotice("saved");
  }catch{setNotice("failed");}finally{setBusy(false);}
 }
 async function refreshCalendars(){
  if(refreshing)return;setRefreshing(true);setNotice("");
  try{
   const response=await fetch("/api/admin/countries/calendar",{method:"POST"});
   if(!response.ok){setNotice("failed");return;}
   await refresh();setNotice("calendarRefreshed");
  }catch{setNotice("failed");}finally{setRefreshing(false);}
 }
 const coverageLabel=(country:Country)=>{
  const calendar=country.nationalCalendar;
  if(calendar.status==="invalid")return t("countries.invalidCalendar");
  if(calendar.status==="configured")return t("countries.configured");
  if(calendar.status==="partial")return t("countries.partialCalendar");
  return t("countries.notConfigured");
 };
 return <section className="smn-panel p-4">
  {canManage&&<><h2 className="h5">{t("countries.addTitle")}</h2>
  <form className="d-grid gap-2" onSubmit={submit}>
   <label htmlFor="code">{t("countries.code")}</label>
   <input id="code" className="form-control" maxLength={2} required
    value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
   <label htmlFor="name">{t("countries.name")}</label>
   <input id="name" className="form-control" maxLength={120} required
    value={name} onChange={e=>setName(e.target.value)}/>
   <button type="submit" className="btn btn-primary" disabled={busy}>{t("countries.add")}</button>
  </form></>}
  {notice&&<p role={["saved","calendarRefreshed"].includes(notice)?"status":"alert"} className={"alert "+(["saved","calendarRefreshed"].includes(notice)?"alert-success":"alert-warning")}>{t(notice==="calendarRefreshed"?"countries.calendarRefreshed":notice==="saved"?"countries.saved":notice==="duplicate"?"countries.duplicate":notice==="invalid"?"countries.invalid":"countries.failed")}</p>}
  <h2 className="h5 mt-4">{t("countries.listTitle")}</h2>
  {canManage&&<button className="btn btn-outline-primary mb-3" type="button"
    onClick={()=>void refreshCalendars()} disabled={refreshing||busy}>
    {t("countries.refreshCalendars")}
  </button>}
  <p className="small text-muted">{t("countries.scopeInfo")}</p>
  <table className="table"><thead><tr><th>{t("countries.code")}</th>
   <th>{t("countries.name")}</th><th>{t("countries.calendarStatus")}</th></tr></thead>
   <tbody>{countries.map(c=><tr key={c.code}><td>{c.code}</td><td>{c.name}</td>
    <td>{coverageLabel(c)}
      {c.nationalCalendar.years.length>0&&
        <ul className="small mb-0">{c.nationalCalendar.years.map(y=>
          <li key={y.year}>{y.year} — {y.status==="configured"?
            t("countries.yearCount").replace("{count}",String(y.count)):
            y.status==="partial"?t("countries.partialCount").replace("{count}",String(y.count)):
            y.status==="invalid"?t("countries.invalidCalendar"):t("countries.notConfigured")}
            {y.diagnostic&&<span className="text-muted"> ({y.diagnostic})</span>}
          </li>)}</ul>}
    </td></tr>)}</tbody>
  </table>
  <p className="small">{t("countries.unknownNotZero")}</p>
  {canManage&&<HolidayCsvImport countries={countries} onCompleted={refresh}/>}
  {canManage&&<HolidayIcsImport countries={countries} onCompleted={refresh}/>}
 </section>;
}
