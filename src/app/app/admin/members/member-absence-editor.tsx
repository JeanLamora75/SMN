"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import Link from "next/link";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Slot="morning"|"afternoon";
type Category={id:string;name:string;color:string;isActive:boolean};
type Absence={id:string;revision:number;categoryId:string;categoryName:string;categoryColor:string;
 startOn:string;endOn:string;startSlot:Slot;endSlot:Slot;isPlanned:boolean;reason:string;
 createdAt:string;updatedAt:string};
type DayAvailability={
 onDate:string;countryIso2:string|null;assignmentApplicable:boolean;nationalHoliday:boolean|null;
 nationalHolidayName:string|null;companyClosureName:string|null;nationalCalendarStatus:string;
 status:"known"|"unknown";workingSlots:{morning:boolean;afternoon:boolean}|null;
 absenceSlots:{morning:boolean;afternoon:boolean};
 unavailableSlots:{morning:boolean;afternoon:boolean};
 availableSlots:{morning:boolean;afternoon:boolean}|null;
 deductedHalfDays:number|null;nationalOverlap:boolean;
};
type State={memberId:string;archived:boolean;categories:Category[];absences:Absence[];
 selectedDate:string|null;onDate:Absence[];dayAvailability?:DayAvailability|null};
type Form={id:string|null;revision:number;categoryId:string;startOn:string;endOn:string;
 startSlot:Slot;endSlot:Slot;isPlanned:boolean;reason:string};
const initial=(date:string):Form=>({id:null,revision:0,categoryId:"",startOn:date,
 endOn:date,startSlot:"morning",endSlot:"afternoon",isPlanned:true,reason:""});

