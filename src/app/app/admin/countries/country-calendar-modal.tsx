"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import {annualDisplayStatus,type TechnicalCoverage,type AnnualDisplayStatus}
 from "@/lib/countries/year-status";
import {isoCivilDate,mondayFirstMonthCells,moveCalendarMonth}
 from "@/lib/countries/month-grid";
import CountryFlag from "./country-flag";

type Holiday={date:string;name:string};
type Country={code:string;name:string;nationalCalendar:{years:TechnicalCoverage[]}};
type Mode="list"|"calendar";
type LoadState={kind:"loading"}|{kind:"error"}|{kind:"ready";holidays:Holiday[]};

const statusCss=(status:AnnualDisplayStatus):string=>
 status==="configured"?"text-bg-success":status==="invalid"?"text-bg-danger":
 status==="review"?"text-bg-warning":"text-bg-secondary";

function AnnualHolidays({code,year,month,mode,status}:{code:string;year:number;
 month:number;mode:Mode;status:AnnualDisplayStatus}){
 const t=useTranslation(),locale=useLocale();
 const [load,setLoad]=useState<LoadState>({kind:"loading"});
 const [retry,setRetry]=useState(0);
 const [selectedDate,setSelectedDate]=useState<string|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/countries/calendar?country="+encodeURIComponent(code)+
   "&year="+year,{cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error("calendar-read-failed");
    return response.json() as Promise<{country:string;year:number;holidays:Holiday[]}>;
   })
   .then(result=>{
    if(controller.signal.aborted)return;
    if(result.country!==code||result.year!==year||!Array.isArray(result.holidays))
     throw Error("calendar-response-mismatch");
    setLoad({kind:"ready",holidays:result.holidays});
   })
   .catch(()=>{if(!controller.signal.aborted)setLoad({kind:"error"});});
  return ()=>controller.abort();
 },[code,year,retry]);

 const language=locale==="en"?"en-GB":"fr-FR";
 const weekdays=useMemo(()=>Array.from({length:7},(_,index)=>
  new Intl.DateTimeFormat(language,{weekday:"short",timeZone:"UTC"})
   .format(new Date(Date.UTC(2026,0,5+index)))),[language]);
 const cells=useMemo(()=>mondayFirstMonthCells(year,month),[year,month]);
 const holidays=load.kind==="ready"?load.holidays:[];
 const byDate=useMemo(()=>new Map(holidays.map(h=>[h.date,h])),[holidays]);
 const selected=selectedDate?byDate.get(selectedDate):undefined;
 const formatDate=(date:string)=>new Intl.DateTimeFormat(language,{
  day:"numeric",month:"long",year:"numeric",timeZone:"UTC"
 }).format(new Date(date+"T12:00:00Z"));

 if(load.kind==="loading")return <div className="py-5 text-center" role="status">
  {t("countries.loading")}
 </div>;
 if(load.kind==="error")return <div role="alert" className="alert alert-warning my-3">
  <p>{t("countries.calendarLoadFailed")}</p>
  <button className="btn btn-outline-primary" type="button" onClick={()=>{
   setLoad({kind:"loading"});setRetry(n=>n+1);
  }}>{t("common.retry")}</button>
 </div>;
 return <div className="d-grid gap-3">
  {status==="invalid"&&<p className="alert alert-danger mb-0" role="status">
   {t("countries.calendarInvalidWarning")}
  </p>}
  {status==="unknown"&&<p className="alert alert-secondary mb-0" role="status">
   {t("countries.calendarUnknownWarning")}
  </p>}
  {holidays.length===0&&<p className="alert alert-light border mb-0" role="status">
   {t("countries.noDates")}
  </p>}
  {mode==="list"?(
   holidays.length>0&&<div className="table-responsive">
    <table className="table table-hover align-middle">
     <thead><tr>
      <th scope="col">{t("countries.csvDate")}</th>
      <th scope="col">{t("countries.csvName")}</th>
     </tr></thead>
     <tbody>{holidays.map(holiday=><tr key={holiday.date}>
      <td className="text-nowrap">{formatDate(holiday.date)}</td>
      <td>{holiday.name}</td>
     </tr>)}</tbody>
    </table>
   </div>
  ):(
   <div>
    <p className="small text-muted">{t("countries.calendarClickHint")}</p>
    <div className="smn-country-month-grid" role="group"
     aria-label={new Intl.DateTimeFormat(language,{month:"long",year:"numeric",
      timeZone:"UTC"}).format(new Date(Date.UTC(year,month,1)))}>
     {weekdays.map((label,index)=><div key={"h"+index}
      className="smn-country-month-weekday" aria-hidden="true">{label}</div>)}
     {cells.map((day,index)=>{
      const date=day===null?null:isoCivilDate(year,month,day);
      const holiday=date?byDate.get(date):undefined;
      return <div key={index} className={"smn-country-month-day"+
       (holiday?" is-holiday":"")}>
       {day!==null&&(holiday?
        <button type="button" className="smn-country-holiday-day"
         aria-pressed={selectedDate===date}
         aria-label={formatDate(date!)+": "+holiday.name}
         onClick={()=>setSelectedDate(date)}>
         <span className="smn-country-day-number">{day}</span>
         <span className="smn-country-day-name">{holiday.name}</span>
        </button>:
        <span className="smn-country-day-number">{day}</span>)}
      </div>;
     })}
    </div>
    {selected&&<div className="alert alert-info mt-3 mb-0" role="status" aria-live="polite">
     <strong>{formatDate(selected.date)}</strong> — {selected.name}
    </div>}
   </div>
  )}
  <p className="small text-muted mb-0">{t("countries.reviewOnlyInfo")}</p>
 </div>;
}

