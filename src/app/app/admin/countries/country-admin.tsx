"use client";
import Image from "next/image";
import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {annualDisplayStatus,currentParisYear,normalizeCountrySearch,
 type AnnualDisplayStatus,type TechnicalCoverage} from "@/lib/countries/year-status";
import HolidayCsvImport from "./holiday-csv-import";
import HolidayIcsImport from "./holiday-ics-import";

type Country={code:string;name:string;nationalCalendar:{
 status:"configured"|"partial"|"not-configured"|"invalid";
 years:TechnicalCoverage[];
 holidays:{date:string;name:string}[]|null;
}};
type Holiday={date:string;name:string};
type Filter="all"|AnnualDisplayStatus;
const FILTERS:Filter[]=["all","configured","review","not-configured","invalid","unknown"];

function CatalogFlag({code,name}:{code:string;name:string}){
 const [failed,setFailed]=useState(false);
 if(failed)return <span role="img" aria-label={name} title={code}>🌐</span>;
 return <Image src={"/flags/"+code.toLowerCase()+".png"} width={28} height={19}
  unoptimized alt={name} title={code}
  onError={()=>setFailed(true)} style={{objectFit:"contain",height:"19px",width:"28px"}}/>;
}

export default function CountryAdmin({canManage=true}:{canManage?:boolean}){
 const t=useTranslation();
 const [countries,setCountries]=useState<Country[]>([]);
 const [selectedYear,setSelectedYear]=useState(()=>currentParisYear());
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<Filter>("all");
 const [loaded,setLoaded]=useState(false);
 const [code,setCode]=useState("");
 const [name,setName]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
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
  setVersion(v=>v+1);
 },[]);
 useEffect(()=>{
  void refresh().catch(()=>setNotice("failed")).finally(()=>setLoaded(true));
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

 async function submit(event:FormEvent<HTMLFormElement>){
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
   {canManage&&<button type="button" className="btn btn-outline-primary"
    aria-expanded={showTools} aria-controls="country-tools"
    onClick={()=>setShowTools(v=>!v)}>
    {showTools?t("countries.closeTools"):t("countries.openTools")}
   </button>}
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
    <select className="form-select" id="country-year" value={selectedYear}
     onChange={event=>setSelectedYear(Number(event.target.value))}>
     {yearOptions.map(year=><option key={year} value={year}>{year}</option>)}
    </select>
   </div>
  </div>
  {notice&&<p role={["saved","calendarRefreshed"].includes(notice)?"status":"alert"}
   className={"alert "+(["saved","calendarRefreshed"].includes(notice)?"alert-success":"alert-warning")}>
   {t(notice==="saved"?"countries.saved":notice==="calendarRefreshed"?
    "countries.calendarRefreshed":notice==="duplicate"?"countries.duplicate":
    notice==="invalid"?"countries.invalid":"countries.failed")}
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
        <CatalogFlag code={country.code} name={country.name}/>
        <strong>{country.name}</strong>
       </span></td>
       <td><code>{country.code}</code></td>
       <td><span className={"badge "+statusClass(status)}>{statusText(status)}</span>
        {year&&year.count>0&&<span className="small text-muted ms-2">
         {t("countries.yearCount",{count:year.count})}
        </span>}</td>
       <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary"
        onClick={()=>{setHolidays(null);setActiveCode(country.code);}}>
        {t("countries.manage")}
       </button></td>
      </tr>;
     })}
    </tbody>
   </table>
  </div>
  {!loaded&&<p role="status" className="my-3">{t("countries.loading")}</p>}
  {loaded&&visible.length===0&&<div className="text-center p-4">
   <p>{t("countries.emptyResults")}</p>
   <button type="button" className="btn btn-outline-secondary"
    onClick={()=>{setQuery("");setFilter("all");}}>
    {t("countries.resetFilters")}
   </button>
  </div>}
  <p className="small text-muted mt-3 mb-0">{t("countries.unknownNotZero")}</p>

  {canManage&&showTools&&<div id="country-tools" className="border-top mt-4 pt-4">
   <h3 className="h5">{t("countries.toolsTitle")}</h3>
   <div className="row g-4">
    <div className="col-12 col-xl-5">
     <h4 className="h6">{t("countries.addTitle")}</h4>
     <form className="d-grid gap-2" onSubmit={submit}>
      <label htmlFor="country-new-code">{t("countries.code")}</label>
      <input id="country-new-code" className="form-control" maxLength={2} required
       value={code} onChange={event=>setCode(event.target.value.toUpperCase())}/>
      <label htmlFor="country-new-name">{t("countries.name")}</label>
      <input id="country-new-name" className="form-control" maxLength={120} required
       value={name} onChange={event=>setName(event.target.value)}/>
      <button type="submit" className="btn btn-primary" disabled={busy}>{t("countries.add")}</button>
     </form>
     <button type="button" className="btn btn-outline-secondary mt-3"
      onClick={()=>void refreshCalendars()} disabled={refreshing||busy}>
      {t("countries.refreshCalendars")}
     </button>
     <p className="small text-muted mt-2">{t("countries.scopeInfo")}</p>
    </div>
    <div className="col-12 col-xl-7">
     <HolidayCsvImport countries={countries} onCompleted={refresh}/>
     <HolidayIcsImport countries={countries} onCompleted={refresh}/>
    </div>
   </div>
  </div>}

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