export default function MemberAbsenceEditor({memberId,selectedOn,onDirtyChange,onSaved}:{
 memberId:string;selectedOn:string;onDirtyChange:(dirty:boolean)=>void;onSaved?:()=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<State|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [form,setForm]=useState<Form>(()=>initial(selectedOn));
 const [baseline,setBaseline]=useState(JSON.stringify(initial(selectedOn)));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const dirty=JSON.stringify(form)!==baseline;
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{onDirtyChange(dirty||busy);return ()=>onDirtyChange(false);},[dirty,busy,onDirtyChange]);
 const load=useCallback(async(date:string)=>{
  const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+
   "/absences?onDate="+encodeURIComponent(date),{cache:"no-store"});
  if(!response.ok)throw Error("absences-load-failed");
  const next=await response.json() as State;
  if(next.memberId!==memberId||!Array.isArray(next.categories)||!Array.isArray(next.absences))
   throw Error("absences-invalid");
  setData(next);setStatus("ready");
  return next;
 },[memberId]);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+
   "/absences?onDate="+encodeURIComponent(selectedOn),{cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("load");return response.json() as Promise<State>;})
   .then(next=>{if(!active)return;
    if(next.memberId!==memberId||!Array.isArray(next.categories)||!Array.isArray(next.absences))
     throw Error("invalid");
    setData(next);setStatus("ready");
   }).catch(()=>{if(active)setStatus("error");});
  return ()=>{active=false;};
 },[memberId,selectedOn]);
 const reset=()=>{
  const v=initial(selectedOn);setForm(v);setBaseline(JSON.stringify(v));
  setError("");setMessage("");
 };
 const prepareRegional=()=>{
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  const next=initial(selectedOn);
  const category=data?.categories.find(c=>c.id==="other"&&c.isActive);
  next.categoryId=category?.id??"";
  setForm(next);setBaseline(JSON.stringify(initial(selectedOn)));
  setError("");setMessage("");
 };
 const edit=(record:Absence)=>{
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  const v:Form={id:record.id,revision:record.revision,categoryId:record.categoryId,
   startOn:record.startOn,endOn:record.endOn,startSlot:record.startSlot,
   endSlot:record.endSlot,isPlanned:record.isPlanned,reason:record.reason};
  setForm(v);setBaseline(JSON.stringify(v));setError("");setMessage("");
 };
 const update=<K extends keyof Form>(key:K,value:Form[K])=>
  setForm(v=>({...v,[key]:value}));
 const save=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(busy||data?.archived||!data)return;
  setBusy(true);setError("");setMessage("");
  try{
   const payload={action:form.id?"update":"create",
    ...(form.id?{id:form.id}:{}),revision:form.revision,
    categoryId:form.categoryId,startOn:form.startOn,endOn:form.endOn,
    startSlot:form.startSlot,endSlot:form.endSlot,isPlanned:form.isPlanned,
    reason:form.reason};
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/absences",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
   });
   const result=await response.json() as {error?:string;id?:string;revision?:number;created?:boolean};
   if(!response.ok){
    const translations:Record<string,string>={
     "reason-required":"reasonRequired","category-required":"categoryRequired",
     "category-inactive":"categoryInactive","invalid-period":"invalidPeriod",
     "overlap":"overlap","conflict":"conflict","archived":"archived",
     "not-found":"notFound","invalid-input":"invalidInput"
    };
    const key=translations[result.error??""]??"failed";
    setError(t(("members.absence."+key) as "members.absence.failed"));
    return;
   }
   await load(selectedOn);
   onSaved?.();
   const next=initial(selectedOn);setForm(next);setBaseline(JSON.stringify(next));
   setMessage(t(result.created?"members.absence.created":"members.absence.updated"));
  }catch{setError(t("members.absence.failed"));}
  finally{setBusy(false);}
 };
 const categories=data?.categories??[];
 return <section className="border-top pt-4 mt-4 d-grid gap-3" aria-labelledby="member-absences-heading">
  <h4 id="member-absences-heading" className="h6">{t("members.absence.title")}</h4>
  <p className="small text-secondary">{t("members.absence.centralInfo")}</p>
  <div className="d-grid gap-2">
   <p className="small text-secondary mb-0">{t("regionalAbsence.intro")}</p>
   <button type="button" className="btn btn-outline-primary btn-sm align-self-start"
    disabled={busy||data?.archived||status!=="ready"}
    onClick={prepareRegional}>{t("regionalAbsence.prepare")}</button>
  </div>
  <div><Link href="/app/admin/absence-categories" className="btn btn-sm btn-outline-secondary">
   {t("absenceCategories.open")}</Link></div>
  {status==="loading"&&<p role="status">{t("members.absence.loading")}</p>}
  {status==="error"&&<p className="alert alert-warning" role="alert">
   {t("members.absence.loadFailed")}
   <button type="button" className="btn btn-sm btn-outline-secondary ms-2"
    onClick={()=>{setStatus("loading");void load(selectedOn).catch(()=>setStatus("error"));}}>
    {t("common.retry")}</button>
  </p>}
  {data&&status==="ready"&&<>
   {data.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   {data.dayAvailability&&<div className="small border rounded p-3" role="status">
    <h5 className="h6">{t("regionalAbsence.dayReview")}</h5>
    <p className="mb-1">{t("regionalAbsence.dayLabel",{date:selectedOn})}</p>
    {!data.dayAvailability.assignmentApplicable&&
     <p className="mb-1">{t("regionalAbsence.noApplicableAssignment")}</p>}
    {data.dayAvailability.companyClosureName&&
     <p className="mb-1">{t("companyClosures.shortLabel")} {data.dayAvailability.companyClosureName}</p>}
    {data.dayAvailability.nationalHoliday===true&&
     <p className="mb-1">{t("regionalAbsence.nationalHoliday",{name:data.dayAvailability.nationalHolidayName??""})}</p>}
    {data.dayAvailability.nationalOverlap&&
     <p className="mb-1">{t("regionalAbsence.notDoubleCounted")}</p>}
    {data.dayAvailability.assignmentApplicable&&data.dayAvailability.status==="known"&&data.dayAvailability.deductedHalfDays!==null?
     <p className="mb-1">{t("regionalAbsence.unavailableHalfDays",{
      count:data.dayAvailability.deductedHalfDays})}</p>:
     data.dayAvailability.assignmentApplicable?
      <p className="mb-1">{t("regionalAbsence.unknownAvailability")}</p>:null}
    <p className="text-secondary mb-0">{t("regionalAbsence.capacityPending")}</p>
   </div>}
   <p className="small text-secondary">{t("prefill.noInventedAbsence")}</p>
   <form onSubmit={save} className="d-grid gap-3">
    <h5 className="h6">{t(form.id?"members.absence.editTitle":"members.absence.newTitle")}</h5>
    <div className="row g-2">
     <div className="col-md-6"><label className="form-label" htmlFor="absence-start">
      {t("members.absence.startOn")}</label>
      <input type="date" id="absence-start" className="form-control" value={form.startOn}
       min="1900-01-01" max="2200-12-31" required disabled={busy||data.archived}
       onChange={e=>update("startOn",e.target.value)}/></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-end">
      {t("members.absence.endOn")}</label>
      <input type="date" id="absence-end" className="form-control" value={form.endOn}
       min="1900-01-01" max="2200-12-31" required disabled={busy||data.archived}
       onChange={e=>update("endOn",e.target.value)}/></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-start-slot">
      {t("members.absence.startSlot")}</label>
      <select id="absence-start-slot" className="form-select" disabled={busy||data.archived}
       value={form.startSlot} onChange={e=>update("startSlot",e.target.value as Slot)}>
       <option value="morning">{t("members.calendar.morning")}</option>
       <option value="afternoon">{t("members.calendar.afternoon")}</option>
      </select></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-end-slot">
      {t("members.absence.endSlot")}</label>
      <select id="absence-end-slot" className="form-select" disabled={busy||data.archived}
       value={form.endSlot} onChange={e=>update("endSlot",e.target.value as Slot)}>
       <option value="morning">{t("members.calendar.morning")}</option>
       <option value="afternoon">{t("members.calendar.afternoon")}</option>
      </select></div>
    </div>
    <div><label className="form-label" htmlFor="absence-category">{t("members.absence.category")}</label>
     <select id="absence-category" value={form.categoryId} required className="form-select"
      disabled={busy||data.archived} onChange={e=>update("categoryId",e.target.value)}>
      <option value="">{t("members.absence.selectCategory")}</option>
      {categories.filter(c=>c.isActive||c.id===form.categoryId).map(c=>
       <option key={c.id} value={c.id} disabled={!c.isActive&&c.id!==form.categoryId}>
        {c.name}{!c.isActive?" ("+t("members.absence.inactive")+")":""}
       </option>)}
     </select></div>
    <div><label className="form-label" htmlFor="absence-reason">{t("members.absence.reason")}</label>
     <input id="absence-reason" className="form-control" required maxLength={200}
      disabled={busy||data.archived} value={form.reason}
      onChange={e=>update("reason",e.target.value)}/>
     <p className="small text-secondary">{t("members.absence.noMedicalDetail")}</p></div>
    <label className="form-check-label">
     <input type="checkbox" className="form-check-input me-2" checked={form.isPlanned}
      disabled={busy||data.archived} onChange={e=>update("isPlanned",e.target.checked)}/>
     {t("members.absence.planned")}</label>
    <div className="d-flex flex-wrap gap-2">
     <button type="submit" className="btn btn-primary"
      disabled={busy||data.archived}>{t(form.id?"members.absence.saveEdit":"members.absence.save")}</button>
     {form.id&&<button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={reset}>{t("members.absence.newTitle")}</button>}
    </div>
   </form>
   <div className="border-top pt-3">
    <h5 className="h6">{t("members.absence.historyTitle")}</h5>
    {data.absences.length===0?<p className="small text-secondary">{t("members.absence.none")}</p>:
     <div className="table-responsive"><table className="table table-sm">
      <thead><tr><th>{t("members.absence.period")}</th>
       <th>{t("members.absence.category")}</th><th>{t("members.absence.reason")}</th>
       <th>{t("members.absence.type")}</th><th>{t("members.absence.action")}</th></tr></thead>
      <tbody>{data.absences.map(item=><tr key={item.id}>
       <td><span>{item.startOn} ({t(item.startSlot==="morning"?
        "members.calendar.morning":"members.calendar.afternoon")})</span>
        <span className="d-block">→ {item.endOn} ({t(item.endSlot==="morning"?
        "members.calendar.morning":"members.calendar.afternoon")})</span></td>
       <td><span aria-hidden="true" className="d-inline-block rounded-circle me-2"
        style={{width:"0.8em",height:"0.8em",backgroundColor:item.categoryColor}}/>
        <span>{item.categoryName}</span></td>
       <td>{item.reason}</td>
       <td>{t(item.isPlanned?"members.absence.plannedShort":"members.absence.unplanned")}</td>
       <td><button type="button" className="btn btn-sm btn-outline-primary"
        disabled={busy||data.archived} onClick={()=>edit(item)}>{t("members.absence.edit")}</button></td>
      </tr>)}</tbody></table></div>}
    <p className="small text-secondary">{t("members.absence.historyNote")}</p>
   </div>
  </>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="alert alert-success">{message}</p>}
 </section>;
}
