"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {useLocale,useTranslation} from "@/i18n/client";
import {annualDisplayStatus,type TechnicalCoverage,type AnnualDisplayStatus}
 from "@/lib/countries/year-status";
import {isoCivilDate,mondayFirstMonthCells,moveCalendarMonth}
 from "@/lib/countries/month-grid";
import CountryFlag from "./country-flag";
import CountryHolidayEditorPanel,{type HolidayEdit} from "./country-holiday-editor-panel";
import CountryYearValidationPanel from "./country-year-validation-panel";
import CountryHolidayImportPanel from "./country-holiday-import-panel";
import {parseYearSnapshot,type YearSnapshot} from "@/lib/countries/holiday-editor";
import {navigableImportYears,primaryYear,type ImportOutcome}
 from "@/lib/countries/import-navigation";

type Country={code:string;name:string;nationalCalendar:{years:TechnicalCoverage[]}};
type Mode="list"|"calendar";
type LoadState={kind:"loading"}|{kind:"error"}|{kind:"ready";snapshot:YearSnapshot};

const statusCss=(status:AnnualDisplayStatus):string=>
 status==="configured"?"text-bg-success":status==="invalid"?"text-bg-danger":
 status==="review"?"text-bg-warning":"text-bg-secondary";

function AnnualHolidays({code,name,year,month,mode,onYearStatus,onChanged,canManage,onEditingChange,onShowList,onImportDone}:{
 code:string;name:string;year:number;month:number;mode:Mode;canManage:boolean;
 onShowList:()=>void;
 onImportDone:(outcome:ImportOutcome)=>void;
 onYearStatus:(status:AnnualDisplayStatus)=>void;
 onChanged:()=>Promise<void>;
 onEditingChange:(active:boolean)=>void;
}){
 const t=useTranslation(),locale=useLocale();
 const [load,setLoad]=useState<LoadState>({kind:"loading"});
 const [retry,setRetry]=useState(0);
 const [selectedDate,setSelectedDate]=useState<string|null>(null);
 const [editor,setEditor]=useState<HolidayEdit|null>(null);
 const [validationOpen,setValidationOpen]=useState(false);
 const [importOpen,setImportOpen]=useState(false);
 const [savedNotice,setSavedNotice]=useState("");
 const [refreshNotice,setRefreshNotice]=useState("");
 const addButton=useRef<HTMLButtonElement>(null);
 const validateButton=useRef<HTMLButtonElement>(null);
 const importButton=useRef<HTMLButtonElement>(null);
 const listRef=useRef<HTMLTableElement>(null);
 const pendingFocusDate=useRef<string|null|undefined>(undefined);
 const editOrigin=useRef<HTMLButtonElement|null>(null);
 const returnFocus=useRef(false);
 const loadKey=code+":"+year;
 function restoreEditorFocus(){
  requestAnimationFrame(()=>{
   const element=editOrigin.current;
   if(element?.isConnected)element.focus();
   else addButton.current?.focus();
  });
 }
 function openImport(){
  if(editor||validationOpen||importOpen||!snapshot)return;
  setSavedNotice("");setRefreshNotice("");
  setImportOpen(true);onEditingChange(true);
 }
 function cancelImport(){
  setImportOpen(false);onEditingChange(false);
  requestAnimationFrame(()=>importButton.current?.focus());
 }
 function completedImport(outcome:ImportOutcome){
  // The server has already committed. Never retry the POST during navigation.
  setImportOpen(false);
  onImportDone(outcome);
 }
 function openValidation(){
  if(editor||validationOpen||importOpen||!snapshot)return;
  setSavedNotice("");setRefreshNotice("");
  setValidationOpen(true);onEditingChange(true);
 }
 function cancelValidation(){
  setValidationOpen(false);onEditingChange(false);
  requestAnimationFrame(()=>validateButton.current?.focus());
 }
 function inspectValidationDates(date:string|null){
  setValidationOpen(false);onEditingChange(false);
  pendingFocusDate.current=date;
  onShowList();
  setLoad({kind:"loading"});
  setRetry(n=>n+1);
 }
 function validatedYear(){
  setValidationOpen(false);onEditingChange(false);
  setSavedNotice(t("countries.validationSuccess"));
  returnFocus.current=false;
  setLoad({kind:"loading"});setRetry(n=>n+1);
  void onChanged().catch(()=>setRefreshNotice(t("countries.savedRefreshFailed")));
 }
 function startEdit(action:HolidayEdit,origin:HTMLButtonElement){
  editOrigin.current=origin;
  setSavedNotice("");setRefreshNotice("");
  setEditor(action);onEditingChange(true);
 }
 function cancelEdit(){
  setEditor(null);onEditingChange(false);
  restoreEditorFocus();
 }
 function savedEdit(){
  setEditor(null);onEditingChange(false);
  setSavedNotice(t("countries.editSaved"));
  returnFocus.current=true;
  setLoad({kind:"loading"});
  setRetry(n=>n+1);
  void onChanged().catch(()=>setRefreshNotice(t("countries.savedRefreshFailed")));
 }
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/countries/calendar?country="+encodeURIComponent(code)+
   "&year="+year,{cache:"no-store",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error("calendar-read-failed");
    return response.json() as Promise<unknown>;
   })
   .then(result=>{
    if(controller.signal.aborted)return;
    const parsed=parseYearSnapshot(result,code,year);
    if(!parsed)throw Error("calendar-response-mismatch");
    setLoad({kind:"ready",snapshot:parsed});
   })
   .catch(()=>{if(!controller.signal.aborted)setLoad({kind:"error"});});
  return ()=>controller.abort();
 },[code,year,retry]);

 const language=locale==="en"?"en-GB":"fr-FR";
 const weekdays=useMemo(()=>Array.from({length:7},(_,index)=>
  new Intl.DateTimeFormat(language,{weekday:"short",timeZone:"UTC"})
   .format(new Date(Date.UTC(2026,0,5+index)))),[language]);
 const cells=useMemo(()=>mondayFirstMonthCells(year,month),[year,month]);
 const snapshot=load.kind==="ready"?load.snapshot:null;
 const holidays=useMemo(()=>snapshot?.holidays??[],[snapshot]);
 const status=annualDisplayStatus(snapshot&&snapshot.status!==null?
  {year,status:snapshot.status,count:holidays.length,
   diagnostic:null,administrativeValidated:snapshot.administrativeValidated}:undefined);
 useEffect(()=>{
  if(snapshot)onYearStatus(status);
 },[snapshot,onYearStatus,status]);
 useEffect(()=>{
  if(load.kind==="ready"&&returnFocus.current&&!editor){
   returnFocus.current=false;
   restoreEditorFocus();
  }
 },[load.kind,editor]);
 useEffect(()=>{
  if(load.kind!=="ready"||mode!=="list"||pendingFocusDate.current===undefined)return;
  const date=pendingFocusDate.current;
  pendingFocusDate.current=undefined;
  const frame=requestAnimationFrame(()=>{
   const row=date?Array.from(listRef.current?.querySelectorAll<HTMLTableRowElement>(
    "[data-holiday-date]")??[]).find(x=>x.dataset.holidayDate===date):null;
   (row??listRef.current??addButton.current)?.focus();
  });
  return ()=>cancelAnimationFrame(frame);
 },[load.kind,mode]);
 const byDate=useMemo(()=>new Map(holidays.map(h=>[h.date,h])),[holidays]);
 const selected=selectedDate?.startsWith(String(year)+"-"+String(month+1).padStart(2,"0")+"-")?
  byDate.get(selectedDate):undefined;
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
 return <div className="d-grid gap-3" data-country-year={loadKey}>
  {savedNotice&&<p role="status" className="alert alert-success mb-0">{savedNotice}</p>}
  {refreshNotice&&<p role="alert" className="alert alert-warning mb-0">{refreshNotice}</p>}
  {canManage&&!editor&&!validationOpen&&!importOpen&&<div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
   <span className="small text-muted">
    {t("countries.editRegisteredDates",{count:holidays.length})}
   </span>
   <div className="d-flex flex-wrap gap-2">
    <button ref={importButton} type="button" className="btn btn-sm btn-outline-secondary"
     onClick={openImport}>{t("countries.importOpen")}</button>
    <button ref={validateButton} type="button" className="btn btn-sm btn-outline-primary"
     disabled={snapshot?.administrativeValidated===true} onClick={openValidation}>
     {snapshot?.administrativeValidated?t("countries.validationAlreadyDone"):
      t("countries.validationOpen")}
    </button>
    <button ref={addButton} type="button" className="btn btn-sm btn-primary"
     onClick={event=>startEdit({action:"create"},event.currentTarget)}>
     {t("countries.editAddTitle")}
    </button>
   </div>
  </div>}
  {status==="invalid"&&<p className="alert alert-danger mb-0" role="status">
   {t("countries.calendarInvalidWarning")}
  </p>}
  {status==="unknown"&&<p className="alert alert-secondary mb-0" role="status">
   {t("countries.calendarUnknownWarning")}
  </p>}
  {holidays.length===0&&<p className="alert alert-light border mb-0" role="status">
   {t("countries.noDates")}
  </p>}
  {!importOpen&&(mode==="list"?(
   holidays.length>0&&<div className="table-responsive">
    <table ref={listRef} tabIndex={-1} className="table table-hover align-middle">
     <thead><tr>
      <th scope="col">{t("countries.csvDate")}</th>
      <th scope="col">{t("countries.csvName")}</th>
      {canManage&&<th scope="col">{t("countries.actions")}</th>}
     </tr></thead>
     <tbody>{holidays.map(holiday=><tr key={holiday.date} tabIndex={-1} data-holiday-date={holiday.date}>
      <td className="text-nowrap">{formatDate(holiday.date)}</td>
      <td>{holiday.name}</td>
      {canManage&&<td><div className="d-flex flex-wrap gap-2">
       <button type="button" className="btn btn-sm btn-outline-primary"
        disabled={editor!==null||validationOpen||importOpen}
        aria-label={t("countries.editUpdateNamed",{date:holiday.date})}
        onClick={event=>startEdit({action:"update",original:holiday},event.currentTarget)}>
        {t("countries.editUpdateAction")}
       </button>
       <button type="button" className="btn btn-sm btn-outline-danger"
        disabled={editor!==null||validationOpen||importOpen}
        aria-label={t("countries.editRemoveNamed",{date:holiday.date})}
        onClick={event=>startEdit({action:"delete",original:holiday},event.currentTarget)}>
        {t("countries.editRemoveAction")}
       </button>
      </div></td>}
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
  ))}
  {canManage&&importOpen&&<CountryHolidayImportPanel country={{code,name}}
   onCancel={cancelImport} onCommitted={completedImport}/>}
  {canManage&&validationOpen&&snapshot&&<CountryYearValidationPanel
   code={code} name={name} year={year}
   inspectedFingerprint={snapshot.fingerprint}
   onCancel={cancelValidation} onCertified={validatedYear}
   onInspectDates={inspectValidationDates}/>}
  {canManage&&editor&&snapshot&&<CountryHolidayEditorPanel key={editor.action+":"+(editor.original?.date??"new")}
   country={code} year={year} snapshot={snapshot} edit={editor}
   onCancel={cancelEdit} onSaved={savedEdit}/>}
  {!canManage&&<p className="small text-muted mb-0">{t("countries.calendarReadOnly")}</p>}
 </div>;
}

export default function CountryCalendarModal({country,initialYear,onClose,canManage,onChanged}:{
 country:Country;initialYear:number;onClose:()=>void;canManage:boolean;
 onChanged:()=>Promise<void>;
}){
 const t=useTranslation(),locale=useLocale();
 const dialog=useRef<HTMLDialogElement>(null);
 const [portalReady,setPortalReady]=useState(false);
 const firstFocus=useRef<HTMLSelectElement>(null);
 const [year,setYear]=useState(initialYear);
 const [month,setMonth]=useState(()=>Number(new Intl.DateTimeFormat("en-GB",{
  month:"numeric",timeZone:"Europe/Paris"}).format(new Date()))-1);
 const [mode,setMode]=useState<Mode>("list");
 const [editing,setEditing]=useState(false);
 const [latestStatus,setLatestStatus]=useState<AnnualDisplayStatus|null>(null);
 const [importOutcome,setImportOutcome]=useState<ImportOutcome|null>(null);
 const [reloadVersion,setReloadVersion]=useState(0);
 const [catalogRefreshProblem,setCatalogRefreshProblem]=useState(false);
 const firstImportYear=useRef<HTMLButtonElement>(null);
 function reloadImportCalendar(){
  setReloadVersion(n=>n+1);
  if(importOutcome?.committed)
   void onChanged().then(()=>setCatalogRefreshProblem(false))
    .catch(()=>setCatalogRefreshProblem(true));
 }
 function onImportDone(outcome:ImportOutcome){
  setEditing(false);
  setImportOutcome(outcome);
  setCatalogRefreshProblem(false);
  setMode("list");
  chooseYear(primaryYear(outcome,year));
  setReloadVersion(n=>n+1);
  if(outcome.committed)
   void onChanged().catch(()=>setCatalogRefreshProblem(true));
 }
 useEffect(()=>{
  if(!importOutcome)return;
  const frame=requestAnimationFrame(()=>firstImportYear.current?.focus());
  return ()=>cancelAnimationFrame(frame);
 },[importOutcome]);
 function chooseYear(next:number){setYear(next);setLatestStatus(null);}

 useEffect(()=>{queueMicrotask(()=>setPortalReady(true));},[]);
 useEffect(()=>{
  if(!portalReady)return;
  const node=dialog.current;
  if(node&&!node.open)node.showModal();
  firstFocus.current?.focus();
  return ()=>{if(node?.open)node.close();};
 },[portalReady]);

 const availableYears=useMemo(()=>Array.from(new Set([
  year,initialYear,initialYear-2,initialYear-1,initialYear+1,initialYear+2,
  ...country.nationalCalendar.years.map(y=>y.year),
  ...(importOutcome?navigableImportYears(importOutcome):[])
 ])).filter(value=>value>=1900&&value<=2200).sort((a,b)=>b-a),
 [country.nationalCalendar.years,initialYear,year,importOutcome]);
 const status=latestStatus??annualDisplayStatus(country.nationalCalendar.years.find(y=>y.year===year));
 const statusLabel=status==="configured"?t("countries.configured"):
  status==="review"?t("countries.statusReview"):
  status==="not-configured"?t("countries.notConfigured"):
  status==="invalid"?t("countries.invalidCalendar"):t("countries.statusUnknown");

 const changeMonth=(step:-1|1)=>{
  const next=moveCalendarMonth({year,month},step);
  chooseYear(next.year);setMonth(next.month);
 };
 const language=locale==="en"?"en-GB":"fr-FR";
 const monthHeading=new Intl.DateTimeFormat(language,{month:"long",year:"numeric",timeZone:"UTC"})
  .format(new Date(Date.UTC(year,month,1)));

 if(!portalReady)return null;
 // Place the native dialog at document level to avoid inherited modal/clipping contexts.
 return createPortal(<dialog ref={dialog} className="smn-country-calendar-dialog"
  aria-labelledby="smn-country-dialog-title" aria-describedby="smn-country-dialog-description"
  onCancel={event=>{if(editing)event.preventDefault();}}
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
     aria-label={t("countries.close")} disabled={editing} onClick={()=>dialog.current?.close()}/>
   </header>
   <div className="smn-country-calendar-toolbar">
    <div className="d-flex flex-wrap align-items-center gap-3">
     <div>
      <label htmlFor="smn-country-modal-year" className="form-label small mb-1">
       {t("countries.yearLabel")}
      </label>
      <div className="input-group input-group-sm">
       <button className="btn btn-outline-secondary" type="button"
        disabled={editing||year<=1900} aria-label={t("countries.previousYear")}
        onClick={()=>chooseYear(Math.max(1900,year-1))}>‹</button>
       <select ref={firstFocus} id="smn-country-modal-year" className="form-select"
        disabled={editing} value={year} onChange={event=>chooseYear(Number(event.target.value))}>
        {availableYears.map(value=><option key={value} value={value}>{value}</option>)}
       </select>
       <button className="btn btn-outline-secondary" type="button"
        disabled={editing||year>=2200} aria-label={t("countries.nextYear")}
        onClick={()=>chooseYear(Math.min(2200,year+1))}>›</button>
      </div>
     </div>
     <div aria-label={t("countries.yearStatus")}>
      <span className={"badge "+statusCss(status)}>{statusLabel}</span>
     </div>
     <div className="ms-auto" role="group" aria-label={t("countries.calendarViewMode")}>
      <div className="btn-group btn-group-sm">
       <button type="button" className={"btn "+(mode==="list"?"btn-primary":"btn-outline-primary")}
        aria-pressed={mode==="list"} disabled={editing} onClick={()=>setMode("list")}>
        {t("countries.calendarListView")}
       </button>
       <button type="button" className={"btn "+(mode==="calendar"?"btn-primary":"btn-outline-primary")}
        aria-pressed={mode==="calendar"} disabled={editing} onClick={()=>setMode("calendar")}>
        {t("countries.calendarMonthView")}
       </button>
      </div>
     </div>
    </div>
    {mode==="calendar"&&<div className="d-flex align-items-center justify-content-between gap-2 mt-3">
     <button type="button" className="btn btn-outline-secondary btn-sm"
      aria-label={t("countries.calendarPreviousMonth")}
      disabled={editing||(year===1900&&month===0)} onClick={()=>changeMonth(-1)}>‹</button>
     <h3 className="h6 text-capitalize mb-0" aria-live="polite">{monthHeading}</h3>
     <button type="button" className="btn btn-outline-secondary btn-sm"
      aria-label={t("countries.calendarNextMonth")}
      disabled={editing||(year===2200&&month===11)} onClick={()=>changeMonth(1)}>›</button>
    </div>}
   </div>
   <div className="smn-country-calendar-content">
    {importOutcome&&<div className="alert alert-info mb-3" role="status">
     <p className="fw-semibold mb-1">{importOutcome.committed&&
      importOutcome.created+importOutcome.replaced>0?
      t("countries.importSuccess",{created:importOutcome.created,replaced:importOutcome.replaced}):t("countries.importNoChanges")}</p>
     {!importOutcome.yearsVerified&&<p className="text-danger small">
      {t("countries.importYearsUnverified")}
     </p>}
     {catalogRefreshProblem&&<p className="text-danger small" role="alert">
      {t("countries.importCatalogRefreshFailed")}
     </p>}
     <p className="small mb-2">{importOutcome.changedYears.length>0?
      t("countries.importTouchedYears"):t("countries.importConsultYears")}</p>
     <div className="d-flex flex-wrap gap-2">
      {navigableImportYears(importOutcome).map((target,index)=>
       <button key={target} ref={index===0?firstImportYear:undefined}
        type="button" className={"btn btn-sm "+(year===target?
         "btn-primary":"btn-outline-primary")}
        aria-pressed={year===target}
        onClick={()=>{chooseYear(target);setMode("list");setReloadVersion(n=>n+1);}}>
        {target}
       </button>)}
      <button type="button" className="btn btn-sm btn-outline-secondary"
       onClick={reloadImportCalendar}>{t("countries.importRetryOpening")}</button>
      <button type="button" className="btn btn-sm btn-link"
       onClick={()=>setImportOutcome(null)}>{t("countries.importDismissSummary")}</button>
     </div>
    </div>}
    <AnnualHolidays key={country.code+":"+year+":"+reloadVersion} code={country.code} name={country.name}
     year={year} month={month} mode={mode} canManage={canManage} onShowList={()=>setMode("list")}
     onYearStatus={setLatestStatus} onChanged={onChanged}
     onImportDone={onImportDone} onEditingChange={setEditing}/>
   </div>
   <footer className="smn-country-calendar-footer">
    <span className="small text-muted">{canManage?t("countries.editAuditHint"):t("countries.calendarReadOnly")}</span>
    <button type="button" className="btn btn-outline-secondary"
     disabled={editing} onClick={()=>dialog.current?.close()}>{t("countries.close")}</button>
   </footer>
  </div>
 </dialog>,document.body);
}
