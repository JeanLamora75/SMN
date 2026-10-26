"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {annualDisplayStatus,currentParisYear,normalizeCountrySearch,
 type AnnualDisplayStatus,type TechnicalCoverage} from "@/lib/countries/year-status";
import HolidayCsvImport from "./holiday-csv-import";
import HolidayIcsImport from "./holiday-ics-import";
import CountryFlag from "./country-flag";
import CountryFormModal from "./country-form-modal";

type Country={code:string;name:string;revision:number;nationalCalendar:{
 status:"configured"|"partial"|"not-configured"|"invalid";
 years:TechnicalCoverage[];
 holidays:{date:string;name:string}[]|null;
}};
type Holiday={date:string;name:string};
type Filter="all"|AnnualDisplayStatus;
const FILTERS:Filter[]=["all","configured","review","not-configured","invalid","unknown"];

export default function CountryAdmin({canManage=true}:{canManage?:boolean}){
 const t=useTranslation();
 const [countries,setCountries]=useState<Country[]>([]);
 const [selectedYear,setSelectedYear]=useState(()=>currentParisYear());
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<Filter>("all");
 const [loaded,setLoaded]=useState(false);
 const [loadFailed,setLoadFailed]=useState(false);
 const [form,setForm]=useState<{mode:"create"|"rename";country?:Country}|null>(null);
 const [focusCode,setFocusCode]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const [refreshing,setRefreshing]=useState(false);
 const [showTools,setShowTools]=useState(false);
 const [activeCode,setActiveCode]=useState<string|null>(null);
 const [holidays,setHolidays]=useState<Holiday[]|null>(null);
 const [holidayError,setHolidayError]=useState(false);
 const [version,setVersion]=useState(0);
 const dialogRef=useRef<HTMLDialogElement>(null);

 const refresh=useCallback(async()=>{
  const response=await fetch("/api/admin/countries",{cache:"no-store"});
  if(!response.ok)throw Error("read-error");
  const data=await response.json() as {countries:Country[]};
  setCountries(data.countries);
  setLoadFailed(false);
  setVersion(v=>v+1);
 },[]);
 useEffect(()=>{
  void refresh().catch(()=>{setNotice("failed");setLoadFailed(true);}).finally(()=>setLoaded(true));
 },[refresh]);

 const yearOptions=useMemo(()=>Array.from(new Set([
  selectedYear,currentParisYear()-2,currentParisYear()-1,
  currentParisYear(),currentParisYear()+1,currentParisYear()+2,
  ...countries.flatMap(c=>c.nationalCalendar.years.map(y=>y.year))
 ])).filter(y=>y>=1900&&y<=2200).sort((a,b)=>b-a),[selectedYear,countries]);

 const statusOf=(country:Country)=>annualDisplayStatus(
  country.nationalCalendar.years.find(y=>y.year===selectedYear));
 const visible=useMemo(()=>{
  const term=normalizeCountrySearch(query);
  return countries.filter(country=>
   (!term||normalizeCountrySearch(country.name).includes(term)||
    normalizeCountrySearch(country.code).includes(term))&&
   (filter==="all"||annualDisplayStatus(
    country.nationalCalendar.years.find(y=>y.year===selectedYear))===filter)
  ).sort((a,b)=>a.name.localeCompare(b.name));
 },[countries,query,filter,selectedYear]);
 const activeCountry=countries.find(c=>c.code===activeCode)??null;
 useEffect(()=>{
  if(!focusCode||form)return;
  const frame=requestAnimationFrame(()=>{
   const element=document.querySelector<HTMLButtonElement>(
    '[data-country-focus="'+focusCode+'"]');
   if(element){element.focus();setFocusCode(null);}
  });
  return ()=>cancelAnimationFrame(frame);
 },[countries,focusCode,form]);

 useEffect(()=>{
  const dialog=dialogRef.current;
  if(activeCode&&!dialog?.open)dialog?.showModal();
  if(!activeCode&&dialog?.open)dialog.close();
 },[activeCode]);
 useEffect(()=>{
  if(!activeCode)return;
  const controller=new AbortController();
  void fetch("/api/admin/countries/calendar?country="+encodeURIComponent(activeCode)+
    "&year="+selectedYear,{cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error("read-error");
    return response.json() as Promise<{holidays:Holiday[]}>;
   })
   .then(data=>{if(!controller.signal.aborted)setHolidays(data.holidays);})
   .catch(()=>{if(!controller.signal.aborted)setHolidayError(true);});
  return ()=>controller.abort();
 },[activeCode,selectedYear,version]);

 async function onFormSaved(result:{mode:"create"|"rename";code:string}){
  // Do not re-submit a successful mutation if the catalog refresh fails.
  setForm(null);setQuery("");setFilter("all");
  setNotice(result.mode==="create"?"saved":"renameSaved");
  try{await refresh();setFocusCode(result.code);}
  catch{setNotice("savedRefreshFailed");setLoadFailed(true);}
 }
 async function refreshCalendars(){
  if(refreshing)return;setRefreshing(true);setNotice("");
  try{
   const response=await fetch("/api/admin/countries/calendar",{method:"POST"});
   if(!response.ok){setNotice("failed");return;}
   await refresh();setNotice("calendarRefreshed");
  }catch{setNotice("failed");}finally{setRefreshing(false);}
 }

 const statusText=(status:AnnualDisplayStatus)=>{
  switch(status){
   case "configured":return t("countries.configured");
   case "review":return t("countries.statusReview");
   case "invalid":return t("countries.invalidCalendar");
   case "not-configured":return t("countries.notConfigured");
   default:return t("countries.statusUnknown");
  }
 };
 const statusClass=(status:AnnualDisplayStatus)=>
  status==="configured"?"text-bg-success":status==="invalid"?"text-bg-danger":
  status==="review"?"text-bg-warning":"text-bg-secondary";

 return <section className="smn-panel p-3 p-lg-4" aria-labelledby="country-catalog-heading">
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
   <div>
    <h2 className="h5 mb-1" id="country-catalog-heading">{t("countries.listTitle")}</h2>
    <p className="text-muted small mb-0">{t("countries.nationalOnly")}</p>
   </div>
   {canManage&&<div className="d-flex flex-wrap gap-2">
    <button type="button" className="btn btn-primary" onClick={()=>setForm({mode:"create"})}>
     {t("countries.addTitle")}
    </button>
    <button type="button" className="btn btn-outline-secondary"
     aria-expanded={showTools} aria-controls="country-tools"
     onClick={()=>setShowTools(v=>!v)}>
     {showTools?t("countries.closeTools"):t("countries.openTools")}
    </button>
   </div>}
  </div>
  <div className="row g-3 align-items-end mb-3">
   <div className="col-12 col-md-5">
    <label className="form-label" htmlFor="country-search">{t("countries.searchLabel")}</label>
    <input className="form-control" id="country-search" type="search"
     placeholder={t("countries.searchPlaceholder")} value={query}
     onChange={event=>setQuery(event.target.value)}/>
   </div>
   <div className="col-6 col-md-4">
    <label className="form-label" htmlFor="country-filter">{t("countries.filterLabel")}</label>
    <select className="form-select" id="country-filter" value={filter}
     onChange={event=>setFilter(event.target.value as Filter)}>
     {FILTERS.map(value=><option key={value} value={value}>
      {value==="all"?t("countries.statusAll"):statusText(value)}
     </option>)}
    </select>
   </div>
   <div className="col-6 col-md-3">
    <label className="form-label" htmlFor="country-year">{t("countries.yearLabel")}</label>
    <div className="input-group">
     <button type="button" className="btn btn-outline-secondary" disabled={selectedYear<=1900}
      aria-label={t("countries.previousYear")} onClick={()=>setSelectedYear(year=>year-1)}>‹</button>
     <select className="form-select" id="country-year" value={selectedYear}
      onChange={event=>setSelectedYear(Number(event.target.value))}>
      {yearOptions.map(year=><option key={year} value={year}>{year}</option>)}
     </select>
     <button type="button" className="btn btn-outline-secondary" disabled={selectedYear>=2200}
      aria-label={t("countries.nextYear")} onClick={()=>setSelectedYear(year=>year+1)}>›</button>
    </div>
   </div>
  </div>
  {notice&&<p role={["saved","renameSaved","calendarRefreshed"].includes(notice)?"status":"alert"}
   className={"alert "+(["saved","renameSaved","calendarRefreshed"].includes(notice)?"alert-success":"alert-warning")}>
   {t(notice==="saved"?"countries.saved":notice==="calendarRefreshed"?
    "countries.calendarRefreshed":notice==="duplicate"?"countries.duplicate":
    notice==="invalid"?"countries.invalid":notice==="renameSaved"?"countries.renameSaved":
    notice==="savedRefreshFailed"?"countries.savedRefreshFailed":"countries.failed")}
  </p>}
  <p className="small text-muted" role="status" aria-live="polite">
   {t("countries.resultsCount",{count:visible.length})} · {selectedYear}
  </p>
  <div className="table-responsive">
   <table className="table table-hover table-sm align-middle mb-0">
    <thead><tr>
     <th scope="col">{t("countries.name")}</th>
     <th scope="col">{t("countries.code")}</th>
     <th scope="col">{t("countries.yearStatus")}</th>
     <th scope="col" className="text-end">{t("countries.actions")}</th>
    </tr></thead>
    <tbody>
     {visible.map(country=>{
      const year=country.nationalCalendar.years.find(y=>y.year===selectedYear);
      const status=statusOf(country);
      return <tr key={country.code}>
       <td><span className="d-inline-flex align-items-center gap-2">
        <CountryFlag key={country.code} code={country.code} name={country.name}/>
        <strong>{country.name}</strong>
       </span></td>
       <td><code>{country.code}</code></td>
       <td><span className={"badge "+statusClass(status)}>{statusText(status)}</span>
        {year&&year.count>0&&<span className="small text-muted ms-2">
         {t("countries.yearCount",{count:year.count})}
        </span>}</td>
       <td className="text-end"><div className="d-inline-flex align-items-center gap-2">
        <button type="button" className="btn btn-sm btn-outline-primary"
         data-country-focus={country.code}
         onClick={()=>{setHolidays(null);setHolidayError(false);setActiveCode(country.code);}}>
         {t("countries.manage")}
        </button>
        {canManage&&<details className="dropdown d-inline-block">
         <summary className="btn btn-sm btn-outline-secondary"
          aria-label={t("countries.moreActions")}>⋯</summary>
         <div className="dropdown-menu show dropdown-menu-end">
          <button type="button" className="dropdown-item"
           onClick={event=>{
            event.currentTarget.closest("details")?.removeAttribute("open");
            setForm({mode:"rename",country});
           }}>{t("countries.renameAction")}</button>
         </div>
        </details>}
       </div></td>
      </tr>;
     })}
    </tbody>
   </table>
  </div>
  {!loaded&&<p role="status" className="my-3">{t("countries.loading")}</p>}
  {loaded&&loadFailed&&<div className="text-center p-4" role="alert">
   <p>{t("countries.loadFailed")}</p>
   <button type="button" className="btn btn-outline-primary" onClick={()=>{
    setLoaded(false);setNotice("");
    void refresh().catch(()=>{setLoadFailed(true);setNotice("failed");})
     .finally(()=>setLoaded(true));
   }}>{t("common.retry")}</button>
  </div>}
  {loaded&&!loadFailed&&visible.length===0&&<div className="text-center p-4">
   <p>{t("countries.emptyResults")}</p>
   <button type="button" className="btn btn-outline-secondary"
    onClick={()=>{setQuery("");setFilter("all");}}>
    {t("countries.resetFilters")}
   </button>
  </div>}
  <p className="small text-muted mt-3 mb-0">{t("countries.unknownNotZero")}</p>

  {canManage&&showTools&&<div id="country-tools" className="border-top mt-4 pt-4">
   <h3 className="h5">{t("countries.toolsTitle")}</h3>
   <button type="button" className="btn btn-outline-secondary mb-3"
    onClick={()=>void refreshCalendars()} disabled={refreshing}>
    {t("countries.refreshCalendars")}
   </button>
   <p className="small text-muted">{t("countries.scopeInfo")}</p>
   <div className="row g-4">
    <div className="col-12 col-xl-6">
     <HolidayCsvImport countries={countries} onCompleted={refresh}/>
    </div>
    <div className="col-12 col-xl-6">
     <HolidayIcsImport countries={countries} onCompleted={refresh}/>
    </div>
   </div>
  </div>}

  {canManage&&form&&<CountryFormModal key={form.mode+":"+(form.country?.code??"new")}
   mode={form.mode} country={form.country} onClose={()=>setForm(null)}
   onSaved={onFormSaved}/>}

  <dialog ref={dialogRef} onClose={()=>setActiveCode(null)}
   className="bg-body text-body border-0 rounded-3 shadow-lg p-0 w-100"
   aria-labelledby="country-calendar-dialog-title" style={{maxWidth:"960px"}}>
   {activeCountry&&<div className="p-3 p-md-4">
    <div className="d-flex justify-content-between align-items-start gap-3">
     <div>
      <h2 className="h4 mb-1" id="country-calendar-dialog-title">
       {activeCountry.name} ({activeCountry.code})
      </h2>
      <p className="text-muted mb-3">{t("countries.calendarStatus")} · {selectedYear}</p>
     </div>
     <button type="button" className="btn-close" aria-label={t("countries.close")}
      onClick={()=>setActiveCode(null)}/>
    </div>
    <p><span className={"badge "+statusClass(statusOf(activeCountry))}>
     {statusText(statusOf(activeCountry))}
    </span></p>
    {holidayError?<p role="alert">{t("countries.loadFailed")}</p>:
     holidays===null?<p role="status">{t("countries.loading")}</p>:
     holidays.length===0?<p>{t("countries.noDates")}</p>:
     <div className="table-responsive" style={{maxHeight:"50vh",overflowY:"auto"}}>
      <table className="table table-sm">
       <thead><tr><th scope="col">{t("countries.csvDate")}</th>
        <th scope="col">{t("countries.csvName")}</th></tr></thead>
       <tbody>{holidays.map(holiday=><tr key={holiday.date}>
        <td>{holiday.date}</td><td>{holiday.name}</td>
       </tr>)}</tbody>
      </table>
     </div>}
    <p className="small text-muted">{t("countries.reviewOnlyInfo")}</p>
    <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
     {canManage&&<button type="button" className="btn btn-outline-primary"
      onClick={()=>{setActiveCode(null);setShowTools(true);}}>
      {t("countries.openTools")}
     </button>}
     <button type="button" className="btn btn-secondary"
      onClick={()=>setActiveCode(null)}>{t("countries.close")}</button>
    </div>
   </div>}
  </dialog>
 </section>;
}
