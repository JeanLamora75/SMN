"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {annualDisplayStatus,currentParisYear,normalizeCountrySearch,
 type AnnualDisplayStatus,type TechnicalCoverage} from "@/lib/countries/year-status";
import CountryFlag from "./country-flag";
import CountryFormModal from "./country-form-modal";
import CountryCalendarModal from "./country-calendar-modal";
import CountryLifecycleModal from "./country-lifecycle-modal";
import {visibilityAfterLifecycle} from "@/lib/countries/lifecycle-ux";

type Country={code:string;name:string;revision:number;archived:boolean;archivedAt:string|null;nationalCalendar:{
 status:"configured"|"partial"|"not-configured"|"invalid";
 years:TechnicalCoverage[];
 holidays:{date:string;name:string}[]|null;
}};
type Filter="all"|AnnualDisplayStatus;
type ArchiveFilter="active"|"archived"|"all";
const FILTERS:Filter[]=["all","configured","review","not-configured","invalid","unknown"];

export default function CountryAdmin({canManage=true}:{canManage?:boolean}){
 const t=useTranslation();
 const [countries,setCountries]=useState<Country[]>([]);
 const [selectedYear,setSelectedYear]=useState(()=>currentParisYear());
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<Filter>("all");
 const [archiveFilter,setArchiveFilter]=useState<ArchiveFilter>("active");
 const [lifecycle,setLifecycle]=useState<Country|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [loadFailed,setLoadFailed]=useState(false);
 const [form,setForm]=useState<{mode:"create"|"rename";country?:Country}|null>(null);
 const [focusCode,setFocusCode]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const [refreshing,setRefreshing]=useState(false);
 const [showTools,setShowTools]=useState(false);
 const [activeCode,setActiveCode]=useState<string|null>(null);
 const openerRef=useRef<HTMLButtonElement|null>(null);
 const lifecycleOpenerCode=useRef<string|null>(null);
 const renameOpenerCode=useRef<string|null>(null);
 const archiveFilterRef=useRef<HTMLSelectElement>(null);
 const addCountryRef=useRef<HTMLButtonElement>(null);

 const refresh=useCallback(async()=>{
  const response=await fetch("/api/admin/countries",{cache:"no-store"});
  if(!response.ok)throw Error("read-error");
  const data=await response.json() as {countries:Country[]};
  setCountries(data.countries);
  setLoadFailed(false);
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
   (archiveFilter==="all"||(archiveFilter==="active"?!country.archived:country.archived))&&
   (!term||normalizeCountrySearch(country.name).includes(term)||
    normalizeCountrySearch(country.code).includes(term))&&
   (filter==="all"||annualDisplayStatus(
    country.nationalCalendar.years.find(y=>y.year===selectedYear))===filter)
  ).sort((a,b)=>a.name.localeCompare(b.name));
 },[countries,query,filter,selectedYear,archiveFilter]);
 const activeCountry=countries.find(c=>c.code===activeCode)??null;
 useEffect(()=>{
  if(lifecycle||!lifecycleOpenerCode.current)return;
  const code=lifecycleOpenerCode.current;
  const frame=requestAnimationFrame(()=>{
   const trigger=Array.from(document.querySelectorAll<HTMLElement>("[data-country-actions]"))
    .find(el=>el.dataset.countryActions===code)
    ?.querySelector<HTMLElement>("summary");
   (trigger??archiveFilterRef.current)?.focus();
   lifecycleOpenerCode.current=null;
  });
  return ()=>cancelAnimationFrame(frame);
 },[lifecycle,countries,archiveFilter,filter,query,selectedYear]);
 useEffect(()=>{
  if(!focusCode||form)return;
  const frame=requestAnimationFrame(()=>{
   const element=document.querySelector<HTMLButtonElement>(
    '[data-country-focus="'+focusCode+'"]');
   if(element){element.focus();setFocusCode(null);}
  });
  return ()=>cancelAnimationFrame(frame);
 },[countries,focusCode,form]);

 function openCalendar(code:string,opener:HTMLButtonElement){
  openerRef.current=opener;
  setActiveCode(code);
 }
 function closeCalendar(){
  setActiveCode(null);
  requestAnimationFrame(()=>openerRef.current?.focus());
 }

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
    <button ref={addCountryRef} type="button" className="btn btn-primary"
     onClick={()=>{renameOpenerCode.current=null;setForm({mode:"create"});}}>
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
   <div className="col-12 col-md-3">
    <label htmlFor="country-archive-filter" className="form-label">
     {t("countries.lifecycleFilterLabel")}
    </label>
    <select ref={archiveFilterRef} id="country-archive-filter" className="form-select"
     value={archiveFilter} onChange={event=>setArchiveFilter(event.target.value as ArchiveFilter)}>
     <option value="active">{t("countries.lifecycleActive")}</option>
     <option value="archived">{t("countries.lifecycleArchived")}</option>
     <option value="all">{t("countries.statusAll")}</option>
    </select>
   </div>
   <div className="col-12 col-md-3">
    <label className="form-label" htmlFor="country-search">{t("countries.searchLabel")}</label>
    <input className="form-control" id="country-search" type="search"
     placeholder={t("countries.searchPlaceholder")} value={query}
     onChange={event=>setQuery(event.target.value)}/>
   </div>
   <div className="col-6 col-md-3">
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
  {notice&&<p role={["saved","renameSaved","calendarRefreshed","lifecycleSaved","lifecycleArchived","lifecycleReactivated"].includes(notice)?"status":"alert"}
   className={"alert "+(["saved","renameSaved","calendarRefreshed","lifecycleSaved","lifecycleArchived","lifecycleReactivated"].includes(notice)?"alert-success":"alert-warning")}>
   {t(notice==="saved"?"countries.saved":notice==="calendarRefreshed"?
    "countries.calendarRefreshed":notice==="duplicate"?"countries.duplicate":
    notice==="invalid"?"countries.invalid":notice==="renameSaved"?"countries.renameSaved":
    notice==="lifecycleArchived"?"countries.lifecycleArchivedSuccess":
    notice==="lifecycleReactivated"?"countries.lifecycleReactivatedSuccess":
    notice==="lifecycleSaved"?"countries.lifecycleSaved":
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
        <button type="button" className="btn btn-link p-0 text-start text-body fw-semibold text-decoration-none"
         onClick={event=>openCalendar(country.code,event.currentTarget)}>{country.name}</button>
       </span></td>
       <td><code>{country.code}</code></td>
       <td><span className={"badge "+statusClass(status)}>{statusText(status)}</span>
        {country.archived&&<span className="badge text-bg-secondary ms-2">{t("countries.lifecycleArchived")}</span>}
        {year&&year.count>0&&<span className="small text-muted ms-2">
         {t("countries.yearCount",{count:year.count})}
        </span>}</td>
       <td className="text-end"><div className="d-inline-flex align-items-center gap-2">
        <button type="button" className="btn btn-sm btn-outline-primary"
         data-country-focus={country.code}
         onClick={event=>openCalendar(country.code,event.currentTarget)}>
         {t("countries.manage")}
        </button>
        {canManage&&<details className="d-inline-block align-middle text-start"
         data-country-actions={country.code}
         onKeyDown={event=>{
          if(event.key==="Escape"){
           event.preventDefault();event.stopPropagation();
           event.currentTarget.open=false;
           event.currentTarget.querySelector<HTMLElement>("summary")?.focus();
          }
         }}
         onBlur={event=>{
          if(!event.currentTarget.contains(event.relatedTarget as Node|null))
           event.currentTarget.open=false;
         }}>
         <summary className="btn btn-sm btn-outline-secondary"
          aria-label={t("countries.lifecycleMenuForCountry",{country:country.name})}>⋯</summary>
         <div className="d-flex flex-column gap-1 border rounded-2 bg-body p-2 mt-2 shadow-sm">
          {!country.archived&&<button type="button" className="dropdown-item"
           onClick={event=>{
            event.currentTarget.closest("details")?.removeAttribute("open");
            renameOpenerCode.current=country.code;
            setForm({mode:"rename",country});
           }}>{t("countries.renameAction")}</button>}
          <button type="button" className="dropdown-item"
           onClick={event=>{
            event.currentTarget.closest("details")?.removeAttribute("open");
            lifecycleOpenerCode.current=country.code;
            setLifecycle(country);
           }}>{t(country.archived?"countries.lifecycleReactivateAction":
             "countries.lifecycleArchiveAction")}</button>
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
    onClick={()=>{setQuery("");setFilter("all");setArchiveFilter("active");}}>
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
   <p className="small text-muted mb-0">{t("countries.importMovedHint")}</p>
  </div>}

  {canManage&&lifecycle&&<CountryLifecycleModal
   key={lifecycle.code+":"+lifecycle.revision} country={lifecycle}
   onClose={()=>setLifecycle(null)} onSaved={async(action)=>{
    setLifecycle(null);
    setArchiveFilter(value=>visibilityAfterLifecycle(value,action));
    setNotice(action==="archive"?"lifecycleArchived":"lifecycleReactivated");
    try{await refresh();}catch{setLoadFailed(true);setNotice("savedRefreshFailed");}
   }}/>}
  {canManage&&form&&<CountryFormModal key={form.mode+":"+(form.country?.code??"new")}
   mode={form.mode} country={form.country} onClose={()=>{
    setForm(null);
    const code=renameOpenerCode.current;
    renameOpenerCode.current=null;
    requestAnimationFrame(()=>{
     const trigger=code?Array.from(document.querySelectorAll<HTMLElement>(
      "[data-country-actions]")).find(el=>el.dataset.countryActions===code)
       ?.querySelector<HTMLElement>("summary"):null;
     (trigger??addCountryRef.current??archiveFilterRef.current)?.focus();
    });
   }}
   onSaved={onFormSaved}/>}

  {activeCountry&&<CountryCalendarModal key={activeCountry.code+":"+selectedYear}
   country={activeCountry} initialYear={selectedYear} onClose={closeCalendar}
   canManage={canManage&&!activeCountry.archived} onChanged={refresh}/>}
 </section>;
}