export default function CountryCalendarModal({country,initialYear,onClose}:{
 country:Country;initialYear:number;onClose:()=>void;
}){
 const t=useTranslation(),locale=useLocale();
 const dialog=useRef<HTMLDialogElement>(null);
 const firstFocus=useRef<HTMLSelectElement>(null);
 const [year,setYear]=useState(initialYear);
 const [month,setMonth]=useState(new Date().getMonth());
 const [mode,setMode]=useState<Mode>("list");

 useEffect(()=>{
  const node=dialog.current;
  if(node&&!node.open)node.showModal();
  firstFocus.current?.focus();
  return ()=>{if(node?.open)node.close();};
 },[]);

 const availableYears=useMemo(()=>Array.from(new Set([
  year,initialYear,initialYear-2,initialYear-1,initialYear+1,initialYear+2,
  ...country.nationalCalendar.years.map(y=>y.year)
 ])).filter(value=>value>=1900&&value<=2200).sort((a,b)=>b-a),
 [country.nationalCalendar.years,initialYear,year]);
 const status=annualDisplayStatus(country.nationalCalendar.years.find(y=>y.year===year));
 const statusLabel=status==="configured"?t("countries.configured"):
  status==="review"?t("countries.statusReview"):
  status==="not-configured"?t("countries.notConfigured"):
  status==="invalid"?t("countries.invalidCalendar"):t("countries.statusUnknown");

 const changeMonth=(step:-1|1)=>{
  const next=moveCalendarMonth({year,month},step);
  setYear(next.year);setMonth(next.month);
 };
 const language=locale==="en"?"en-GB":"fr-FR";
 const monthHeading=new Intl.DateTimeFormat(language,{month:"long",year:"numeric",timeZone:"UTC"})
  .format(new Date(Date.UTC(year,month,1)));

 return <dialog ref={dialog} className="smn-country-calendar-dialog"
  aria-labelledby="smn-country-dialog-title" aria-describedby="smn-country-dialog-description"
  onClose={onClose}>
  <div className="smn-country-calendar-shell">
   <header className="smn-country-calendar-header">
    <div className="d-flex align-items-center gap-3 min-w-0">
     <CountryFlag code={country.code} name={country.name}/>
     <div className="min-w-0">
      <h2 id="smn-country-dialog-title" className="h4 mb-1">{country.name}
       <span className="text-muted fs-6 fw-normal ms-2">({country.code})</span>
      </h2>
      <p id="smn-country-dialog-description" className="small text-muted mb-0">
       {t("countries.nationalOnly")}
      </p>
     </div>
    </div>
    <button type="button" className="btn-close flex-shrink-0"
     aria-label={t("countries.close")} onClick={()=>dialog.current?.close()}/>
   </header>
   <div className="smn-country-calendar-toolbar">
    <div className="d-flex flex-wrap align-items-center gap-3">
     <div>
      <label htmlFor="smn-country-modal-year" className="form-label small mb-1">
       {t("countries.yearLabel")}
      </label>
      <div className="input-group input-group-sm">
       <button className="btn btn-outline-secondary" type="button"
        disabled={year<=1900} aria-label={t("countries.previousYear")}
        onClick={()=>setYear(y=>Math.max(1900,y-1))}>‹</button>
       <select ref={firstFocus} id="smn-country-modal-year" className="form-select"
        value={year} onChange={event=>setYear(Number(event.target.value))}>
        {availableYears.map(value=><option key={value} value={value}>{value}</option>)}
       </select>
       <button className="btn btn-outline-secondary" type="button"
        disabled={year>=2200} aria-label={t("countries.nextYear")}
        onClick={()=>setYear(y=>Math.min(2200,y+1))}>›</button>
      </div>
     </div>
     <div aria-label={t("countries.yearStatus")}>
      <span className={"badge "+statusCss(status)}>{statusLabel}</span>
     </div>
     <div className="ms-auto" role="group" aria-label={t("countries.calendarViewMode")}>
      <div className="btn-group btn-group-sm">
       <button type="button" className={"btn "+(mode==="list"?"btn-primary":"btn-outline-primary")}
        aria-pressed={mode==="list"} onClick={()=>setMode("list")}>
        {t("countries.calendarListView")}
       </button>
       <button type="button" className={"btn "+(mode==="calendar"?"btn-primary":"btn-outline-primary")}
        aria-pressed={mode==="calendar"} onClick={()=>setMode("calendar")}>
        {t("countries.calendarMonthView")}
       </button>
      </div>
     </div>
    </div>
    {mode==="calendar"&&<div className="d-flex align-items-center justify-content-between gap-2 mt-3">
     <button type="button" className="btn btn-outline-secondary btn-sm"
      aria-label={t("countries.calendarPreviousMonth")}
      disabled={year===1900&&month===0} onClick={()=>changeMonth(-1)}>‹</button>
     <h3 className="h6 text-capitalize mb-0" aria-live="polite">{monthHeading}</h3>
     <button type="button" className="btn btn-outline-secondary btn-sm"
      aria-label={t("countries.calendarNextMonth")}
      disabled={year===2200&&month===11} onClick={()=>changeMonth(1)}>›</button>
    </div>}
   </div>
   <div className="smn-country-calendar-content">
    <AnnualHolidays key={country.code+":"+year} code={country.code}
     year={year} month={month} mode={mode} status={status}/>
   </div>
   <footer className="smn-country-calendar-footer">
    <span className="small text-muted">{t("countries.calendarReadOnly")}</span>
    <button type="button" className="btn btn-outline-secondary"
     onClick={()=>dialog.current?.close()}>{t("countries.close")}</button>
   </footer>
  </div>
 </dialog>;
}
